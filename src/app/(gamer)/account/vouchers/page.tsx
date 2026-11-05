import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/account/AccountShell";
import { FormMessage } from "@/components/account/fields";
import { VoucherCard } from "@/components/account/Vouchers";
import { requireGamer } from "@/server/identity/currentUser";
import { memberQrSvg } from "@/server/identity/gamers";
import { vouchersFor } from "@/server/loyalty/vouchers";

export const metadata: Metadata = { title: "My vouchers | The Square Lounge" };

export default async function VouchersPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const gamer = await requireGamer();
  const { new: newCode } = await searchParams;
  const vouchers = await vouchersFor(gamer.id);
  const withQr = await Promise.all(
    vouchers.map(async (v) => ({ ...v, qrSvg: v.status === "active" ? await memberQrSvg(v.code) : undefined })),
  );
  const fresh = withQr.find((v) => v.code === newCode && v.status === "active");

  return (
    <div className="grid gap-6">
      <PageTitle eyebrow="My account" title="My vouchers" />
      {fresh && <FormMessage notice={`Done! Your voucher for "${fresh.offerTitle}" is ready. Show it at the counter.`} />}
      {withQr.length === 0 ? (
        <p className="text-muted">
          No vouchers yet.{" "}
          <Link href="/shop" className="text-gold underline-offset-4 hover:underline">
            Visit the Lounge Points shop
          </Link>
          .
        </p>
      ) : (
        withQr.map((v) => <VoucherCard key={v.id} voucher={v} highlight={v.id === fresh?.id} />)
      )}
      <Link href="/account" className="text-sm text-gold underline-offset-4 hover:underline">
        ← Back to my account
      </Link>
    </div>
  );
}
