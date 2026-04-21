import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, ArrowRight } from "lucide-react";
import ScoreBar from "./ScoreBar";
import SkillTag from "./SkillTag";

interface CandidateCardProps {
  candidate: {
    id: string;
    name: string | null;
    email: string | null;
    skills: string[] | null;
    summary: string | null;
  };
  score?: {
    final_score: number | null;
    keyword_score: number | null;
    skills_score: number | null;
    experience_score: number | null;
    education_score: number | null;
    matched_skills: string[] | null;
    missing_skills: string[] | null;
  };
  rank?: number;
}

export default function CandidateCard({ candidate, score, rank }: CandidateCardProps) {
  const finalScore = score?.final_score ?? 0;

  return (
    <Link to={`/candidate/${candidate.id}`}>
      <Card className="shadow-card hover:shadow-elevated transition-all duration-300 border-border hover:border-primary/30 group cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {rank && (
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                  {rank}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {candidate.name || "Unknown"}
                  </h3>
                </div>
                {candidate.email && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{candidate.email}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${finalScore >= 70 ? "text-success" : finalScore >= 40 ? "text-warning" : "text-destructive"}`}>
                {finalScore.toFixed(0)}%
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>

          {candidate.summary && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{candidate.summary}</p>
          )}

          {score && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <ScoreBar label="Keywords" score={score.keyword_score ?? 0} />
              <ScoreBar label="Skills" score={score.skills_score ?? 0} />
              <ScoreBar label="Experience" score={score.experience_score ?? 0} />
              <ScoreBar label="Education" score={score.education_score ?? 0} />
            </div>
          )}

          {score?.matched_skills && score.matched_skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {score.matched_skills.slice(0, 5).map(s => (
                <SkillTag key={s} skill={s} variant="matched" />
              ))}
              {score.matched_skills.length > 5 && (
                <span className="text-xs text-muted-foreground self-center">+{score.matched_skills.length - 5} more</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
