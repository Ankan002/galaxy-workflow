import { QueryClient as ReactQueryClient } from "@tanstack/react-query";

export class QueryClient {
	client: ReactQueryClient;

	constructor() {
		this.client = new ReactQueryClient();
	}
}
