import { clientEnv } from "@/config/client-env";
import { serverEnv } from "@/config/server-env";
import { createClerkClient, User } from "@clerk/nextjs/server";

export class Clerk {
	private client = createClerkClient({
		secretKey: serverEnv.CLERK_SECRET_KEY,
		publishableKey: clientEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
	});

	async getClient() {
		return this.client;
	}

	async getUsersIds() {
		const users: User[] = [];

		let offset = 0;

		while (true) {
			const fetchedUsers = await this.client.users.getUserList({
				offset,
				limit: 100,
			});

			users.push(...fetchedUsers.data);
			offset += fetchedUsers.totalCount;

			if (users.length < 100) {
				break;
			}
		}

		return users.map((user) => user.id);
	}
}
