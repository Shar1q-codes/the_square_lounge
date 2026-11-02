import type { Metadata } from "next";
import { PageTitle } from "@/components/account/AccountShell";
import { GamerLookup } from "@/components/staff/GamerLookup";

export const metadata: Metadata = { title: "Find a gamer | The Square Lounge" };

export default function StaffGamersPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow="Counter" title="Find a gamer">
        Search by exact member code, email or mobile number. Every search is logged.
      </PageTitle>
      <GamerLookup />
    </div>
  );
}
