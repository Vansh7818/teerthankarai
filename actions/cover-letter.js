"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY || "";

const MODEL_CANDIDATES = [
    process.env.GEMINI_MODEL,
    "models/gemini-flash-latest",
    "models/gemini-2.5-flash",
    "gemini-2.5-flash",
].filter(Boolean);

async function getAvailableModelCandidates() {
    const genAI = new GoogleGenerativeAI(geminiApiKey);

    if (typeof genAI.listModels !== "function") {
        return MODEL_CANDIDATES;
    }

    try {
        const list = await genAI.listModels();
        const models = Array.isArray(list) ? list : list?.models || [];
        const names = models
            .map((model) => model?.name || model?.model || model?.id || model?.displayName)
            .filter(Boolean);

        const mapped = [];

        for (const candidate of MODEL_CANDIDATES) {
            const exact = names.find((name) => name === candidate);
            if (exact) {
                mapped.push(exact);
                continue;
            }

            const fuzzy = names.find((name) =>
                String(name).toLowerCase().includes(String(candidate).toLowerCase())
            );

            if (fuzzy) {
                mapped.push(fuzzy);
            }
        }

        return mapped.length ? mapped : MODEL_CANDIDATES;
    } catch (error) {
        console.warn(
            "Could not list Gemini models, using fallback candidates:",
            error?.message || error
        );
        return MODEL_CANDIDATES;
    }
}

function getResponseText(response) {
    if (!response) return "";

    if (typeof response.text === "function") {
        return response.text().trim();
    }

    return (
        response.text?.trim?.() ||
        response.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() ||
        ""
    );
}

export async function generateCoverLetter(data) {
    if (!geminiApiKey) {
        throw new Error("Missing GEMINI_API_KEY in environment.");
    }

    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

     const user = await db.user.findUnique({
        where : { clerkUserId: userId },
     });

     if (!user) throw new Error("User not found");

     const prompt = `
     Write a professional cover letter for a ${data.jobTitle} position at ${data.companyName}.
     About the candidate:
    - Industry: ${user.industry}
    - Years of Experience: ${user.experience}
    - Skills: ${user.skills?.join(", ")}
    - Professional Background: ${user.bio}
    
    Job Description:
    ${data.jobDescription}
    
    Requirements:
    1. Use a professional, enthusiastic tone
    2. Highlight relevant skills and experience
    3. Show understanding of the company's needs
    4. Keep it concise (max 400 words)
    5. Use proper business letter formatting in markdown
    6. Include specific examples of achievements
    7. Relate candidate's background to job requirements
    
    Format the letter in markdown.
    `;

    const genAI = new GoogleGenerativeAI(geminiApiKey);

    try {
        const candidates = await getAvailableModelCandidates();
        let lastError;

        for (const candidate of candidates) {
            try {
                const model = genAI.getGenerativeModel({
                    model: candidate,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 8192,
                    },
                    systemInstruction:
                        "Write a polished cover letter in markdown and nothing else.",
                });

                const result = await model.generateContent(prompt);
                const content = getResponseText(result.response);

                if (!content) {
                    throw new Error("The AI response was empty.");
                }

                const coverLetter = await db.coverLetter.create({
                    data: {
                        content,
                        jobDescription: data.jobDescription,
                        companyName: data.companyName,
                        jobTitle: data.jobTitle,
                        status: "completed",
                        userId: user.id,
                    },
                });

                return coverLetter;
            } catch (error) {
                lastError = error;
                console.warn(
                    `Cover-letter model candidate ${candidate} failed:`,
                    error?.message || error
                );
            }
        }

        throw lastError || new Error("Failed to generate cover letter.");
    } catch (error) {
        console.error("Error generating cover letter:", error);
        throw new Error(error?.message || "Failed to generate cover letter");
    }
}

export async function getCoverLetters() {
    const { userId } = await auth();
    if(!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId : userId },
    });

    if (!user) throw new Error("User not found");

    return await db.coverLetter.findMany({
        where: {
            userId: user.id,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function getCoverLetter(id) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    return await db.coverLetter.findUnique({
        where: {
            id,
            userId: user.id,
        },
    });
}

export async function deleteCoverLetter(id) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId : userId },
    });

    if (!user) throw new Error("User not found");

    return await db.coverLetter.delete({
        where: {
            id,
            userId: user.id,
        },
    });
}

export async function updateCoverLetter(id, content) {
  try {
    const updated = await db.coverLetter.update({
      where: {
        id,
      },

      data: {
        content,
      },
    });

    return updated;
  } catch (error) {
    throw new Error("Failed to update cover letter");
  }
}