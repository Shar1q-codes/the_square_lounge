import { describe, expect, it } from "vitest";
import { site } from "@/config/site";
import { buildBookingMessage, emptyBooking } from "@/lib/booking";
import { findGame, GAME_IDS } from "@/lib/games";
import { gameField } from "@/lib/validation/sessions";

describe("game library", () => {
  it("has unique ids that are safe as clip file names", () => {
    expect(new Set(GAME_IDS).size).toBe(site.games.length);
    for (const id of GAME_IDS) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it("gives every game an official trailer (a YouTube video id)", () => {
    for (const g of site.games) expect(g.trailer, g.title).toMatch(/^[A-Za-z0-9_-]{11}$/);
  });

  it("finds games by id and ignores unknown ones", () => {
    expect(findGame("ufc-5")?.title).toBe("UFC 5");
    expect(findGame("tetris")).toBeUndefined();
    expect(findGame(null)).toBeUndefined();
  });

  it("only accepts games from the library from forms", () => {
    expect(gameField.parse("mortal-kombat-1")).toBe("mortal-kombat-1");
    expect(gameField.parse("")).toBeNull();
    expect(gameField.parse("<script>")).toBeNull();
    expect(gameField.parse(undefined)).toBeNull();
  });
});

describe("booking message", () => {
  const form = { ...emptyBooking, name: "Ravi", stationId: "2", date: "2026-11-07", time: "18:00", duration: "2", players: "2" };

  it("names the game when one was picked", () => {
    expect(buildBookingMessage({ ...form, game: "wwe-2k25" })).toContain("Game: WWE 2K25");
  });

  it("leaves the game out when it wasn't", () => {
    expect(buildBookingMessage(form)).not.toContain("Game:");
  });
});
