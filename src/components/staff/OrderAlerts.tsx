"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buzzerReady, playBuzzer, unlockBuzzer } from "@/lib/buzzer";

const POLL_MS = 5_000;
/** While an order still waits untouched, buzz again this often. */
const REMIND_MS = 60_000;

type Summary = { waiting: number; latestId: string | null };

/**
 * The "Orders" link in the staff menu. On every staff page it checks for new station orders,
 * shows how many wait and sounds the buzzer when one arrives.
 */
export function OrderAlerts({ className }: { className: string }) {
  const [waiting, setWaiting] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const latest = useRef<string | null | undefined>(undefined);
  const lastBuzz = useRef(0);

  // Sound needs one tap or key press on the page first (browser rule).
  useEffect(() => {
    const unlock = () => void unlockBuzzer().then(setSoundOn);
    setSoundOn(buzzerReady());
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    let stopped = false;
    const check = async () => {
      try {
        const res = await fetch("/api/staff/orders", { cache: "no-store" });
        if (res.status === 401) stopped = true;
        if (!res.ok) return;
        const summary = (await res.json()) as Summary;
        setWaiting(summary.waiting);
        const arrived = latest.current !== undefined && summary.latestId !== null && summary.latestId !== latest.current;
        const overdue = summary.waiting > 0 && lastBuzz.current > 0 && Date.now() - lastBuzz.current > REMIND_MS;
        latest.current = summary.latestId;
        if (arrived || overdue) {
          lastBuzz.current = Date.now();
          playBuzzer();
          window.dispatchEvent(new Event("staff:new-order"));
        }
        if (summary.waiting === 0) lastBuzz.current = 0;
      } catch {
        // Offline for a moment: try again next time.
      }
    };
    void check();
    const timer = setInterval(() => !stopped && void check(), POLL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.title = document.title.replace(/^\(\d+\) /, "");
    if (waiting > 0) document.title = `(${waiting}) ${document.title}`;
  }, [waiting]);

  return (
    <>
      <Link href="/staff/orders" className={className}>
        Orders
        {waiting > 0 && (
          <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-semibold text-bg">
            {waiting}
          </span>
        )}
      </Link>
      {!soundOn && (
        <button
          type="button"
          onClick={() => void unlockBuzzer().then(setSoundOn)}
          className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-gold/50 bg-bg/95 px-4 py-3 text-sm text-gold-soft shadow-lg sm:inset-x-auto sm:right-5"
        >
          Tap here to turn on the order buzzer
        </button>
      )}
    </>
  );
}
