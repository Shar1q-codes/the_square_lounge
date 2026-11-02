import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const control =
  "h-12 w-full rounded-xl border border-border bg-bg/60 px-4 text-base text-fg transition-[border-color,box-shadow] duration-300 " +
  "placeholder:text-muted/60 focus:border-gold/70 focus:shadow-[0_0_0_4px_rgb(212_178_106/0.12)] focus:outline-none " +
  "aria-[invalid=true]:border-red-400/70 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]";

type FieldShellProps = { id: string; label: string; error?: string; hint?: string; className?: string; children: ReactNode };

function FieldShell({ id, label, error, hint, className, children }: FieldShellProps) {
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

const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
};

export function TextField({ name, label, error, hint, wrapperClassName, className, ...rest }: TextFieldProps) {
  const id = `f-${name}`;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={wrapperClassName}>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(control, className)}
        {...rest}
      />
    </FieldShell>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  name: string;
  label: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
};

export function SelectField({
  name,
  label,
  options,
  placeholder,
  error,
  hint,
  wrapperClassName,
  className,
  ...rest
}: SelectFieldProps) {
  const id = `f-${name}`;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={wrapperClassName}>
      <select
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(control, "appearance-none", className)}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

type CheckboxFieldProps = InputHTMLAttributes<HTMLInputElement> & { name: string; error?: string; children: ReactNode };

export function CheckboxField({ name, error, children, ...rest }: CheckboxFieldProps) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted">
        <input
          id={id}
          name={name}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 size-4 shrink-0 accent-[var(--color-gold)]"
          {...rest}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="mt-2 pl-7 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

/** Error or success banner for the whole form. */
export function FormMessage({ error, notice }: { error?: string; notice?: string }) {
  if (!error && !notice) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        error ? "border-red-400/40 bg-red-400/10 text-red-200" : "border-gold/40 bg-gold/10 text-gold-soft",
      )}
    >
      {error ?? notice}
    </p>
  );
}
