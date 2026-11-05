"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import {
  checkInAction,
  checkOutAction,
  scanLookupAction,
  type CheckInState,
  type RowActionState,
  type ScanResult,
} from "@/app/staff/(portal)/actions";
import { gameOptions, findGame } from "@/lib/games";
import { formatDuration, istTime, minutesBetween } from "@/lib/sessions";
import { cn } from "@/lib/utils";
import { control, FormMessage } from "@/components/account/fields";
import { SubmitButton } from "@/components/account/SubmitButton";
import { Button } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/icons";
import { canScan, ScanView, useQrCamera } from "./ScanButton";
import { PaymentFields } from "./StationBoard";

type Found = Extract<ScanResult, { ok: true }>;

/** Check-in: the member taps a station (and optionally a game). */
function CheckInStep({ found, onDone }: { found: Found; onDone: (message: string) => void }) {
  const [state, action] = useActionState(checkInAction, {} as CheckInState);
  useEffect(() => {
    if (state.ok && state.message) onDone(state.message);
  }, [state, onDone]);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="gamerId" value={found.gamer.id} />
      <label className="grid gap-1.5 text-sm">
        <span className="text-muted">Game (optional)</span>
        <select name="game" defaultValue="" className={control}>
          <option value="">Not sure yet</option>
          {gameOptions().map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm text-muted">Check in at</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {found.stations.map((s) => {
            const full = s.players >= s.maxCheckIns;
            return (
              <SubmitButton
                key={s.id}
                name="stationId"
                value={String(s.id)}
                variant="secondary"
                disabled={full}
                pendingLabel="…"
                className="h-auto flex-col gap-0.5 rounded-xl py-3"
              >
                <span className="font-semibold">{s.name}</span>
                <span className="text-xs text-muted">
                  {s.console} · {full ? "full" : s.players === 0 ? "free" : `${s.players} playing`}
                </span>
              </SubmitButton>
            );
          })}
        </div>
      </fieldset>
      <FormMessage error={state.errors?.form ?? state.errors?.stationId} />
    </form>
  );
}

/** Check-out: shows how long they played, takes the amount and method. */
function CheckOutStep({ found, onDone }: { found: Found; onDone: (message: string) => void }) {
  const [state, action] = useActionState(checkOutAction, {} as RowActionState);
  const playing = found.playing!;
  const minutes = minutesBetween(playing.startedAt, new Date());
  useEffect(() => {
    if (state.ok && state.message) onDone(state.message);
  }, [state, onDone]);

  return (
    <form action={action} className="grid gap-3">
      <p className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm">
        Playing at <span className="font-semibold">{playing.stationName}</span> since {istTime(playing.startedAt)} ·{" "}
        {formatDuration(minutes)}
        {findGame(playing.game) && ` · ${findGame(playing.game)!.title}`}
      </p>
      <input type="hidden" name="sessionId" value={playing.sessionId} />
      <PaymentFields />
      <SubmitButton pendingLabel="Checking out…">Check out · {formatDuration(minutes)}</SubmitButton>
      <FormMessage error={state.error} />
    </form>
  );
}

/**
 * "Scan member" in the staff menu: scan a member's QR (camera, or a USB scanner typing into the box)
 * and check them in at a station, or check them out if they're already playing.
 */
export function ScanMember({ className }: { className: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [camera, setCamera] = useState(false);
  const [found, setFound] = useState<Found | null>(null);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<string>();
  const [pending, startLookup] = useTransition();
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lookup = (code: string) =>
    startLookup(async () => {
      setError(undefined);
      const result = await scanLookupAction(code);
      if (result.ok) setFound(result);
      else setError(result.error);
    });

  const scanning = open && camera && !found && !done;
  useQrCamera(videoRef, scanning, lookup, (message) => {
    setError(message);
    setCamera(false);
  });

  const start = () => {
    setFound(null);
    setError(undefined);
    setDone(undefined);
    setCamera(canScan());
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    setFound(null);
    setDone(undefined);
    router.refresh();
  };
  const finish = (message: string) => {
    setDone(message);
    setFound(null);
    router.refresh();
  };

  useEffect(() => {
    if (open && !camera && !found && !done) inputRef.current?.focus();
  }, [open, camera, found, done]);

  const onType = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (value) lookup(value);
  };

  return (
    <>
      <button type="button" onClick={start} className={cn(className, "text-gold hover:text-gold-soft")}>
        Scan member
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Scan member"
          className="fixed inset-0 z-50 overflow-y-auto bg-bg/95 p-4 backdrop-blur-sm"
          onKeyDown={(e) => e.key === "Escape" && close()}
        >
          <div className="mx-auto grid max-w-md gap-5 py-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">{found ? (found.playing ? "Check out" : "Check in") : "Scan member"}</h2>
              <button type="button" onClick={close} aria-label="Close" className="inline-flex size-10 items-center justify-center rounded-full border border-border">
                <CloseIcon className="size-5" />
              </button>
            </div>

            {done ? (
              <div className="grid gap-4">
                <FormMessage notice={done} />
                <div className="flex gap-2">
                  <Button onClick={start}>Scan next</Button>
                  <Button variant="secondary" onClick={close}>
                    Done
                  </Button>
                </div>
              </div>
            ) : found ? (
              <div className="grid gap-4">
                <div>
                  <p className="font-display text-2xl font-semibold">{found.gamer.fullName ?? "Member"}</p>
                  <p className="font-mono text-sm tracking-wider text-muted">{found.gamer.memberCode}</p>
                </div>
                {found.playing ? <CheckOutStep found={found} onDone={finish} /> : <CheckInStep found={found} onDone={finish} />}
                <Button variant="ghost" onClick={start} className="justify-self-start px-0 text-muted">
                  ← Scan someone else
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {camera && <ScanView videoRef={videoRef} hint="Point the camera at the QR code on the member's My account page." />}
                <form onSubmit={onType} className="flex gap-2">
                  <input
                    ref={inputRef}
                    aria-label="Member code"
                    placeholder={camera ? "…or type the code, e.g. SQ-7K2QM" : "Type or scan the code, e.g. SQ-7K2QM"}
                    autoComplete="off"
                    autoCapitalize="characters"
                    className={cn(control, "flex-1")}
                  />
                  <SubmitButton disabled={pending}>Find</SubmitButton>
                </form>
                {pending && <p className="text-sm text-muted">Looking up…</p>}
                <FormMessage error={error} />
                {error && camera === false && canScan() && (
                  <Button variant="secondary" onClick={start} className="justify-self-start">
                    Try the camera again
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
