import type { Metadata } from "next";
import { PageTitle } from "@/components/account/AccountShell";
import { VoucherRedeem } from "@/components/staff/VoucherRedeem";

export const metadata: Metadata = { title: "Vouchers | The Square Lounge" };

export default function StaffVouchersPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow="Counter" title="Redeem a voucher">
        Scan or type the code from the member&apos;s phone, check it&apos;s theirs, then mark it used.
      </PageTitle>
      <VoucherRedeem />
    </div>
  );
}
