import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/account/AccountShell";
import { Card } from "@/components/ui/Card";
import { requireStaff } from "@/server/identity/currentUser";

export const metadata: Metadata = { title: "Counter | The Square Lounge" };

export default async function StaffHomePage() {
  const member = await requireStaff();
  return (
    <>
      <PageTitle eyebrow="Counter" title={`Hello, ${member.displayName}`}>
        Check-in, check-out and vouchers arrive with the next modules.
      </PageTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card as={Link} href="/staff/gamers" interactive className="p-6">
          <p className="font-display text-lg font-semibold">Find a gamer</p>
          <p className="mt-1 text-sm text-muted">By member code, email or mobile number.</p>
        </Card>
        {member.role === "admin" && (
          <Card as={Link} href="/admin/staff" interactive className="p-6">
            <p className="font-display text-lg font-semibold">Manage staff</p>
            <p className="mt-1 text-sm text-muted">Add counter staff, reset passwords.</p>
          </Card>
        )}
      </div>
    </>
  );
}
