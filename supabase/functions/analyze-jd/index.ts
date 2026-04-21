import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
            content: `You are an expert HR analyst. Extract key information from job descriptions. Return a JSON object with:
- "keywords": array of important keywords/technologies (max 20)
- "required_skills": array of required skills
- "experience_level": string like "Entry", "Mid", "Senior", "Lead"
Only return valid JSON, no markdown.`,
          },
          { role: "user", content: `Extract keywords from this job description:\n\n${description}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_jd_info",
              description: "Extract structured information from a job description",
              parameters: {
                type: "object",
                properties: {
                  keywords: { type: "array", items: { type: "string" } },
                  required_skills: { type: "array", items: { type: "string" } },
                  experience_level: { type: "string", enum: ["Entry", "Mid", "Senior", "Lead", "Executive"] },
                },
                required: ["keywords", "required_skills", "experience_level"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_jd_info" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result = { keywords: [], required_skills: [], experience_level: "Mid" };

    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-jd error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
