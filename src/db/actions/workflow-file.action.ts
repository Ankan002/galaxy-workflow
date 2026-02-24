import { prisma } from "../client";

type CreateWorkflowFileArgs =
	| {
			clerkUserId: string;
			name: string;
			type: "user_created";
	  }
	| {
			type: "system_example";
			name: string;
	  };

export const createWorkflowFile = async (args: CreateWorkflowFileArgs) => {
	return prisma.workflow_file.create({
		data: {
			user:
				args.type === "user_created"
					? {
							connect: {
								clerk_id: args.clerkUserId,
							},
						}
					: undefined,
			name: args.name,
			type: args.type,
		},
	});
};

type GetWorkflowFileArgs =
	| {
			type: "user_created";
			search?: string;
			clerkUserId: string;
	  }
	| {
			type: "system_example";
			search?: string;
	  };

export const getWorkflowFiles = async (args: GetWorkflowFileArgs) => {
	return prisma.workflow_file.findMany({
		where: {
			type: args.type,
			user:
				args.type === "user_created"
					? {
							clerk_id: args.clerkUserId,
						}
					: undefined,
			name: {
				contains: args.search,
			},
		},
		orderBy: {
			created_at: "desc",
		},
	});
};

export const getWorkflowFileById = async (id: string) => {
	return prisma.workflow_file.findUnique({
		where: { id },
		include: { user: true },
	});
};
