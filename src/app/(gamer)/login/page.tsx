import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/account/AccountShell";
import { LoginForm } from "@/components/account/LoginForm";
import { currentGamer } from "@/server/identity/currentUser";

export const metadata: Metadata = { title: "Log in | The Square Lounge" };

export default async function LoginPage() {
  if (await currentGamer()) redirect("/account");
  return (
    <div className="mx-auto max-w-md">
      <PageTitle eyebrow="Square Lounge Rewards" title="Welcome back" />
      <LoginForm />
    </div>
  );
}
