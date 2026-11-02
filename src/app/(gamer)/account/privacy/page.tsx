import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/account/AccountShell";
import { DeleteAccountForm, DownloadData, MarketingForm } from "@/components/account/PrivacyControls";
import { requireGamer } from "@/server/identity/currentUser";

export const metadata: Metadata = { title: "Privacy and your data | The Square Lounge" };

export default async function AccountPrivacyPage() {
  const gamer = await requireGamer();
  return (
    <div className="grid gap-6">
      <PageTitle eyebrow="My account" title="Privacy and your data">
        Read the full{" "}
        <Link href="/privacy" className="text-gold underline-offset-4 hover:underline">
          privacy notice
        </Link>
        .
      </PageTitle>
      <MarketingForm optedIn={gamer.marketingOptIn} />
      <DownloadData />
      <DeleteAccountForm />
      <Link href="/account" className="text-sm text-gold underline-offset-4 hover:underline">
        ← Back to my account
      </Link>
    </div>
  );
}
