"use client";

import { useRef } from "react";
import { setGameAction } from "@/app/(gamer)/account/actions";
import { gameOptions } from "@/lib/games";
import { control } from "./fields";

/** Saves as soon as the gamer picks: the lounge page shows the game on their station's TV. */
export function GamePicker({ game }: { game: string | null }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={setGameAction} className="grid gap-1.5">
      <label htmlFor="now-playing-game" className="text-sm text-muted">
        What are you playing?
      </label>
      <select
        id="now-playing-game"
        name="game"
        defaultValue={game ?? ""}
        key={game ?? "none"}
        onChange={() => form.current?.requestSubmit()}
        className={control}
      >
        <option value="">Pick a game…</option>
        {gameOptions().map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
