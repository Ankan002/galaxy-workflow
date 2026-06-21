import { ProfileShell } from "@/screens/profile";

export default function ProfileLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <ProfileShell>{children}</ProfileShell>;
}
