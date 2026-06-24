"use server";

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

export const getUserByClerkId = async (clerkId: string) =>
	prisma.user.findUnique({
		where: {
			clerk_id: clerkId,
		},
	});

interface UpdateUserArgs {
	clerkId: string;
}

export const updateUser = async (args: UpdateUserArgs) => {
	return prisma.user.update({
		where: {
			clerk_id: args.clerkId,
		},
		data: {
			clerk_id: args.clerkId,
		},
	});
};

interface DeleteUserArgs {
	clerkId?: string;
}

export const deleteUser = async (args: DeleteUserArgs) => {
	return prisma.user.delete({
		where: {
			clerk_id: args.clerkId,
		},
	});
};
