import { workflow_node_type } from "@/db/prisma/enums";

export const PUBLIC_ROUTES = [
	"/auth(.*)",
	"/api/health(.*)",
	"/api/webhooks(.*)",
];

export const SIGN_IN_URL = "/auth/sign-in";
export const SIGN_UP_URL = "/auth/sign-up";
export const DASHBOARD_URL = "/";

export const VALID_NODE_CONNECTIONS = [
	`${workflow_node_type.text}-${workflow_node_type.run_llm}`,
	`${workflow_node_type.image_upload}-${workflow_node_type.run_llm}`,
	`${workflow_node_type.image_upload}-${workflow_node_type.crop_image}`,
	`${workflow_node_type.crop_image}-${workflow_node_type.run_llm}`,
	`${workflow_node_type.crop_image}-${workflow_node_type.crop_image}`,
	`${workflow_node_type.video_upload}-${workflow_node_type.extract_video_frame}`,
	`${workflow_node_type.extract_video_frame}-${workflow_node_type.run_llm}`,
	`${workflow_node_type.run_llm}-${workflow_node_type.run_llm}`,
];

export const VALID_NODE_CONNECTIONS_SET = new Set(VALID_NODE_CONNECTIONS);
