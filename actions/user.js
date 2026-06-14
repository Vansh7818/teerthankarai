"use server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateAIInsights } from "@/actions/dashboard";

const hasValidIndustryInsight = (insight) => {
    return (
        insight &&
        Array.isArray(insight.salaryRanges) &&
        insight.salaryRanges.length > 0 &&
        Array.isArray(insight.topSkills) &&
        insight.topSkills.length > 0 &&
        Array.isArray(insight.keyTrends) &&
        insight.keyTrends.length > 0 &&
        Array.isArray(insight.recommendedSkills) &&
        insight.recommendedSkills.length > 0
    );
};

const buildFallbackInsight = (industry) => {
    const normalized = (industry || "").toLowerCase();

    const fallbackData = {
        finance: {
            salaryRanges: [
                { role: "Financial Analyst", min: 45000, max: 65000, median: 54000, location: "Remote" },
                { role: "Investment Banker", min: 70000, max: 110000, median: 90000, location: "City" },
                { role: "Risk Manager", min: 60000, max: 90000, median: 75000, location: "Remote" },
                { role: "Finance Manager", min: 85000, max: 125000, median: 105000, location: "City" },
                { role: "Controller", min: 95000, max: 140000, median: 118000, location: "City" },
            ],
            growthRate: 6,
            demandLevel: "HIGH",
            marketOutlook: "POSITIVE",
            topSkills: ["Financial analysis", "Excel", "Reporting", "Compliance", "Communication"],
            keyTrends: ["Digital banking", "AI in finance", "Regulatory change", "Sustainable investing", "Remote advising"],
            recommendedSkills: ["Financial modeling", "Risk management", "Data literacy", "Automation", "Stakeholder management"],
        },
        tech: {
            salaryRanges: [
                { role: "Software Engineer I", min: 50000, max: 70000, median: 61000, location: "Remote" },
                { role: "Software Engineer II", min: 70000, max: 95000, median: 82000, location: "Remote" },
                { role: "Senior Developer", min: 95000, max: 125000, median: 108000, location: "Remote" },
                { role: "Tech Lead", min: 115000, max: 145000, median: 130000, location: "Hybrid" },
                { role: "Engineering Manager", min: 130000, max: 170000, median: 150000, location: "Hybrid" },
            ],
            growthRate: 8,
            demandLevel: "HIGH",
            marketOutlook: "POSITIVE",
            topSkills: ["Software development", "Cloud computing", "APIs", "DevOps", "Problem solving"],
            keyTrends: ["AI/ML", "Cloud migration", "Cybersecurity", "Remote collaboration", "Automation"],
            recommendedSkills: ["Programming", "System design", "DevOps", "Cloud architecture", "Data engineering"],
        },
        healthcare: {
            salaryRanges: [
                { role: "Medical Assistant", min: 32000, max: 42000, median: 37000, location: "Local" },
                { role: "Registered Nurse", min: 60000, max: 85000, median: 73000, location: "Local" },
                { role: "Health Administrator", min: 70000, max: 100000, median: 86000, location: "Local" },
                { role: "Clinical Specialist", min: 85000, max: 115000, median: 98000, location: "Hybrid" },
                { role: "Healthcare Director", min: 110000, max: 150000, median: 128000, location: "Hybrid" },
            ],
            growthRate: 7,
            demandLevel: "HIGH",
            marketOutlook: "POSITIVE",
            topSkills: ["Patient care", "Clinical knowledge", "Communication", "Compliance", "Data entry"],
            keyTrends: ["Telehealth", "Healthcare analytics", "Patient experience", "Regulatory updates", "Digital records"],
            recommendedSkills: ["Clinical reasoning", "EMR systems", "Care coordination", "Quality improvement", "Health policy"],
        },
        default: {
            salaryRanges: [
                { role: "Entry Level", min: 30000, max: 45000, median: 38000, location: "Remote" },
                { role: "Junior", min: 40000, max: 55000, median: 47000, location: "Remote" },
                { role: "Mid Level", min: 55000, max: 75000, median: 65000, location: "Remote" },
                { role: "Senior", min: 80000, max: 110000, median: 95000, location: "Remote" },
                { role: "Lead", min: 100000, max: 135000, median: 120000, location: "Remote" },
            ],
            growthRate: 5,
            demandLevel: "MEDIUM",
            marketOutlook: "NEUTRAL",
            topSkills: ["Communication", "Problem solving", "Teamwork", "Adaptability", "Technical proficiency"],
            keyTrends: ["Remote work", "AI adoption", "Upskilling", "Automation", "Digital transformation"],
            recommendedSkills: ["Critical thinking", "Project management", "Coding basics", "Data literacy", "Collaboration"],
        },
    };

    if (normalized.includes("finance") || normalized.includes("bank") || normalized.includes("investment")) {
        return {
            ...fallbackData.finance,
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
    }

    if (normalized.includes("tech") || normalized.includes("software") || normalized.includes("it") || normalized.includes("developer") || normalized.includes("engineering")) {
        return {
            ...fallbackData.tech,
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
    }

    if (normalized.includes("health") || normalized.includes("medical") || normalized.includes("care")) {
        return {
            ...fallbackData.healthcare,
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
    }

    return {
        ...fallbackData.default,
        marketOutlook: "NEUTRAL",
        topSkills: [`Industry knowledge of ${industry}`, "Communication", "Problem solving", "Adaptability", "Collaboration"],
        keyTrends: [`${industry} digitization`, "Remote work", "AI adoption", "Upskilling", "Automation"],
        recommendedSkills: ["Critical thinking", "Project management", `Industry-specific knowledge of ${industry}`, "Data literacy", "Collaboration"],
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
};

export async function updateUser(data) {
    const { userId } = await auth();
    if(!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId,
        },
    });
    if (!user) throw new Error("User not found");
    try {
        const result = await db.$transaction(
            async (tx) => {
                // find if the industry exists
                let industryInsight = await tx.industryInsight.findUnique({
                    where: {
                        industry: data.industry,
                    },
                });
                // If industry doesn't exist or existing insight is invalid, try generating it.
                if (!industryInsight || !hasValidIndustryInsight(industryInsight)) {
                    const insights = await generateAIInsights(data);
                    const fallbackInsight = buildFallbackInsight(data.industry);

                    const insightData = hasValidIndustryInsight(insights)
                        ? {
                              ...insights,
                              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                          }
                        : fallbackInsight;

                    if (industryInsight) {
                        industryInsight = await tx.industryInsight.update({
                            where: {
                                industry: data.industry,
                            },
                            data: insightData,
                        });
                    } else {
                        industryInsight = await tx.industryInsight.create({
                            data: {
                                industry: data.industry,
                                ...insightData,
                            },
                        });
                    }
                }
                // update the user
                const updatedUser = await tx.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        industry: data.industry,
                        experience: data.experience,
                        bio: data.bio,
                        skills: data.skills,
                    },
                });
                return { updatedUser , industryInsight };
            },
            {
                timeout: 10000, // default: 5000
            }
        );
        return {success:true, ...result};
    } catch (error){
         console.error("Error updating user and industry:", error.message);
         throw new Error("Failed to update profile" + error.message);
    }
}
export async function getUserOnboardingStatus() {
    const { userId } = await auth();
    if(!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId,
        },
    });
    if(!user) throw new Error("User not found");
    try {
        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
            select: {
                industry: true,
            },
        });
        return {
            isOnboarded: !!user?.industry,
        };
    } catch (error) {
        console.error("Error checking onboarding status: ", error.message);
        throw new Error("Failed to check onboarding status");
    }
}
