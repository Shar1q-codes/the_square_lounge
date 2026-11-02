import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountShell, PageTitle } from "@/components/account/AccountShell";
import { StaffLoginForm } from "@/components/staff/StaffLoginForm";
import { currentStaff } from "@/server/identity/currentUser";

export const metadata: Metadata = { title: "Staff login | The Square Lounge", robots: { index: false, follow: false } };

export default async function StaffLoginPage() {
  if (await currentStaff()) redirect("/staff");
  return (
    <AccountShell>
      <div className="mx-auto max-w-md">
        <PageTitle eyebrow="Counter" title="Staff login" />
        <StaffLoginForm />
      </div>
    </AccountShell>
  );
}
