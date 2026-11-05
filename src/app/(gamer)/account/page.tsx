import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/account/AccountShell";
import { MemberCard } from "@/components/account/MemberCard";
import { PasswordForm } from "@/components/account/PasswordForm";
import { ProfileForm } from "@/components/account/ProfileForm";
import { NowPlaying, RecentVisits } from "@/components/account/Visits";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { requireGamer } from "@/server/identity/currentUser";
import { memberQrSvg } from "@/server/identity/gamers";
import { balanceOf } from "@/server/loyalty/ledger";
import { currentSession, recentVisits } from "@/server/sessions/history";
import { logOut } from "../login/actions";
import { LoungePoints } from "@/components/brand/LoungePoints";

export const metadata: Metadata = { title: "My account | The Square Lounge" };

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", month: "long", year: "numeric" }).format(d);

export default async function AccountPage() {
  const gamer = await requireGamer();
  const [qrSvg, playing, visits, balance] = await Promise.all([
    memberQrSvg(gamer.memberCode),
    currentSession(gamer.id),
    recentVisits(gamer.id),
    balanceOf(gamer.id),
  ]);
  const firstName = gamer.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="grid gap-6">
      <PageTitle eyebrow="My account" title={`Hi, ${firstName}`} />
      {playing && <NowPlaying stationName={playing.stationName} startedAt={playing.startedAt} game={playing.game} />}
      <MemberCard
        name={gamer.fullName ?? ""}
        memberCode={gamer.memberCode}
        qrSvg={qrSvg}
        memberSince={formatDate(gamer.createdAt)}
      />
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <p className="flex items-baseline gap-2">
          <LoungePoints value={balance} label={false} className="font-display text-3xl font-semibold text-gold-soft" />
          <span className="text-muted">Lounge Points</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button href="/shop" size="sm">
            Spend them
          </Button>
          <Button href="/account/vouchers" size="sm" variant="secondary">
            My vouchers
          </Button>
          <Button href="/account/points" size="sm" variant="ghost">
            History
          </Button>
        </div>
      </Card>
      <RecentVisits visits={visits} />
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
