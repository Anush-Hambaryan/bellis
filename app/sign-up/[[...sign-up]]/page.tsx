import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthPageLayout, clerkAuthAppearance } from "../../components/AuthPageLayout";

export default async function SignUpPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/");
  }

  return (
    <AuthPageLayout
      eyebrow="New workspace"
      title="Create an account and start learning."
      description="Your saved words and progress history stay attached to your profile."
      demoHeading="Prefer to preview first?"
    >
      <SignUp appearance={clerkAuthAppearance} />
    </AuthPageLayout>
  );
}
