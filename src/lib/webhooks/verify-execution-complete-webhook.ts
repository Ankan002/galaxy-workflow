import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/config/server-env";

export const EXECUTION_COMPLETE_SIGNATURE_HEADER =
	"x-execution-complete-signature";

export function signExecutionCompleteWebhookBody(rawBody: string): string {
	return createHmac("sha256", serverEnv.TRIGGER_SECRET_KEY)
		.update(rawBody)
		.digest("hex");
}

export function verifyExecutionCompleteWebhookSignature(
	req: Request,
	rawBody: string,
): boolean {
	const signature = req.headers.get(EXECUTION_COMPLETE_SIGNATURE_HEADER);
	if (!signature) {
		return false;
	}

	const expected = signExecutionCompleteWebhookBody(rawBody);

	try {
		const signatureBuffer = Buffer.from(signature, "hex");
		const expectedBuffer = Buffer.from(expected, "hex");
		if (signatureBuffer.length !== expectedBuffer.length) {
			return false;
		}
		return timingSafeEqual(signatureBuffer, expectedBuffer);
	} catch {
		return false;
	}
}
