import { Inngest } from "inngest";

// Create a client to send and receive events.
export const inngest = new Inngest({
    id: "sensai",
    name: "Sensai",
    eventKey: process.env.INNGEST_EVENT_KEY,
    signingKey: process.env.INNGEST_SIGNING_KEY,
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || "production",
});