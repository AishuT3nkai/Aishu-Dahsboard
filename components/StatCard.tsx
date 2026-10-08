export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-card border border-base-800 bg-base-900/60 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-base-500">{label}</div>
      <div className="mt-1.5 font-display text-2xl font-semibold text-base-100">{value}</div>
      {hint && <div className="mt-1 text-xs text-base-500">{hint}</div>}
    </div>
  );
}
