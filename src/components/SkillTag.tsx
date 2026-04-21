import { Badge } from "@/components/ui/badge";

interface SkillTagProps {
  skill: string;
  variant?: "matched" | "missing" | "neutral";
}

export default function SkillTag({ skill, variant = "neutral" }: SkillTagProps) {
  const classes = {
    matched: "bg-success/10 text-success border-success/20 hover:bg-success/20",
    missing: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
    neutral: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
  };

  return (
    <Badge variant="outline" className={`text-xs font-medium ${classes[variant]}`}>
      {skill}
    </Badge>
  );
}
