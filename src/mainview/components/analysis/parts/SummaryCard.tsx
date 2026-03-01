interface Props {
  label: string;
  value: number;
}

export function SummaryCard({ label, value }: Props) {
  return (
    <div className="p-4 bg-cs-primary-subtle border border-cs-primary-muted rounded-xl text-center">
      <div className="text-2xl font-bold text-cs-primary font-mono">{value.toLocaleString()}</div>
      <div className="text-sm text-cs-text-tertiary mt-1">{label}</div>
    </div>
  );
}
