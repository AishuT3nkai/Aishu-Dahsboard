"use client";

export function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-base-200">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-base-500">{hint}</span>}
    </label>
  );
}

const inputClass =
  "focus-ring w-full rounded-card border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 placeholder:text-base-500";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} min-h-[88px] resize-y ${props.className ?? ""}`} />;
}

export function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="number" {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="focus-ring flex w-full items-center justify-between gap-4 rounded-card border border-base-700 bg-base-900 px-4 py-3 text-left"
    >
      <span>
        <span className="block text-sm font-medium text-base-100">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-base-400">{description}</span>}
      </span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-base-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}

export function Card({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-card border border-base-800 bg-base-900/60 p-5 ${className ?? ""}`}>
      {title && <h2 className="font-display text-base font-semibold text-base-100">{title}</h2>}
      {description && <p className="mt-1 text-sm text-base-400">{description}</p>}
      <div className={title || description ? "mt-4" : ""}>{children}</div>
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "bad"; children: React.ReactNode }) {
  const toneClass = {
    neutral: "bg-base-700/50 text-base-200",
    good: "bg-good/15 text-good",
    warn: "bg-warn/15 text-warn",
    bad: "bg-bad/15 text-bad",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>{children}</span>;
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const variantClass = {
    primary: "bg-accent-dim text-white hover:bg-accent disabled:bg-base-700",
    secondary: "bg-base-800 text-base-200 hover:bg-base-700",
    danger: "bg-bad/15 text-bad hover:bg-bad/25",
  }[variant];
  return (
    <button
      {...props}
      className={`focus-ring rounded-card px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className ?? ""}`}
    />
  );
}
