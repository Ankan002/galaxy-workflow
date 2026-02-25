/**
 * One-off script to seed the "Social Media Flow" workflow template.
 * Run with: bun src/cmd/seed-social-media-flow-template.ts
 */
import { createWorkflowTemplate } from "@/db/actions/workflow-template.action";

const payload = {
	version: 1 as const,
	name: "Social Media Flow",
	nodes: [
		{
			id: "01KJA3SBAW22JWVTFG6K9PSK9C",
			type: "image_upload",
			provider: "internal",
			position_x: 195,
			position_y: 233,
			config: {
				previewUrl:
					"https://pub-6d24529af5b6438f895cf5350a9bd511.r2.dev/c4a59193745144e88030a0826bd9e753/ae0c7b8623b14795bcd955d9bf64d923/5dc5f3bffcae4b558c3926a6107253c4.jpg",
			},
			metadata: {},
		},
		{
			id: "01KJA3SBGVVWVMJXFXZC70X6XD",
			type: "crop_image",
			provider: "internal",
			position_x: 772.5,
			position_y: 219.25,
			config: {
				x_percent: 0,
				y_percent: 0,
				width_percent: 80,
				height_percent: 80,
			},
			metadata: {},
		},
		{
			id: "01KJA3SBPSEJVSMFP5BW1RS397",
			type: "text",
			provider: "internal",
			position_x: 765.899911547154,
			position_y: -263.631073351905,
			config: {
				value:
					"You are a professional marketing copyrighter. Generate a compelling one-paragraph product description",
			},
			metadata: {},
		},
		{
			id: "01KJA3SBWN7MQK9JQ7206GQGXH",
			type: "text",
			provider: "internal",
			position_x: 764.104288257383,
			position_y: -36.4847271958634,
			config: {
				value:
					"Product: Wireless Bluetooth headphones. Features: noise cancellation, 30-hour battery backup, foldable design",
			},
			metadata: {},
		},
		{
			id: "01KJA3SC2JACDPMKA4D4DC94P4",
			type: "run_llm",
			provider: "internal",
			position_x: 1439.25864521131,
			position_y: 257.997492326594,
			config: {
				model: "gemini-2.5-pro",
				temperature: 0.7,
				systemPrompt: "",
				imageInputCount: 1,
			},
			metadata: {},
		},
		{
			id: "01KJA3SC8FGEMQP1AP5F3X1MMH",
			type: "video_upload",
			provider: "internal",
			position_x: 765.002099902269,
			position_y: 636.874006468293,
			config: {
				url: "https://pub-6d24529af5b6438f895cf5350a9bd511.r2.dev/c4a59193745144e88030a0826bd9e753/281f4cc9deaa4cbfab204deb4f36931b/785bc7da7a614cc7b214f692e2b663a3.mp4",
				previewUrl:
					"https://pub-6d24529af5b6438f895cf5350a9bd511.r2.dev/c4a59193745144e88030a0826bd9e753/281f4cc9deaa4cbfab204deb4f36931b/785bc7da7a614cc7b214f692e2b663a3.mp4",
			},
			metadata: {},
		},
		{
			id: "01KJA3SCECQXCQSPTRTHM58754",
			type: "extract_video_frame",
			provider: "internal",
			position_x: 1402.448367771,
			position_y: 642.260876337606,
			config: { timestamp: "50%" },
			metadata: {},
		},
		{
			id: "01KJA3SCM8D9RZ5VZHJFPMM2NC",
			type: "run_llm",
			provider: "internal",
			position_x: 1937.54410812279,
			position_y: 517.465057698516,
			config: {
				model: "gemini-2.5-pro",
				temperature: 0.7,
				systemPrompt: "",
				imageInputCount: 2,
			},
			metadata: {},
		},
		{
			id: "01KJA3SCT44HJ9NQP8X3JRH4VV",
			type: "text",
			provider: "internal",
			position_x: 1382.69651158352,
			position_y: -28.4044223918936,
			config: {
				value:
					"You are a social media manager Create a tweet-length marketing post based on the product image and video frame",
			},
			metadata: {},
		},
	],
	edges: [
		{
			source_node_id: "01KJA3SBAW22JWVTFG6K9PSK9C",
			target_node_id: "01KJA3SBGVVWVMJXFXZC70X6XD",
			source_handle: "image",
			target_handle: "image_url",
		},
		{
			source_node_id: "01KJA3SBPSEJVSMFP5BW1RS397",
			target_node_id: "01KJA3SC2JACDPMKA4D4DC94P4",
			source_handle: "value",
			target_handle: "systemPrompt",
		},
		{
			source_node_id: "01KJA3SBWN7MQK9JQ7206GQGXH",
			target_node_id: "01KJA3SC2JACDPMKA4D4DC94P4",
			source_handle: "value",
			target_handle: "userMessages",
		},
		{
			source_node_id: "01KJA3SBGVVWVMJXFXZC70X6XD",
			target_node_id: "01KJA3SC2JACDPMKA4D4DC94P4",
			source_handle: "image",
			target_handle: "image_0",
		},
		{
			source_node_id: "01KJA3SC8FGEMQP1AP5F3X1MMH",
			target_node_id: "01KJA3SCECQXCQSPTRTHM58754",
			source_handle: "url",
			target_handle: "video_url",
		},
		{
			source_node_id: "01KJA3SC2JACDPMKA4D4DC94P4",
			target_node_id: "01KJA3SCM8D9RZ5VZHJFPMM2NC",
			source_handle: "response",
			target_handle: "userMessages",
		},
		{
			source_node_id: "01KJA3SCT44HJ9NQP8X3JRH4VV",
			target_node_id: "01KJA3SCM8D9RZ5VZHJFPMM2NC",
			source_handle: "value",
			target_handle: "systemPrompt",
		},
		{
			source_node_id: "01KJA3SBGVVWVMJXFXZC70X6XD",
			target_node_id: "01KJA3SCM8D9RZ5VZHJFPMM2NC",
			source_handle: "image",
			target_handle: "image_0",
		},
		{
			source_node_id: "01KJA3SCECQXCQSPTRTHM58754",
			target_node_id: "01KJA3SCM8D9RZ5VZHJFPMM2NC",
			source_handle: "output",
			target_handle: "image_1",
		},
	],
};

const template = await createWorkflowTemplate({
	name: "Social Media Flow",
	json: payload,
});

console.log("Template seeded:", template.id, template.name);
process.exit(0);
