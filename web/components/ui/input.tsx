"use client";

import { useId } from "react";
import { cn } from "@/lib/format";

const fieldClass =
  "field-base disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted";

interface BaseProps {
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
  required?: boolean;
}

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className,
}: BaseProps & { htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="flex items-center gap-1 text-[13px] font-medium text-text">
          {label}
          {required ? <span className="text-sale" aria-hidden>*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-danger" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = BaseProps &
  React.InputHTMLAttributes<HTMLInputElement> & { prefix?: React.ReactNode; suffix?: React.ReactNode };

export function Input({ label, hint, error, required, className, id, prefix, suffix, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={className}>
      <div className="relative">
        {prefix ? <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{prefix}</span> : null}
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(fieldClass, prefix && "pl-8", suffix && "pr-12")}
          {...props}
        />
        {suffix ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">{suffix}</span> : null}
      </div>
      {error ? <span id={`${inputId}-error`} className="sr-only">{error}</span> : null}
    </Field>
  );
}

type TextareaProps = BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ label, hint, error, required, className, id, ...props }: TextareaProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={className}>
      <textarea
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(fieldClass, "min-h-24 resize-y")}
        {...props}
      />
    </Field>
  );
}

type SelectProps = BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ label, hint, error, required, className, id, children, ...props }: SelectProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={className}>
      <select id={inputId} className={cn(fieldClass, "appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9")}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled,
  className,
}: {
  label: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-sm text-text", disabled && "cursor-not-allowed opacity-60", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-border accent-[var(--primary)]"
      />
      <span>{label}</span>
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-sm text-text"
    >
      <span
        className={cn(
          "relative h-6 w-11 rounded-full border transition-colors",
          checked ? "border-primary bg-primary" : "border-border bg-surface"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5.5" : "translate-x-0.5"
          )}
          style={{ height: 18, width: 18 }}
        />
      </span>
      {label}
    </button>
  );
}
