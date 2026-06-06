"use client";

import { useUser } from "@clerk/nextjs";
import { FlashcardQualitySection } from "./FlashcardQualitySection";
import { UserThumbsSection } from "./UserThumbsSection";
import { VectorSection } from "./VectorSection";

export default function AnalyticsPage() {
  const { user } = useUser();
  const userEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress;

  return (
    <div className="overflow-x-hidden px-4 pt-4 pb-3 font-sans md:pr-4 md:pl-8">
      <VectorSection userEmail={userEmail} explainClusters />
      <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
        <FlashcardQualitySection userEmail={userEmail} />
        <UserThumbsSection userEmail={userEmail} />
      </div>
    </div>
  );
}
