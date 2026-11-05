import { formatDuration, istDateTime, istTime } from "@/lib/sessions";
import type { Visit } from "@/server/sessions/history";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GamePicker } from "./GamePicker";

export function NowPlaying({ stationName, startedAt, game }: { stationName: string; startedAt: Date; game: string | null }) {
  return (
    <Card className="grid gap-4 border-gold/40 p-5" role="status">
      <div className="flex items-center gap-4">
        <span aria-hidden className="size-2.5 shrink-0 animate-pulse rounded-full bg-gold" />
        <p className="flex-1">
          <span className="font-medium">Now playing</span> at {stationName} since {istTime(startedAt)}.
        </p>
        <Button href="/order" size="sm">
          Order food
        </Button>
      </div>
      <GamePicker game={game} />
    </Card>
  );
}

export function RecentVisits({ visits }: { visits: Visit[] }) {
  return (
    <Card className="p-5 sm:p-8">
      <h2 className="mb-4 font-display text-xl font-semibold">Recent visits</h2>
      {visits.length === 0 ? (
        <p className="text-sm text-muted">Your visits will show here after your first check-out.</p>
      ) : (
        <ul className="divide-y divide-border">
          {visits.map((v) => (
            <li key={v.id} className="flex items-baseline justify-between gap-4 py-3 text-sm">
              <span>
                {istDateTime(v.startedAt)} <span className="text-muted">· {v.stationName}</span>
              </span>
              <span className="shrink-0 font-medium tabular-nums">{formatDuration(v.minutes)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
