import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter, Loader2 } from "lucide-react";
import CandidateCard from "@/components/CandidateCard";
import { toast } from "sonner";

interface CandidateWithScore {
  candidate: any;
  score: any;
}

export default function ResultsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const jdId = searchParams.get("jd");
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState(jdId || "");
  const [candidates, setCandidates] = useState<CandidateWithScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTop, setFilterTop] = useState("all");

  useEffect(() => {
    if (!user) return;
    supabase.from("job_descriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        setJobs(data || []);
        if (jdId && data?.find(j => j.id === jdId)) setSelectedJob(jdId);
        else if (data?.[0]) setSelectedJob(data[0].id);
      });
  }, [user, jdId]);

  useEffect(() => {
    if (!selectedJob) return;
    setLoading(true);

    supabase.from("candidates").select("*").eq("job_description_id", selectedJob)
      .then(async ({ data: cands }) => {
        if (!cands || cands.length === 0) {
          setCandidates([]);
          setLoading(false);
          return;
        }

        const { data: scores } = await supabase
          .from("candidate_scores")
          .select("*")
          .in("candidate_id", cands.map(c => c.id));

        const scoreMap = new Map(scores?.map(s => [s.candidate_id, s]) || []);

        const merged = cands.map(c => ({
          candidate: c,
          score: scoreMap.get(c.id) || null,
        }));

        merged.sort((a, b) => (b.score?.final_score ?? 0) - (a.score?.final_score ?? 0));
        setCandidates(merged);
        setLoading(false);
      });
  }, [selectedJob]);

  const filtered = filterTop === "all" ? candidates : candidates.slice(0, parseInt(filterTop));

  const exportCSV = () => {
    const headers = "Rank,Name,Email,Final Score,Keyword Score,Skills Score,Experience Score,Education Score\n";
    const rows = filtered.map((c, i) =>
      `${i + 1},"${c.candidate.name || ""}","${c.candidate.email || ""}",${c.score?.final_score ?? 0},${c.score?.keyword_score ?? 0},${c.score?.skills_score ?? 0},${c.score?.experience_score ?? 0},${c.score?.education_score ?? 0}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "candidate_results.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Candidate Rankings</h1>
          <p className="text-muted-foreground">Sorted by overall match score</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Job" />
            </SelectTrigger>
            <SelectContent>
              {jobs.map(j => (
                <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTop} onValueChange={setFilterTop}>
            <SelectTrigger className="w-28">
              <Filter className="w-4 h-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="5">Top 5</SelectItem>
              <SelectItem value="10">Top 10</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-card border-border">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No candidates found. Upload resumes to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((c, i) => (
            <CandidateCard
              key={c.candidate.id}
              candidate={c.candidate}
              score={c.score}
              rank={i + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
