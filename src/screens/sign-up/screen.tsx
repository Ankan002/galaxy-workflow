"use client";

import { LongLogo } from "@/components/brand";
import { DASHBOARD_URL, SIGN_IN_URL } from "@/config/client-constants";
import { SignUp } from "@clerk/nextjs";
import { useSignInScreen } from "../sign-in/hook";

const SignUpScreen = () => {
	useSignInScreen();

	return (
		<div className="bg-muted min-h-screen flex flex-col w-full">
			<div className="w-full flex pt-3 pb-3 px-4">
				<LongLogo />
			</div>
			<div className="flex-1 flex flex-col items-center justify-center">
				<SignUp
					signInUrl={SIGN_IN_URL}
					fallbackRedirectUrl={DASHBOARD_URL}
				/>
			</div>
		</div>
	);
};

export default SignUpScreen;
