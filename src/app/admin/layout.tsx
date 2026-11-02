import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StaffShell } from "@/components/staff/StaffShell";
import { requireStaff } from "@/server/identity/currentUser";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const member = await requireStaff("admin");
  return <StaffShell member={member}>{children}</StaffShell>;
}
