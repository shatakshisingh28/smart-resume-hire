import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Mail, Phone, GraduationCap, Briefcase, Brain, MessageSquare, Send, Sparkles } from "lucide-react";
import ScoreBar from "@/components/ScoreBar";
import SkillTag from "@/components/SkillTag";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [candidate, setCandidate] = useState<any>(null);
  const [score, setScore] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [candRes, scoreRes, insightsRes, notesRes] = await Promise.all([
        supabase.from("candidates").select("*").eq("id", id).single(),
        supabase.from("candidate_scores").select("*").eq("candidate_id", id).single(),
        supabase.from("ai_insights").select("*").eq("candidate_id", id).single(),
        supabase.from("recruiter_notes").select("*").eq("candidate_id", id).order("created_at", { ascending: false }),
      ]);
      setCandidate(candRes.data);
      setScore(scoreRes.data);
      setInsights(insightsRes.data);
      setNotes(notesRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const generateInsights = async () => {
    if (!id) return;
    setGeneratingInsights(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-insights", {
        body: { candidateId: id },
      });
      if (error) throw error;
      setInsights(data);
      toast.success("AI insights generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate insights");
    } finally {
      setGeneratingInsights(false);
    }
  };

  const addNote = async () => {
    if (!id || !user || !newNote.trim()) return;
    setAddingNote(true);
    try {
      const { data, error } = await supabase
        .from("recruiter_notes")
        .insert({ candidate_id: id, user_id: user.id, content: newNote.trim() })
        .select()
        .single();
      if (error) throw error;
      setNotes(prev => [data, ...prev]);
      setNewNote("");
      toast.success("Note added!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!candidate) {
    return <p className="text-center text-muted-foreground py-20">Candidate not found</p>;
  }

  const radarData = score ? [
    { metric: "Keywords", value: score.keyword_score ?? 0 },
    { metric: "Skills", value: score.skills_score ?? 0 },
    { metric: "Experience", value: score.experience_score ?? 0 },
    { metric: "Education", value: score.education_score ?? 0 },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            {candidate.name || "Unknown Candidate"}
          </h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            {candidate.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{candidate.email}</span>}
            {candidate.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{candidate.phone}</span>}
          </div>
        </div>
        {score && (
          <div className={`text-4xl font-bold ${(score.final_score ?? 0) >= 70 ? "text-success" : (score.final_score ?? 0) >= 40 ? "text-warning" : "text-destructive"}`}>
            {(score.final_score ?? 0).toFixed(0)}%
          </div>
        )}
      </div>

      {/* Summary */}
      {candidate.summary && (
        <Card className="shadow-card border-border">
          <CardHeader><CardTitle className="text-foreground text-sm">Resume Summary</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground text-sm">{candidate.summary}</p></CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Score Breakdown */}
        {score && (
          <Card className="shadow-card border-border">
            <CardHeader><CardTitle className="text-foreground text-sm">Score Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <ScoreBar label="Keyword Match" score={score.keyword_score ?? 0} />
              <ScoreBar label="Skills Match" score={score.skills_score ?? 0} />
              <ScoreBar label="Experience Match" score={score.experience_score ?? 0} />
              <ScoreBar label="Education Match" score={score.education_score ?? 0} />
            </CardContent>
          </Card>
        )}

        {/* Radar Chart */}
        {radarData.length > 0 && (
          <Card className="shadow-card border-border">
            <CardHeader><CardTitle className="text-foreground text-sm">Competency Radar</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="hsl(221, 83%, 53%)" fill="hsl(221, 83%, 53%)" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Skills */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-card border-border">
          <CardHeader><CardTitle className="text-foreground text-sm flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" />Skills</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(candidate.skills || []).map((s: string) => (
                <SkillTag key={s} skill={s} variant={score?.matched_skills?.includes(s) ? "matched" : "neutral"} />
              ))}
              {(!candidate.skills || candidate.skills.length === 0) && <p className="text-sm text-muted-foreground">No skills extracted</p>}
            </div>
          </CardContent>
        </Card>

        {score?.missing_skills && score.missing_skills.length > 0 && (
          <Card className="shadow-card border-border">
            <CardHeader><CardTitle className="text-foreground text-sm">Missing Skills</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {score.missing_skills.map((s: string) => (
                  <SkillTag key={s} skill={s} variant="missing" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Education & Experience */}
      <div className="grid md:grid-cols-2 gap-6">
        {candidate.education?.length > 0 && (
          <Card className="shadow-card border-border">
            <CardHeader><CardTitle className="text-foreground text-sm flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" />Education</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {candidate.education.map((e: string, i: number) => <li key={i}>{e}</li>)}
              </ul>
            </CardContent>
          </Card>
        )}
        {candidate.experience?.length > 0 && (
          <Card className="shadow-card border-border">
            <CardHeader><CardTitle className="text-foreground text-sm flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" />Experience</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {candidate.experience.map((e: string, i: number) => <li key={i}>{e}</li>)}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Insights */}
      <Card className="shadow-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              AI Insights
            </CardTitle>
            <Button variant="outline" size="sm" onClick={generateInsights} disabled={generatingInsights}>
              {generatingInsights && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {insights ? "Regenerate" : "Generate"} Insights
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {insights ? (
            <div className="space-y-4">
              {insights.fit_analysis && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Why This Candidate Fits</h4>
                  <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                    <ReactMarkdown>{insights.fit_analysis}</ReactMarkdown>
                  </div>
                </div>
              )}
              {insights.missing_skills_analysis && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Missing Skills Analysis</h4>
                  <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                    <ReactMarkdown>{insights.missing_skills_analysis}</ReactMarkdown>
                  </div>
                </div>
              )}
              {insights.interview_questions?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Suggested Interview Questions</h4>
                  <ul className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    {insights.interview_questions.map((q: string, i: number) => <li key={i}>{q}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Click "Generate Insights" for AI-powered analysis</p>
          )}
        </CardContent>
      </Card>

      {/* Recruiter Notes */}
      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Recruiter Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a note about this candidate..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button onClick={addNote} disabled={addingNote || !newNote.trim()} size="icon" className="self-end">
              {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          {notes.map(n => (
            <div key={n.id} className="bg-muted rounded-lg p-3">
              <p className="text-sm text-foreground">{n.content}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
          {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}
