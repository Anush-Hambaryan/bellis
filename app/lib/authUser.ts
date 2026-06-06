import { auth, currentUser } from "@clerk/nextjs/server";

function cleanUserIdentifier(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() || null : null;
}

function cleanEmail(value: unknown) {
  const cleaned = cleanUserIdentifier(value);
  return cleaned && cleaned.includes("@") ? cleaned : null;
}

export async function getCurrentUserEmail() {
  const { sessionClaims, userId } = await auth();
  if (!userId) return null;

  const claims = sessionClaims as Record<string, unknown> | null;
  const claimEmail =
    cleanEmail(claims?.email) ??
    cleanEmail(claims?.email_address) ??
    cleanEmail(claims?.primary_email_address) ??
    cleanEmail(claims?.primaryEmailAddress);

  if (claimEmail) return claimEmail;

  const user = await currentUser();
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses.find((emailAddress) => emailAddress.id === user.primaryEmailAddressId)?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress;

  return cleanEmail(primaryEmail);
}

export function unauthenticatedResponse() {
  return Response.json({ error: "Not authenticated." }, { status: 401 });
}
