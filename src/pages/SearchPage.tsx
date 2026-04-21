import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";
import CandidateCard from "@/components/CandidateCard";
import { toast } from "sonner";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("semantic-search", {
        body: { query: query.trim() },
      });
      if (error) throw error;
      setResults(data.results || []);
      if (data.results?.length === 0) toast.info("No matching candidates found");
    } catch (err: any) {
      toast.error(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Semantic Search</h1>
        <p className="text-muted-foreground">Search candidates using natural language</p>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder='e.g. "Python developer with ML experience"'
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={loading || !query.trim()} className="gradient-primary text-primary-foreground">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((r: any) => (
            <CandidateCard key={r.candidate.id} candidate={r.candidate} score={r.score} />
          ))}
        </div>
      )}

      {results.length === 0 && !loading && (
        <Card className="shadow-card border-border">
          <CardContent className="py-16 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Try searching with natural language queries like:</p>
            <div className="mt-3 space-y-1 text-sm text-primary">
              <p>"React developer with 5 years experience"</p>
              <p>"Data scientist skilled in Python and TensorFlow"</p>
              <p>"Full stack engineer with cloud experience"</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
