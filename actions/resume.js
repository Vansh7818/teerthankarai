"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

// Gemini setup (safe + stable model)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // stable working model
});


// -------------------------
// SAVE RESUME
// -------------------------
export async function saveResume(content) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId,
        },
    });

    if (!user) throw new Error("User not found");

    try {
        const resume = await db.resume.upsert({
            where: {
                userId: user.id,
            },
            update: {
                content,
            },
            create: {
                userId: user.id,
                content,
            },
        });

        revalidatePath("/resume");
        return resume;
    } catch (error) {
        console.error("Error saving resume:", error);
        throw new Error("Failed to save resume");
    }
}


// -------------------------
// GET RESUME
// -------------------------
export async function getResume() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    return await db.resume.findUnique({
        where: {
            userId: user.id,
        },
    });
}


// -------------------------
// AI IMPROVEMENT FUNCTION
// -------------------------
export async function improveWithAI({ current, type }) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
        include: {
            industryInsight: true,
        },
    });

    if (!user) throw new Error("User not found");

    const industry =
        user.industryInsight?.industry ||
        "software engineering";

    const prompt = `
As an expert resume writer, improve the following ${type} description for a ${industry} professional.

Make it more impactful, quantifiable, and aligned with industry standards.

Current content:
"${current}"

Requirements:
1. Use strong action verbs
2. Add measurable impact (numbers, results, scale)
3. Highlight technical skills clearly
4. Keep it concise and ATS-friendly
5. Focus on achievements, not responsibilities
6. Use industry-relevant keywords

Return ONLY a single improved paragraph.
No explanation. No formatting. No extra text.
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;

        const improvedContent = await response.text();

        return improvedContent.trim();
    } catch (error) {
        console.error("Error improving content:", error);

        // IMPORTANT: show real error for debugging
        throw new Error(
            error?.message || "Failed to improve content using AI"
        );
    }
}

// "use server";

// import { db } from "@/lib/prisma";
// import { auth, currentUser } from "@clerk/nextjs/server";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { revalidatePath } from "next/cache";

// // Gemini setup
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// const model = genAI.getGenerativeModel({
//   model: "gemini-2.5-flash",
// });

// // -----------------------------------
// // HELPER: GET OR CREATE USER
// // -----------------------------------
// async function getOrCreateUser() {
//   const { userId } = await auth();

//   if (!userId) {
//     throw new Error("Unauthorized");
//   }

//   // Try finding existing user
//   let user = await db.user.findUnique({
//     where: {
//       clerkUserId: userId,
//     },
//     include: {
//       industryInsight: true,
//     },
//   });

//   // If user doesn't exist → create automatically
//   if (!user) {
//     const clerkUser = await currentUser();

//     user = await db.user.create({
//       data: {
//         clerkUserId: userId,
//         email:
//           clerkUser?.emailAddresses?.[0]?.emailAddress ||
//           "test@example.com",

//         name:
//           `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() ||
//           "User",

//         industry: null,
//       },
//       include: {
//         industryInsight: true,
//       },
//     });
//   }

//   return user;
// }

// // -----------------------------------
// // SAVE RESUME
// // -----------------------------------
// export async function saveResume(content) {
//   const user = await getOrCreateUser();

//   try {
//     const resume = await db.resume.upsert({
//       where: {
//         userId: user.id,
//       },

//       update: {
//         content,
//       },

//       create: {
//         userId: user.id,
//         content,
//       },
//     });

//     revalidatePath("/resume");

//     return resume;
//   } catch (error) {
//     console.error("Error saving resume:", error);

//     throw new Error("Failed to save resume");
//   }
// }

// // -----------------------------------
// // GET RESUME
// // -----------------------------------
// export async function getResume() {
//   const user = await getOrCreateUser();

//   return await db.resume.findUnique({
//     where: {
//       userId: user.id,
//     },
//   });
// }

// // -----------------------------------
// // AI IMPROVEMENT
// // -----------------------------------
// export async function improveWithAI({
//   current,
//   type,
// }) {
//   const user = await getOrCreateUser();

//   const industry =
//     user.industryInsight?.industry ||
//     user.industry ||
//     "Software Engineering";

//   const prompt = `
// As an expert resume writer, improve the following ${type} description for a ${industry} professional.

// Make it more impactful, quantifiable, and aligned with industry standards.

// Current content:
// "${current}"

// Requirements:
// 1. Use strong action verbs
// 2. Add measurable impact (numbers, results, scale)
// 3. Highlight technical skills clearly
// 4. Keep it concise and ATS-friendly
// 5. Focus on achievements, not responsibilities
// 6. Use industry-relevant keywords

// Return ONLY a single improved paragraph.
// No explanation.
// No formatting.
// No extra text.
// `;

//   try {
//     const result = await model.generateContent(prompt);

//     const response = await result.response;

//     const improvedContent = await response.text();

//     return improvedContent.trim();
//   } catch (error) {
//     console.error("Error improving content:", error);

//     throw new Error(
//       error?.message ||
//         "Failed to improve content using AI"
//     );
//   }
// }