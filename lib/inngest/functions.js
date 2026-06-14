import { GoogleGenerativeAI } from "@google/generative-ai";
import { inngest } from "./client";
import { db } from "../prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const MODEL_CANDIDATES = [
    process.env.GEMINI_MODEL,
    "models/gemini-2.5-flash",
    "models/gemini-2.5-pro",
    "models/gemini-flash-latest",
    "models/gemini-pro-latest",
    "models/gemini-2.0-flash",
    "models/gemini-2.0-flash-001",
].filter(Boolean);

async function generateWithFallbackModels(prompt) {
    let lastError;

    for (const modelName of MODEL_CANDIDATES) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                },
                systemInstruction:
                    "Output only valid JSON using the required schema. Do not add any other text.",
            });

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text =
                typeof response.text === "function"
                    ? response.text().trim()
                    : response.candidates?.[0]?.content?.parts?.[0]?.text || "";

            if (!text) {
                throw new Error(`Empty response from model ${modelName}`);
            }

            return parseJsonFromModelOutput(text);
        } catch (error) {
            lastError = error;
            console.warn(`Model ${modelName} failed: ${error?.message || error}`);
            continue;
        }
    }

    if (lastError) {
        throw lastError;
    }

    throw new Error("Unable to generate valid insights from any configured model.");
}

export const generateIndustryInsights = inngest.createFunction(
    {
        name: "Generate Industry Insights",
        triggers: { cron: "0 0 * * 0" },
    },
    async ({ step }) => {
        const industries = await step.run("Fetch industries", async () => {
            return await db.industryInsight.findMany({
                select: { industry: true},
            });
        });

        for(const {industry} of industries){
             const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;
         const insights = await generateWithFallbackModels(prompt);

         await step.run(`Update ${industry} insights` , async () => {
            await db.industryInsight.update({
                where: { industry },
                data: {
                    ...insights,
                    lastUpdated: new Date(),
                    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
         });
        }
    }
);