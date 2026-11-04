import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/account/AccountShell";
import { LoginForm } from "@/components/account/LoginForm";
import { afterLogin } from "@/lib/forms";
import { currentGamer } from "@/server/identity/currentUser";

export const metadata: Metadata = { title: "Log in | The Square Lounge" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = afterLogin((await searchParams).next);
  if (await currentGamer()) redirect(next);
  return (
    <div className="mx-auto max-w-md">
      <PageTitle eyebrow="Square Lounge Rewards" title="Welcome back" />
      <LoginForm next={next} />
    </div>
  );
}
