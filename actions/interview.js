"use server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(geminiApiKey);

const MODEL_CANDIDATES = [
    process.env.GEMINI_MODEL,
    "models/gemini-flash-latest",
    "models/gemini-2.5-flash",
].filter(Boolean);

async function getAvailableModelCandidates() {
    if (typeof genAI.listModels !== "function") {
        return MODEL_CANDIDATES;
    }

    try {
        const list = await genAI.listModels();
        const models = Array.isArray(list) ? list : list?.models || [];
        const names = models
            .map((m) => m?.name || m?.model || m?.id || m?.displayName)
            .filter(Boolean);

        const mapped = [];
        for (const candidate of MODEL_CANDIDATES) {
            let found = names.find((n) => n === candidate);
            if (!found) {
                found = names.find((n) =>
                    String(n).toLowerCase().includes(String(candidate).toLowerCase())
                );
            }
            if (found) mapped.push(found);
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
    return response.text?.trim?.() ||
        response.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() ||
        "";
}

function extractJson(text) {
    if (!text) {
        throw new Error("Empty text returned from AI model.");
    }

    const cleaned = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch (error) {
        // continue to extraction fallback
    }

    const objectStart = cleaned.indexOf("{");
    const objectEnd = cleaned.lastIndexOf("}");
    if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
        try {
            return JSON.parse(cleaned.slice(objectStart, objectEnd + 1));
        } catch (error) {
            // ignore and try array fallback
        }
    }

    const arrayStart = cleaned.indexOf("[");
    const arrayEnd = cleaned.lastIndexOf("]");
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
        try {
            return JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1));
        } catch (error) {
            // ignore and throw below
        }
    }

    throw new Error(`Unable to extract JSON from AI response: ${cleaned}`);
}

function normalizeQuestions(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    const questions =
        payload?.questions ||
        payload?.question ||
        payload?.data?.questions ||
        payload?.data?.question;

    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("AI response did not include a valid questions array.");
    }

    return questions;
}

async function generateQuizPayload(prompt) {
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
                systemInstruction: "Output only valid JSON and nothing else.",
            });

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = getResponseText(response);
            const payload = extractJson(text);

            return payload;
        } catch (error) {
            lastError = error;
            console.warn(`Model candidate ${candidate} failed:`, error?.message || error);
        }
    }

    throw lastError || new Error("Unable to generate quiz questions from any model.");
}

export async function generateQuiz() {
    if (!geminiApiKey) {
        throw new Error(
            "Missing GEMINI_API_KEY in environment. Please set it in your .env.local or deployment config."
        );
    }

    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId,
        },
    });
    if (!user) throw new Error("User not found");

    const industry = user.industry || "general";
    const skillText = user.skills?.length
        ? `with expertise in ${user.skills.join(", ")}`
        : "";

    const prompt = `
    Generate 10 technical interview questions for a ${industry}
    professional ${skillText}.

    Each question should be multiple choice with 4 options.

    Return only valid JSON with either a top-level "questions" or "question" array.

    Example:
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }
    `;

    try {
        const payload = await generateQuizPayload(prompt);
        return normalizeQuestions(payload);
    } catch (error) {
        console.error("Error generating quiz:", error);
        throw new Error(
            `Failed to generate quiz questions: ${error?.message || "unknown error"}`
        );
    }
}

export async function saveQuizResult(questions, answers, score) {
    const { userId } = await auth();
    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId,
        },
    });
    if (!user) throw new Error("User not found");

    const questionResults = questions.map((q, index) => ({
        question: q.question,
        answer: q.correctAnswer,
        userAnswer: answers[index],
        isCorrect: q.correctAnswer === answers[index],
        explanation: q.explanation,
    }));

    const wrongAnswers = questionResults.filter((q) => !q.isCorrect);
    let improvementTip = null;

    if (wrongAnswers.length > 0) {
        const wrongQuestionsText = wrongAnswers
            .map(
                (q) =>
                    `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
            )
            .join("\n\n");

        const improvementPrompt = `
        The user got the following ${user.industry} technical interview questions wrong: ${wrongQuestionsText}

        Based on these mistakes, provide a concise, specific improvement tip.
        Focus on the knowledge gaps revealed by these wrong answers.
        Keep the response under 2 sentences and make it encouraging.
        Don't explicitly mention the mistakes, instead focus on what to learn/practice.
        `;
        try {
            const availableCandidates = await getAvailableModelCandidates();
            const improvementModel = genAI.getGenerativeModel({
                model: availableCandidates[0],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                },
                systemInstruction: "Output only plain text, no JSON or markdown.",
            });

            const result = await improvementModel.generateContent(improvementPrompt);
            const response = result.response;
            improvementTip = getResponseText(response);

            if(!improvementTip?.trim()) {
                improvementTip = "Focus on improving conceptual clarity and continuing practicing technical interview questions regularly.";
            }
        } catch (error) {
            console.error("Error generating improvement tip:", error);
            improvementTip = "Focus on strenthening your core technical concepts and practice more industry based questions.";
        }
    }

    try {
        const assessment = await db.assessment.create({
            data: {
                userId: user.id,
                quizScore: score,
                questions: questionResults,
                category: "Technical",
                improvementTip,
            },
        });

        return {
            id: assessment.id,
            quizScore: assessment.quizScore,
            questions: assessment.questions,
            improvementTip: assessment.improvementTip,
        };
    } catch (error) {
        console.error("Error saving quiz result:", error);
        throw new Error("Failed to save quiz result");
    }
}

export async function getAssessments() {
    const { userId } = await auth();
    if ( !userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId,
        },
    });

    if (!user) throw new Error("User not found");

    try {
       const assessments = await db.assessment.findMany({
        where: {
            userId: user.id,
        },
        orderBy: {
            createdAt: "asc",
        },
       });

       return assessments;
    }
    catch (error) {
        console.error("Error fetching assessments:", error);
        throw new Error("Failed to fetch assessments");
    }
}
