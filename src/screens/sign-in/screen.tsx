"use client";

import { LongLogo } from "@/components/brand";
import { SIGN_IN_URL, SIGN_UP_URL } from "@/config/client-constants";
import { SignIn } from "@clerk/nextjs";

const SignInScreen = () => {
	return (
		<div className="bg-muted min-h-screen flex flex-col w-full">
			<div className="w-full flex pt-3 pb-3 px-4">
				<LongLogo />
			</div>
			<div className="flex-1 flex flex-col items-center justify-center">
				<SignIn signInUrl={SIGN_IN_URL} signUpUrl={SIGN_UP_URL} />
			</div>
		</div>
	);
};

export default SignInScreen;
