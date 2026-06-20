"use client";

import { LongLogo } from "@/components/brand";
import {
	DASHBOARD_URL,
	SIGN_IN_URL,
	SIGN_UP_URL,
} from "@/config/client-constants";
import { ThemeToggle } from "@/components/ui";
import { SignIn } from "@clerk/nextjs";
import { useSignUpScreen } from "../sign-up/hook";

const SignInScreen = () => {
	useSignUpScreen();

	return (
		<div className="ak-dotgrid min-h-screen flex flex-col w-full">
			<div className="w-full flex items-center justify-between pt-3 pb-3 px-4">
				<LongLogo />
				<ThemeToggle />
			</div>
			<div className="flex-1 flex flex-col items-center justify-center">
				<SignIn
					signInUrl={SIGN_IN_URL}
					signUpUrl={SIGN_UP_URL}
					fallbackRedirectUrl={DASHBOARD_URL}
				/>
			</div>
		</div>
	);
};

export default SignInScreen;
