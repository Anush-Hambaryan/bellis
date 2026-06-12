import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthPageLayout, clerkAuthAppearance } from "../../components/AuthPageLayout";
import { RedirectWhenSignedIn } from "../../components/RedirectWhenSignedIn";

export default async function SignInPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/");
  }

  return (
    <AuthPageLayout
      eyebrow="Demo access"
      title="Explore the app with a ready account."
      description="Use these shared credentials to try the product without creating a new account."
    >
      <RedirectWhenSignedIn />
      <SignIn
        appearance={clerkAuthAppearance}
        fallbackRedirectUrl="/"
        forceRedirectUrl="/"
      />
    </AuthPageLayout>
  );
}
