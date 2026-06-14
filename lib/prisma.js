// import { PrismaClient } from "@prisma/client";

// export const db = globalThis.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== "production"){
//     globalThis.prisma = db;
// }

// This file initializes a PrismaClient instance and exports it for use in the application. 
// It also ensures that only one instance of PrismaClient is created during development to prevent issues with hot reloading.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

// IMPORTANT: ensure single instance in dev
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}