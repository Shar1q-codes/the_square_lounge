import type { Metadata } from "next";
import { PageTitle } from "@/components/account/AccountShell";
import { AddStaffForm, StaffList } from "@/components/staff/StaffAdmin";
import { requireStaff } from "@/server/identity/currentUser";
import { listStaff } from "@/server/identity/staff";

export const metadata: Metadata = { title: "Staff | The Square Lounge" };

export default async function AdminStaffPage() {
  const admin = await requireStaff("admin");
  const rows = await listStaff();
  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <PageTitle eyebrow="Admin" title="Staff accounts">
        Deactivating someone logs them out everywhere straight away.
      </PageTitle>
      <StaffList rows={rows} selfId={admin.id} />
      <AddStaffForm />
    </div>
  );
}
