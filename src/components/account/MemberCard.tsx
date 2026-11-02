import { Card } from "@/components/ui/Card";

type Props = { name: string; memberCode: string; qrSvg: string; memberSince: string };

/** The card gamers show at the counter: staff scan the QR or read out the code. */
export function MemberCard({ name, memberCode, qrSvg, memberSince }: Props) {
  return (
    <Card className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
      <div
        className="size-40 shrink-0 overflow-hidden rounded-xl bg-fg p-2 [&>svg]:size-full"
        role="img"
        aria-label={`QR code for member code ${memberCode}`}
        // SVG generated on the server by the qrcode library from our own member code.
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />
      <div className="text-center sm:text-left">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">Member</p>
        <p className="mt-1 font-display text-2xl font-semibold">{name}</p>
        <p className="mt-3 font-mono text-3xl tracking-[0.15em] text-gold-soft">{memberCode}</p>
        <p className="mt-2 text-sm text-muted">Show this at the counter when you check in. Member since {memberSince}.</p>
      </div>
    </Card>
  );
}
