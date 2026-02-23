import { createUsers, getAllUsers } from "@/db/actions/user.action";
import { logger, serverUtilsRegistry } from "@/utils/server";

const clerkUserIds = await serverUtilsRegistry.clerk.getUsersIds();
const dbUserIdsSet = new Set(
	(await getAllUsers()).map((user) => user.clerk_id),
);

const usersToBeCreated: string[] = [];

for (const userId of clerkUserIds) {
	if (!dbUserIdsSet.has(userId)) {
		usersToBeCreated.push(userId);
	}
}

logger.info("Syncing users...");
logger.info(`Found ${usersToBeCreated.length} users to be created`);

await createUsers({
	clerkIds: usersToBeCreated,
});

logger.info("Users synced successfully!");

process.exit(0);
