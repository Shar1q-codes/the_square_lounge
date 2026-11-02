"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useState } from "react";
import { checkOutAction, voidAction, type RowActionState } from "@/app/staff/(portal)/actions";
import { canVoid, formatDuration, istTime, minutesBetween, needsAttention, PAYMENT_METHODS } from "@/lib/sessions";
import type { BoardPlayer, BoardStation } from "@/server/sessions/board";
import { control, FormMessage } from "@/components/account/fields";
import { SubmitButton } from "@/components/account/SubmitButton";
import { ConsoleBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { CheckInForm } from "./CheckInForm";

const REFRESH_MS = 30_000;
const methodLabels: Record<(typeof PAYMENT_METHODS)[number], string> = { cash: "Cash", upi: "UPI", card: "Card", other: "Other" };

/** Server time, kept in step on this device even if its own clock is wrong. */
function useServerNow(serverNow: Date) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const offset = serverNow.getTime() - Date.now();
    setNow(new Date(Date.now() + offset));
    const timer = setInterval(() => setNow(new Date(Date.now() + offset)), 15_000);
    return () => clearInterval(timer);
  }, [serverNow]);
  return now;
}

function PaymentFields() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <input name="amount" inputMode="decimal" placeholder="₹ paid (optional)" aria-label="Amount paid in rupees" className={cn(control, "h-10 text-sm")} />
      <select name="method" aria-label="Payment method" defaultValue="" className={cn(control, "h-10 text-sm")}>
        <option value="">Method…</option>
        {PAYMENT_METHODS.map((m) => (
          <option key={m} value={m}>
            {methodLabels[m]}
          </option>
        ))}
      </select>
    </div>
  );
}

function ResultLine({ state }: { state: RowActionState }) {
  if (state.error) return <p className="text-sm text-red-300">{state.error}</p>;
  if (state.message) return <p role="status" className="text-sm text-gold-soft">{state.message}</p>;
  return null;
}

type Notify = (message: string) => void;

type RowAction = (prev: RowActionState, formData: FormData) => Promise<RowActionState>;

/**
 * Reports success to the board as soon as the action returns: the row it came from is removed by
 * the same update (the player is no longer playing), so it can't show the message itself.
 */
function withNotify(action: RowAction, notify: Notify): RowAction {
  return async (prev, formData) => {
    const result = await action(prev, formData);
    if (result.ok && result.message) notify(result.message);
    return result;
  };
}

function PlayerRow({ player, now, notify }: { player: BoardPlayer; now: Date; notify: Notify }) {
  const [panel, setPanel] = useState<"none" | "out" | "void">("none");
  const [outState, checkOut] = useActionState(withNotify(checkOutAction, notify), {} as RowActionState);
  const [voidState, cancel] = useActionState(withNotify(voidAction, notify), {} as RowActionState);
  const minutes = minutesBetween(player.startedAt, now);
  const flagged = needsAttention(player.startedAt, now);

  return (
    <li className="grid gap-2 border-t border-border py-3 first:border-t-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{player.fullName ?? "Member"}</p>
          <p className="font-mono text-xs tracking-wider text-muted">
            {player.memberCode} · since {istTime(player.startedAt)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={cn("font-display font-semibold tabular-nums", flagged && "text-red-300")}>{formatDuration(minutes)}</p>
          {flagged && <p className="text-[11px] uppercase tracking-wider text-red-300">Needs attention</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" className="h-8 px-3 text-xs" onClick={() => setPanel(panel === "out" ? "none" : "out")}>
          Check out
        </Button>
        {canVoid(player.startedAt, now) && (
          <Button size="sm" variant="ghost" className="h-8 px-3 text-xs" onClick={() => setPanel(panel === "void" ? "none" : "void")}>
            Cancel check-in
          </Button>
        )}
      </div>
      {panel === "out" && (
        <form action={checkOut} className="grid gap-2">
          <input type="hidden" name="sessionId" value={player.sessionId} />
          <PaymentFields />
          <SubmitButton size="sm" pendingLabel="Checking out…">Confirm check-out · {formatDuration(minutes)}</SubmitButton>
        </form>
      )}
      {panel === "void" && (
        <form action={cancel} className="grid gap-2">
          <input type="hidden" name="sessionId" value={player.sessionId} />
          <input name="reason" required placeholder="Why? e.g. wrong station" aria-label="Reason for cancelling" className={cn(control, "h-10 text-sm")} />
          <SubmitButton size="sm" variant="secondary" pendingLabel="Cancelling…">Confirm cancel (no points)</SubmitButton>
        </form>
      )}
      <ResultLine state={panel === "void" ? voidState : outState} />
    </li>
  );
}

function StationCard({ station, now, notify }: { station: BoardStation; now: Date; notify: Notify }) {
  const [open, setOpen] = useState(false);
  const [state, checkOutAll] = useActionState(withNotify(checkOutAction, notify), {} as RowActionState);
  const count = station.players.length;
  const full = count >= station.maxCheckIns;

  return (
    <Card as="section" aria-labelledby={`station-${station.id}`} className="flex flex-col p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 id={`station-${station.id}`} className="font-display text-lg font-semibold">
            {station.name}
          </h3>
          <ConsoleBadge console={station.console} />
        </div>
        <p className={cn("text-sm tabular-nums", full ? "text-gold-soft" : "text-muted")} aria-label={`${count} of ${station.maxCheckIns} players`}>
          {count}/{station.maxCheckIns}
        </p>
      </div>

      {count === 0 ? (
        <p className="py-4 text-sm text-muted">Free</p>
      ) : (
        <ul>
          {station.players.map((p) => (
            <PlayerRow key={p.sessionId} player={p} now={now} notify={notify} />
          ))}
        </ul>
      )}

      {count > 1 && (
        <div className="mt-auto grid gap-2 border-t border-border pt-3">
          {open ? (
            <form action={checkOutAll} className="grid gap-2">
              <input type="hidden" name="stationId" value={station.id} />
              <PaymentFields />
              <SubmitButton size="sm" pendingLabel="Checking out…">Check out all {count} players</SubmitButton>
            </form>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
              Check out whole station
            </Button>
          )}
          <ResultLine state={state} />
        </div>
      )}
    </Card>
  );
}

export function StationBoard({ now: serverNow, stations }: { now: Date; stations: BoardStation[] }) {
  const router = useRouter();
  const now = useServerNow(serverNow);

  // Keeps several counter devices in sync.
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [router]);

  const [notice, setNotice] = useState<string>();
  const notify = useCallback((message: string) => setNotice(message), []);

  const playing = stations.reduce((sum, s) => sum + s.players.length, 0);
  return (
    <div className="grid gap-6">
      <CheckInForm stations={stations} />
      <FormMessage notice={notice} />
      <p className="text-sm text-muted">
        {playing === 0 ? "Nobody is playing right now." : `${playing} playing now.`} Updates every 30 seconds.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stations.map((s) => (
          <StationCard key={s.id} station={s} now={now} notify={notify} />
        ))}
      </div>
    </div>
  );
}
