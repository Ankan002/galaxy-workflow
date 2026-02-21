import { serverEnv } from "@/config/server-env";
import { PrismaClient } from "@/db/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
	prisma: PrismaClient;
};

const adapter = new PrismaPg({
	connectionString: serverEnv.DATABASE_URL,
});
const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		adapter,
	});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export { prisma };
