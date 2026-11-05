import { site, type Game } from "@/config/site";

const byId: ReadonlyMap<string, Game> = new Map(site.games.map((g) => [g.id, g]));

/** A game in the library, or undefined for an unknown id (games can be removed from the list). */
export const findGame = (id: string | null | undefined): Game | undefined => (id ? byId.get(id) : undefined);

/** Game ids, for validating what forms send. */
export const GAME_IDS = site.games.map((g) => g.id) as [string, ...string[]];

/** Options for game pickers, sorted by title. */
export const gameOptions = () =>
  [...site.games].sort((a, b) => a.title.localeCompare(b.title)).map((g) => ({ value: g.id, label: g.title }));
