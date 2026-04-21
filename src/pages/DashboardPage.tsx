import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, TrendingUp, Brain } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(221, 83%, 53%)", "hsl(262, 83%, 58%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ jobs: 0, candidates: 0, avgScore: 0, analyzed: 0 });
  const [scoreDistribution, setScoreDistribution] = useState<{ range: string; count: number }[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const { count: jobs } = await supabase.from("job_descriptions").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { data: candidates } = await supabase.from("candidates").select("id").eq("user_id", user.id);
      const candidateIds = candidates?.map(c => c.id) || [];

      let avgScore = 0;
      let dist = [
        { range: "0-25%", count: 0 },
        { range: "26-50%", count: 0 },
        { range: "51-75%", count: 0 },
        { range: "76-100%", count: 0 },
      ];

      if (candidateIds.length > 0) {
        const { data: scores } = await supabase.from("candidate_scores").select("final_score").in("candidate_id", candidateIds);
        if (scores && scores.length > 0) {
          avgScore = scores.reduce((sum, s) => sum + (s.final_score ?? 0), 0) / scores.length;
          scores.forEach(s => {
            const v = s.final_score ?? 0;
            if (v <= 25) dist[0].count++;
            else if (v <= 50) dist[1].count++;
            else if (v <= 75) dist[2].count++;
            else dist[3].count++;
          });
        }
      }

      setStats({ jobs: jobs ?? 0, candidates: candidateIds.length, avgScore, analyzed: candidateIds.length });
      setScoreDistribution(dist);
    };

    fetchStats();
  }, [user]);

  const statCards = [
    { label: "Job Descriptions", value: stats.jobs, icon: FileText, color: "text-primary" },
    { label: "Candidates", value: stats.candidates, icon: Users, color: "text-accent" },
    { label: "Avg Score", value: `${stats.avgScore.toFixed(0)}%`, icon: TrendingUp, color: "text-success" },
    { label: "AI Analyzed", value: stats.analyzed, icon: Brain, color: "text-warning" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your recruitment pipeline</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="shadow-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="range" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="count" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {scoreDistribution.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={scoreDistribution.filter(d => d.count > 0)} dataKey="count" nameKey="range" cx="50%" cy="50%" outerRadius={80} label>
                    {scoreDistribution.filter(d => d.count > 0).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">Upload resumes to see data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
