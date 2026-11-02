import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/account/AccountShell";
import { SignUpForm } from "@/components/account/SignUpForm";
import { venueYear } from "@/lib/forms";
import { currentGamer } from "@/server/identity/currentUser";

export const metadata: Metadata = { title: "Join | The Square Lounge" };

export default async function JoinPage() {
  if (await currentGamer()) redirect("/account");
  return (
    <>
      <PageTitle eyebrow="Square Lounge Rewards" title="Create your account">
        Earn points for every hour you play and spend them in the points shop.
      </PageTitle>
      <SignUpForm currentYear={venueYear()} />
    </>
  );
}
