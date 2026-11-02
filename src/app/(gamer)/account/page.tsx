import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/account/AccountShell";
import { MemberCard } from "@/components/account/MemberCard";
import { PasswordForm } from "@/components/account/PasswordForm";
import { ProfileForm } from "@/components/account/ProfileForm";
import { Button } from "@/components/ui/Button";
import { requireGamer } from "@/server/identity/currentUser";
import { memberQrSvg } from "@/server/identity/gamers";
import { logOut } from "../login/actions";

export const metadata: Metadata = { title: "My account | The Square Lounge" };

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", month: "long", year: "numeric" }).format(d);

export default async function AccountPage() {
  const gamer = await requireGamer();
  const qrSvg = await memberQrSvg(gamer.memberCode);
  const firstName = gamer.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="grid gap-6">
      <PageTitle eyebrow="My account" title={`Hi, ${firstName}`} />
      <MemberCard
        name={gamer.fullName ?? ""}
        memberCode={gamer.memberCode}
        qrSvg={qrSvg}
        memberSince={formatDate(gamer.createdAt)}
      />
      <ProfileForm
        initial={{
          fullName: gamer.fullName ?? "",
          email: gamer.email ?? "",
          phone: gamer.phone ?? "",
          birthYear: gamer.birthYear ? String(gamer.birthYear) : "",
          gender: gamer.gender ?? "",
          area: gamer.area,
          pincode: gamer.pincode,
          referralSource: gamer.referralSource,
          favouriteGames: gamer.favouriteGames.join(", "),
        }}
      />
      <PasswordForm />
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <Link href="/account/privacy" className="text-sm text-gold underline-offset-4 hover:underline">
          Privacy and your data
        </Link>
        <form action={logOut}>
          <Button type="submit" variant="ghost" size="sm">
            Log out
          </Button>
        </form>
      </div>
    </div>
  );
}
