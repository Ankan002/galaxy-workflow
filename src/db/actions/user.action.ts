import { prisma } from "../client";

interface UpsertUserArgs {
	clerkId: string;
}

export const upsertUser = async (args: UpsertUserArgs) => {
	return prisma.user.upsert({
		where: {
			clerk_id: args.clerkId,
		},
		update: {
			clerk_id: args.clerkId,
		},
		create: {
			clerk_id: args.clerkId,
		},
	});
};

interface CreateUsersArgs {
	clerkIds: string[];
}

export const createUsers = async (args: CreateUsersArgs) => {
	return prisma.user.createMany({
		data: args.clerkIds.map((id) => ({
			clerk_id: id,
		})),
	});
};

export const getAllUsers = async () => prisma.user.findMany();
