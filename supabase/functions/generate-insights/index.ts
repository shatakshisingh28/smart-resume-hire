import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { candidateId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get candidate and job description
    const { data: candidate } = await supabase.from("candidates").select("*, job_descriptions(*)").eq("id", candidateId).single();
    if (!candidate) throw new Error("Candidate not found");

    const { data: score } = await supabase.from("candidate_scores").select("*").eq("candidate_id", candidateId).single();

    const jd = candidate.job_descriptions;

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
            content: "You are a senior HR analyst. Provide detailed, actionable insights about candidates.",
          },
          {
            role: "user",
            content: `Analyze this candidate for the role of "${jd?.title || "Unknown"}".

Job Description: ${jd?.description || "N/A"}
Required Skills: ${(jd?.required_skills || []).join(", ")}

Candidate: ${candidate.name || "Unknown"}
Skills: ${(candidate.skills || []).join(", ")}
Education: ${(candidate.education || []).join("; ")}
Experience: ${(candidate.experience || []).join("; ")}
Summary: ${candidate.summary || "N/A"}
Matched Skills: ${(score?.matched_skills || []).join(", ")}
Missing Skills: ${(score?.missing_skills || []).join(", ")}
Score: ${score?.final_score ?? "N/A"}%`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_insights",
              description: "Provide structured candidate insights",
              parameters: {
                type: "object",
                properties: {
                  fit_analysis: { type: "string", description: "2-3 paragraphs on why this candidate is/isn't a good fit" },
                  missing_skills_analysis: { type: "string", description: "Analysis of missing skills and their importance" },
                  interview_questions: { type: "array", items: { type: "string" }, description: "5 tailored interview questions" },
                },
                required: ["fit_analysis", "missing_skills_analysis", "interview_questions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_insights" } },
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No AI response");

    const insights = JSON.parse(toolCall.function.arguments);

    // Upsert insights
    await supabase.from("ai_insights").upsert({
      candidate_id: candidateId,
      fit_analysis: insights.fit_analysis,
      missing_skills_analysis: insights.missing_skills_analysis,
      interview_questions: insights.interview_questions,
    });

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-insights error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
