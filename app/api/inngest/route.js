export const runtime = "nodejs";

import { inngest } from "@/lib/inngest/client";
import { serve } from "inngest/next";
import { generateIndustryInsights } from "@/lib/inngest/functions";

// Create an API that serves the Inngest function(s).
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [generateIndustryInsights],
    signingKey: process.env.INNGEST_SIGNING_KEY,
});