"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { site } from "@/config/site";
import {
  buildBookingMessage,
  emptyBooking,
  findStation,
  SELECT_STATION_EVENT,
  timeSlots,
  validateBooking,
  venueNow,
  type BookingErrors,
  type BookingForm as Form,
} from "@/lib/booking";
import { whatsappLink } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon, ChatIcon, CheckIcon } from "@/components/ui/icons";

const FIELD_ORDER: (keyof Form)[] = ["name", "stationId", "date", "time", "duration", "players"];

const control =
  "h-12 w-full rounded-xl border bg-bg/60 px-4 text-base text-fg transition-[border-color,box-shadow] duration-300 " +
  "placeholder:text-muted/60 focus:border-gold/70 focus:shadow-[0_0_0_4px_rgb(212_178_106/0.12)] focus:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]";

function Field({
  id,
  label,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const noopSubscribe = () => () => {};

export function BookingForm() {
  const uid = useId();
  const [form, setForm] = useState<Form>(emptyBooking);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [sent, setSent] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // Venue "today" for the date picker's minimum; empty during SSR so markup matches.
  const today = useSyncExternalStore(noopSubscribe, () => venueNow().date, () => "");

  const id = (name: keyof Form) => `${uid}-${name}`;
  const station = findStation(form.stationId);
  const slots = timeSlots(form.date);

  // "Book this station" buttons elsewhere on the page preselect a station.
  useEffect(() => {
    const onSelect = (e: Event) => {
      const stationId = String((e as CustomEvent<number>).detail);
      setForm((f) => ({ ...f, stationId }));
      setErrors((err) => ({ ...err, stationId: undefined }));
    };
    window.addEventListener(SELECT_STATION_EVENT, onSelect);
    return () => window.removeEventListener(SELECT_STATION_EVENT, onSelect);
  }, []);

  const update = (name: keyof Form, value: string) => {
    setForm((f) => {
      const next = { ...f, [name]: value };
      // Keep dependent fields valid
      if (name === "date" && !timeSlots(value).includes(f.time)) next.time = "";
      if (name === "stationId") {
        const s = findStation(value);
        if (s && Number(f.players) > s.maxPlayers) next.players = "";
      }
      return next;
    });
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
    setSent(null);
  };

  const describedBy = (name: keyof Form) => (errors[name] ? `${id(name)}-error` : undefined);
  const invalid = (name: keyof Form) => (errors[name] ? true : undefined);
  const border = (name: keyof Form) => (errors[name] ? "border-red-400/70" : "border-border-strong");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = validateBooking(form);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((k) => found[k]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id(firstInvalid))}`)?.focus();
      return;
    }
    const url = whatsappLink(buildBookingMessage(form));
    if (!url) {
      setNotConfigured(true);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(url);
  };

  const maxPlayers = station?.maxPlayers ?? Math.max(...site.stations.map((s) => s.maxPlayers));

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      aria-describedby={`${uid}-intro`}
      className="relative rounded-3xl border border-border bg-surface/60 p-6 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05)] backdrop-blur-xl sm:p-10"
    >
      {/* Glowing square accents in the corners */}
      <span aria-hidden className="absolute -left-px -top-px size-8 rounded-tl-3xl border-l-2 border-t-2 border-gold/70" />
      <span aria-hidden className="absolute -bottom-px -right-px size-8 rounded-br-3xl border-b-2 border-r-2 border-gold/70" />

      <p id={`${uid}-intro`} className="sr-only">
        Submitting opens WhatsApp with your booking details filled in. We confirm availability there.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={id("name")} label="Your name" error={errors.name} className="sm:col-span-2">
          <input
            id={id("name")}
            name="name"
            autoComplete="name"
            maxLength={60}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={invalid("name")}
            aria-describedby={describedBy("name")}
            placeholder="e.g. Arjun"
            className={cn(control, border("name"))}
          />
        </Field>

        <Field id={id("stationId")} label="Station" error={errors.stationId}>
          <select
            id={id("stationId")}
            name="station"
            value={form.stationId}
            onChange={(e) => update("stationId", e.target.value)}
            aria-invalid={invalid("stationId")}
            aria-describedby={describedBy("stationId")}
            className={cn(control, border("stationId"))}
          >
            <option value="">Choose a station</option>
            {site.stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.console}
              </option>
            ))}
          </select>
        </Field>

        <Field id={id("players")} label="Players" error={errors.players}>
          <select
            id={id("players")}
            name="players"
            value={form.players}
            onChange={(e) => update("players", e.target.value)}
            aria-invalid={invalid("players")}
            aria-describedby={describedBy("players")}
            className={cn(control, border("players"))}
          >
            <option value="">How many?</option>
            {Array.from({ length: maxPlayers }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "player" : "players"}
              </option>
            ))}
          </select>
        </Field>

        <Field id={id("date")} label="Date" error={errors.date}>
          <input
            id={id("date")}
            name="date"
            type="date"
            min={today || undefined}
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            aria-invalid={invalid("date")}
            aria-describedby={describedBy("date")}
            className={cn(control, border("date"))}
          />
        </Field>

        <Field
          id={id("time")}
          label="Start time"
          error={errors.time}
          hint={form.date ? undefined : "Pick a date to see available times."}
        >
          <select
            id={id("time")}
            name="time"
            value={form.time}
            disabled={!form.date || slots.length === 0}
            onChange={(e) => update("time", e.target.value)}
            aria-invalid={invalid("time")}
            aria-describedby={describedBy("time") ?? (form.date ? undefined : `${id("time")}-hint`)}
            className={cn(control, border("time"))}
          >
            <option value="">{form.date ? "Choose a time" : "—"}</option>
            {slots.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field id={id("duration")} label="Duration" error={errors.duration} className="sm:col-span-2">
          <select
            id={id("duration")}
            name="duration"
            value={form.duration}
            onChange={(e) => update("duration", e.target.value)}
            aria-invalid={invalid("duration")}
            aria-describedby={describedBy("duration")}
            className={cn(control, border("duration"))}
          >
            <option value="">How long?</option>
            {site.booking.durations.map((h) => (
              <option key={h} value={h}>
                {h} {h === 1 ? "hour" : "hours"}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-muted">
          <ChatIcon className="size-4 text-gold" /> We&apos;ll confirm your slot on WhatsApp.
        </p>
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Send booking request <ArrowRightIcon className="size-4" />
        </Button>
      </div>

      <div aria-live="polite" className="empty:hidden">
        {notConfigured && (
          <p className="mt-6 rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-200">
            Online booking isn&apos;t switched on yet. Please call or visit us to book.
          </p>
        )}
        {sent && (
          <p className="mt-6 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-gold" />
            <span>
              WhatsApp should have opened with your booking details. Just press send.{" "}
              <a href={sent} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-4">
                Open WhatsApp again
              </a>
            </span>
          </p>
        )}
      </div>
    </form>
  );
}
