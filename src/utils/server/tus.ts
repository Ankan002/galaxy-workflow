import { serverEnv } from "@/config/server-env";
import { Transloadit } from "transloadit";

export class TUS {
	client: Transloadit;

	constructor() {
		this.client = new Transloadit({
			authKey: serverEnv.TRANSLOADIT_PUBLIC_KEY,
			authSecret: serverEnv.TRANSLOADIT_SECRET_KEY,
		});
	}
}
