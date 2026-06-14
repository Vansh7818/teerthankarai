
"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-1.5",
  "gemini-1.5-flash",
  "gemini-1.5-mini",
  "gemini-1.5-pro",
  // Add a PaLM/text fallback model in case Gemini variants are unavailable
  "text-bison-001",
].filter(Boolean);

// Optionally filter candidates against the models available from the API
async function getAvailableModelCandidates() {
  try {
    if (typeof genAI.listModels === "function") {
      const list = await genAI.listModels();
      // list may be an array of model objects or an object with a 'models' field
      const models = Array.isArray(list) ? list : list?.models || [];
      const names = models
        .map((m) => m?.name || m?.model || m?.id || m?.displayName)
        .filter(Boolean);

      // For each candidate, try to find a matching available model entry and
      // return the actual model id/name (e.g. "models/gemini-1.5-flash") so
      // we call the exact supported model string.
      const mapped = [];
      for (const candidate of MODEL_CANDIDATES) {
        // exact match first
        let found = names.find((n) => n === candidate);
        if (!found) {
          // substring match (handles "models/gemini-1.5-flash")
          found = names.find((n) => n.toLowerCase().includes(candidate.toLowerCase()));
        }
        if (found) mapped.push(found);
      }

      // If we found any mapped model ids, return them; otherwise return the raw candidates
      return mapped.length ? mapped : MODEL_CANDIDATES;
    }
  } catch (err) {
    console.warn("Could not list Gemini models, falling back to default candidates:", err?.message || err);
  }

  return MODEL_CANDIDATES;
}

function buildInsightPrompt(profile) {
  const industry = profile.industry || "general";
  const experience = profile.experience != null ? profile.experience : "unspecified";
  const bio = profile.bio ? profile.bio : "No additional bio provided.";
  const skills = Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills || "No skills provided.";

  return `You are an AI assistant that outputs only valid JSON and nothing else. Do not include markdown, bullet points, headings, or extra text.

The user is working in the ${industry} field.
User experience: ${experience} years.
User bio: ${bio}
User skills: ${skills}

Generate industry insights specific to this profile using this exact JSON schema:

{
  "salaryRanges":[
    {
      "role":"string",
      "min":number,
      "max":number,
      "median":number,
      "location":"string"
    }
  ],
  "growthRate":number,
  "demandLevel":"HIGH",
  "marketOutlook":"POSITIVE",
  "topSkills":["skill1","skill2"],
  "keyTrends":["trend1","trend2"],
  "recommendedSkills":["skill1","skill2"]
}

IMPORTANT:
- Return ONLY valid JSON
- No markdown
- No explanation
- Use real roles, salaries, skills, and trends appropriate to the user's industry
- Do not repeat the same generic values for every industry
- demandLevel must be one of HIGH, MEDIUM, LOW
- marketOutlook must be one of POSITIVE, NEUTRAL, NEGATIVE
- Include at least 5 different salary roles
- Include at least 5 skills and trends
`;
}

function parseJsonFromModelOutput(text) {
  const cleanedText = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleanedText.indexOf("{");
  const lastBrace = cleanedText.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error(`Unable to extract JSON from AI response: ${cleanedText}`);
  }

  return JSON.parse(cleanedText.slice(firstBrace, lastBrace + 1));
}

async function generateWithFallbackModels(prompt) {
  const candidates = await getAvailableModelCandidates();
  for (const modelName of candidates) {
    try {
      // Try several model-name variants for this candidate to handle API naming differences
      const variants = [modelName];
      if (!String(modelName).startsWith("models/")) {
        variants.push(`models/${modelName}`);
        variants.push(`models/generative-${modelName}`);
      }

      let lastErr;
      for (const mName of variants) {
        try {
          const model = genAI.getGenerativeModel({
            model: mName,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
            systemInstruction:
              "Output only valid JSON using the required schema. Do not add any other text.",
          });

          const result = await model.generateContent(prompt);
          const response = result.response;
          const text = (typeof response.text === "function") ? response.text().trim() : (response.candidates?.[0]?.content?.parts?.[0]?.text || "");

          if (!text) throw new Error(`Empty response from model ${mName}`);

          return parseJsonFromModelOutput(text);
        } catch (err) {
          lastErr = err;
          const msg = err?.message || err;
          // If 404 for this variant, try the next variant
          console.warn(`Model variant ${mName} failed: ${msg}`);
          // continue to next variant
          continue;
        }
      }

      // If all variants for this candidate failed, throw the last error to be caught by outer handler
      if (lastErr) throw lastErr;
    } catch (error) {
      const message = error?.message || error;
      console.warn(`Gemini model ${modelName} failed: ${message}`);
      continue;
    }
  }
  throw new Error("Unable to generate valid insights from any configured Gemini model.");
}

export const generateAIInsights = async (profile) => {
  const prompt = buildInsightPrompt(profile);

  try {
    return await generateWithFallbackModels(prompt);
  } catch (error) {
    console.error(
      "AI insight generation failed:",
      error?.message || error
    );

    return null;
  }
};

export async function getIndustryInsights() {
  const { userId } = await auth();

  if (!userId)
    throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
    include: {
      industryInsight: true,
    },
  });

  if (!user)
    throw new Error("User not found");

  if (!user.industry)
    throw new Error(
      "User has not completed onboarding"
    );

  // If already exists
  if (user.industryInsight) {
    return user.industryInsight;
  }

  // Generate new insights
  const insights = await generateAIInsights(
    user.industry
  );

  const industryInsight =
    await db.industryInsight.create({
      data: {
        industry: user.industry,
        ...insights,
        nextUpdate: new Date(
          Date.now() +
            7 * 24 * 60 * 60 * 1000
        ),
      },
    });

  return industryInsight;
}