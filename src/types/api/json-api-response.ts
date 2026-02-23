export type JsonApiResponse<D = void> =
	| {
			success: true;
			code: number;
			data?: D;
			message?: string;
	  }
	| {
			success: false;
			code: number;
			error?: string;
	  };
