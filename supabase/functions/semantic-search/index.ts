import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get auth user from request
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    let userId: string | null = null;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Get all candidates for the user
    let candidatesQuery = supabase.from("candidates").select("*");
    if (userId) candidatesQuery = candidatesQuery.eq("user_id", userId);
    const { data: candidates } = await candidatesQuery;

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to rank candidates by query relevance
    const candidateSummaries = candidates.map(c =>
      `ID: ${c.id} | Name: ${c.name || "Unknown"} | Skills: ${(c.skills || []).join(", ")} | Experience: ${(c.experience || []).join("; ")} | Education: ${(c.education || []).join("; ")} | Summary: ${c.summary || "N/A"}`
    ).join("\n\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a recruitment search engine. Given a natural language query and a list of candidates, return the IDs of the most relevant candidates in order of relevance. Only return candidates that genuinely match the query.",
          },
          {
            role: "user",
            content: `Search query: "${query}"\n\nCandidates:\n${candidateSummaries}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "rank_candidates",
              description: "Return ranked candidate IDs matching the search query",
              parameters: {
                type: "object",
                properties: {
                  ranked_ids: { type: "array", items: { type: "string" }, description: "Candidate IDs in order of relevance" },
                },
                required: ["ranked_ids"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "rank_candidates" } },
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const rankedIds = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments).ranked_ids : [];

    // Fetch scores for ranked candidates
    const results = [];
    for (const id of rankedIds) {
      const candidate = candidates.find(c => c.id === id);
      if (!candidate) continue;
      const { data: score } = await supabase.from("candidate_scores").select("*").eq("candidate_id", id).single();
      results.push({ candidate, score });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("semantic-search error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
