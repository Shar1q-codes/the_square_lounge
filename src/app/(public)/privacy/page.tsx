import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AccountShell, PageTitle } from "@/components/account/AccountShell";
import { PRIVACY_NOTICE_VERSION } from "@/config/privacy";
import { display, site } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy notice | The Square Lounge",
  description: "What The Square Lounge collects for member accounts and Lounge Points, why, and how to control it.",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="font-display text-xl font-semibold text-fg">{title}</h2>
      {children}
    </section>
  );
}

export default function PrivacyPage() {
  const email = display(site.contact.email);
  return (
    <AccountShell>
      <PageTitle eyebrow={`Version ${PRIVACY_NOTICE_VERSION}`} title="Privacy notice">
        How {site.name} ({site.address.locality}, {site.address.city}) uses your details when you create a member account.
      </PageTitle>

      <div className="grid gap-8 leading-relaxed text-muted [&_li]:ml-5 [&_li]:list-disc [&_ul]:grid [&_ul]:gap-1">
        <Section title="What we collect">
          <ul>
            <li>Your name, email, mobile number and password (stored only as a secure hash).</li>
            <li>Birth year, and optionally gender, so we know the age groups we serve.</li>
            <li>Your area and pincode (never your live location) and how you heard about us.</li>
            <li>Favourite games, if you tell us.</li>
            <li>Your visits: when you check in and out, which station you used, Lounge Points earned and offers claimed.</li>
          </ul>
        </Section>

        <Section title="Why we use it">
          <ul>
            <li>To run your account, track your play time and give you Lounge Points and rewards.</li>
            <li>To understand our business in totals, such as busy hours and which areas our gamers come from, so we can plan offers and timings.</li>
            <li>Only if you opt in: to tell you about offers and tournaments. Your mobile number is for contact only; we never send SMS.</li>
          </ul>
          <p>We do not sell your details or share them with advertisers.</p>
        </Section>

        <Section title="Under 18?">
          <p>
            You need to be at least 13 to join. If you are under 18, a parent or guardian must agree before you create an
            account.
          </p>
        </Section>

        <Section title="Your choices and rights">
          <ul>
            <li>See and correct your details any time on your account page.</li>
            <li>Turn marketing messages on or off on the privacy page of your account.</li>
            <li>Download a copy of the data we hold about you.</li>
            <li>
              Delete your account. We erase your name, email, mobile number, password, birth year, gender and favourite
              games. We keep your area, pincode and visit history without anything that identifies you, for our totals.
            </li>
            <li>
              Withdraw consent by deleting your account or emailing us. You can also complain to the Data Protection Board of
              India.
            </li>
          </ul>
        </Section>

        <Section title="How long we keep it">
          <p>
            We keep your account while you use it. When you delete it, personal details are erased at once. Records of
            staff actions and login attempts are kept for security.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions or requests: {email}, or ask at the counter. We reply within 7 days.
          </p>
        </Section>
      </div>
    </AccountShell>
  );
}
