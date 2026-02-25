import { createHmac } from "node:crypto";
import { getWorkflowNode, updateWorkflowNode } from "@/db/actions/workflow-node.action";
import { getPublicUrlFromAssemblyStatus } from "@/utils/server/tus";
import { serverEnv } from "@/config/server-env";
import { NextRequest, NextResponse } from "next/server";

/**
 * Transloadit webhook: receives assembly completion and updates the workflow node
 * with the result URL. Called by Transloadit when processing finishes.
 * Query params: workflow_id, node_id (set when we created the assembly).
 * Security: HMAC signature verification using TRANSLOADIT_SECRET_KEY.
 */
export async function POST(
	req: NextRequest,
	context: { params?: Promise<Record<string, string | undefined>> },
) {
	try {
		const { searchParams } = new URL(req.url);
		const workflowId = searchParams.get("workflow_id");
		const nodeId = searchParams.get("node_id");
		if (!workflowId || !nodeId) {
			return NextResponse.json(
				{ error: "Missing workflow_id or node_id" },
				{ status: 400 },
			);
		}

		const formData = await req.formData();
		const transloaditRaw = formData.get("transloadit");
		const signatureRaw = formData.get("signature");
		if (typeof transloaditRaw !== "string" || typeof signatureRaw !== "string") {
			return NextResponse.json(
				{ error: "Missing transloadit or signature" },
				{ status: 400 },
			);
		}

		const authSecret = serverEnv.TRANSLOADIT_SECRET_KEY;
		const algoSeparatorIndex = signatureRaw.indexOf(":");
		const algo =
			algoSeparatorIndex === -1 ? "sha1" : signatureRaw.slice(0, algoSeparatorIndex);
		const receivedSig =
			algoSeparatorIndex === -1
				? signatureRaw
				: signatureRaw.slice(algoSeparatorIndex + 1);
		const calculated = createHmac(algo, authSecret)
			.update(transloaditRaw, "utf8")
			.digest("hex");
		if (calculated !== receivedSig) {
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		const status = JSON.parse(transloaditRaw) as Parameters<
			typeof getPublicUrlFromAssemblyStatus
		>[0];
		const uploadedUrl = getPublicUrlFromAssemblyStatus(status);
		if (!uploadedUrl) {
			return NextResponse.json(
				{ error: "No public URL in assembly result" },
				{ status: 400 },
			);
		}

		const existing = await getWorkflowNode({ id: nodeId, workflowId });
		if (!existing) {
			return NextResponse.json({ error: "Node not found" }, { status: 404 });
		}
		const currentConfig = (existing.config as Record<string, unknown>) ?? {};
		await updateWorkflowNode({
			id: nodeId,
			workflowId,
			config: { ...currentConfig, previewUrl: uploadedUrl },
		});

		return new NextResponse(null, { status: 200 });
	} catch (e) {
		console.error("Transloadit notify error:", e);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
