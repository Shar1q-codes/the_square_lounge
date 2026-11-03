import type { Metadata } from "next";
import { Suspense } from "react";
import { LoungeViewer } from "@/components/lounge/LoungeViewer";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "The Lounge in 3D | The Square Lounge",
  description: "Walk around The Square Lounge in Malakpet in 3D before you visit: the stations, sofas, café corner and lights.",
  alternates: { canonical: "/lounge" },
};

export default function LoungePage() {
  return (
    <>
      <Navbar home={false} />
      <main id="main" className="pt-16 md:pt-20">
        <Suspense>
          <LoungeViewer />
        </Suspense>
      </main>
    </>
  );
}
