import { site, type OpeningHours } from "@/config/site";

/** Raw form values (everything is a string, straight from the inputs). */
export type BookingForm = {
  name: string;
  stationId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: string; // hours
  players: string;
};

export type BookingErrors = Partial<Record<keyof BookingForm, string>>;

export const emptyBooking: BookingForm = {
  name: "",
  stationId: "",
  date: "",
  time: "",
  duration: "",
  players: "",
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const toHHMM = (minutes: number): string => {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/** Weekday of a YYYY-MM-DD date, independent of the visitor's own time zone. */
const weekdayOf = (date: string) => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];

export function hoursForDate(date: string): OpeningHours | undefined {
  if (!date) return undefined;
  const day = weekdayOf(date);
  return (site.hours as readonly OpeningHours[]).find((row) => row.schemaDays.includes(day));
}

/** Opening and closing time in minutes from midnight. A close at or before open means after midnight. */
function openWindow(row: OpeningHours) {
  const open = toMinutes(row.open);
  let close = toMinutes(row.close);
  if (close <= open) close += 24 * 60;
  return { open, close };
}

/** Start times every 30 minutes, leaving room for at least a one-hour session. */
export function timeSlots(date: string): string[] {
  const row = hoursForDate(date);
  if (!row) return [];
  const { open, close } = openWindow(row);
  const slots: string[] = [];
  for (let t = open; t + 60 <= close; t += 30) slots.push(toHHMM(t));
  return slots;
}

/** "Today" and the current minute in the venue's time zone. */
export function venueNow(): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: site.booking.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export const findStation = (id: string) => site.stations.find((s) => String(s.id) === id);

export function validateBooking(form: BookingForm, now = venueNow()): BookingErrors {
  const errors: BookingErrors = {};
  const name = form.name.trim();
  const station = findStation(form.stationId);

  if (name.length < 2) errors.name = "Please enter your name.";
  else if (name.length > 60) errors.name = "Please keep your name under 60 characters.";

  if (!station) errors.stationId = "Choose a station.";

  if (!form.date) errors.date = "Pick a date.";
  else if (form.date < now.date) errors.date = "That date has already passed.";
  else if (!hoursForDate(form.date)) errors.date = "We're closed that day.";

  const row = hoursForDate(form.date);
  if (!form.time) {
    errors.time = "Pick a start time.";
  } else if (row && !errors.date) {
    const { open, close } = openWindow(row);
    let start = toMinutes(form.time);
    if (start < open) start += 24 * 60; // a slot after midnight
    if (form.date === now.date && start <= now.minutes) errors.time = "That time has already passed.";
    else if (form.duration && start + Number(form.duration) * 60 > close)
      errors.time = `We close at ${row.close} that day. Pick an earlier start or a shorter session.`;
  }

  if (!form.duration) errors.duration = "Choose how long you'll play.";

  const players = Number(form.players);
  if (!form.players) errors.players = "How many players?";
  else if (station && players > station.maxPlayers)
    errors.players = `${station.name} seats up to ${station.maxPlayers} players.`;

  return errors;
}

/** The WhatsApp message. *asterisks* render as bold in WhatsApp. */
export function buildBookingMessage(form: BookingForm): string {
  const station = findStation(form.stationId);
  const hours = Number(form.duration);
  const end = toHHMM(toMinutes(form.time) + hours * 60);
  // e.g. "Sat, 7 Nov 2026", assembled from parts for a consistent format across browsers
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(new Date(`${form.date}T00:00:00Z`));
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const date = `${part("weekday")}, ${part("day")} ${part("month")} ${part("year")}`;

  return [
    `Hi ${site.name}! I'd like to book a station.`,
    "",
    "*Booking request*",
    `Name: ${form.name.trim()}`,
    `Station: ${station ? `${station.name} (${station.console})` : form.stationId}`,
    `Date: ${date}`,
    `Time: ${form.time} – ${end} (${hours} ${hours === 1 ? "hour" : "hours"})`,
    `Players: ${form.players}`,
    "",
    "Please confirm availability. Thanks!",
  ].join("\n");
}

/** Lets "Book this station" buttons preselect a station in the booking form. */
export const SELECT_STATION_EVENT = "tsl:select-station";

export function selectStation(id: number) {
  window.dispatchEvent(new CustomEvent<number>(SELECT_STATION_EVENT, { detail: id }));
}
