"use client";

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
} from "@/components/ui";
import { FieldLabel } from "./section-card";
import { useEmailChange } from "../hook";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const EmailChangeDialog: React.FC<Props> = ({ open, onOpenChange }) => {
	const {
		step,
		email,
		setEmail,
		code,
		setCode,
		isPending,
		submitEmail,
		submitCode,
		reset,
	} = useEmailChange(() => onOpenChange(false));

	const handleOpenChange = (next: boolean) => {
		if (!next) reset();
		onOpenChange(next);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Change email</DialogTitle>
					<DialogDescription>
						{step === "email"
							? "Enter a new email address. We'll send a verification code to confirm it's yours."
							: `Enter the 6-digit code we sent to ${email}.`}
					</DialogDescription>
				</DialogHeader>

				{step === "email" ? (
					<div className="flex flex-col gap-2">
						<FieldLabel htmlFor="new-email">New email</FieldLabel>
						<Input
							id="new-email"
							type="email"
							autoComplete="email"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>
				) : (
					<div className="flex flex-col gap-2">
						<FieldLabel htmlFor="email-code">
							Verification code
						</FieldLabel>
						<Input
							id="email-code"
							inputMode="numeric"
							autoComplete="one-time-code"
							placeholder="123456"
							value={code}
							onChange={(e) => setCode(e.target.value)}
						/>
					</div>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={step === "email" ? submitEmail : submitCode}
						disabled={
							isPending ||
							(step === "email" ? !email.trim() : !code.trim())
						}
					>
						{step === "email" ? "Send code" : "Verify & save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
