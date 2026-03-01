interface Props {
  label: string;
  value: number;
}

export function SummaryCard({ label, value }: Props) {
  return (
    <div className="p-4 bg-cs-surface border border-cs-border rounded-[10px] text-center">
      <div className="text-2xl font-semibold text-cs-text-primary font-mono">{value.toLocaleString()}</div>
      <div className="text-[11px] text-cs-text-secondary mt-1">{label}</div>
    </div>
  );
}
