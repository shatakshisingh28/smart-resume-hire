interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
  color?: string;
}

export default function ScoreBar({ label, score, maxScore = 100, color }: ScoreBarProps) {
  const pct = Math.min(100, (score / maxScore) * 100);
  const barColor = color || (pct >= 70 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-destructive");

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{score.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
