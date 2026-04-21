import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { candidateId, jobDescriptionId, resumePath } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download resume file
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("resumes")
      .download(resumePath);
    if (dlErr) throw new Error(`Failed to download resume: ${dlErr.message}`);

    // Extract text from PDF (basic extraction)
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let resumeText = extractTextFromPDF(bytes);

    // If extraction yields little text, use the raw bytes as a fallback description
    if (resumeText.length < 50) {
      resumeText = "Resume content could not be fully extracted. Filename: " + resumePath;
    }

    // Get job description
    const { data: jd } = await supabase
      .from("job_descriptions")
      .select("*")
      .eq("id", jobDescriptionId)
      .single();

    if (!jd) throw new Error("Job description not found");

    // Use AI to parse resume and score
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
            content: `You are an expert resume parser and candidate evaluator. Parse the resume and score the candidate against the job description. Return structured data using the provided tool.`,
          },
          {
            role: "user",
            content: `Job Description: ${jd.title}\n${jd.description}\n\nRequired Skills: ${(jd.required_skills || []).join(", ")}\nKeywords: ${(jd.extracted_keywords || []).join(", ")}\n\nResume Text:\n${resumeText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_and_score_resume",
              description: "Parse resume data and score candidate against job requirements",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Candidate full name" },
                  email: { type: "string", description: "Email address" },
                  phone: { type: "string", description: "Phone number" },
                  skills: { type: "array", items: { type: "string" }, description: "List of skills" },
                  education: { type: "array", items: { type: "string" }, description: "Education entries" },
                  experience: { type: "array", items: { type: "string" }, description: "Work experience entries" },
                  summary: { type: "string", description: "3-4 line summary of the candidate" },
                  keyword_score: { type: "number", description: "Keyword match score 0-100" },
                  skills_score: { type: "number", description: "Skills match score 0-100" },
                  experience_score: { type: "number", description: "Experience relevance score 0-100" },
                  education_score: { type: "number", description: "Education match score 0-100" },
                  matched_skills: { type: "array", items: { type: "string" }, description: "Skills that match the JD" },
                  missing_skills: { type: "array", items: { type: "string" }, description: "Required skills missing from resume" },
                },
                required: ["name", "skills", "summary", "keyword_score", "skills_score", "experience_score", "education_score", "matched_skills", "missing_skills"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parse_and_score_resume" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No AI response");

    const parsed = JSON.parse(toolCall.function.arguments);

    // Update candidate
    await supabase.from("candidates").update({
      name: parsed.name || null,
      email: parsed.email || null,
      phone: parsed.phone || null,
      skills: parsed.skills || [],
      education: parsed.education || [],
      experience: parsed.experience || [],
      resume_text: resumeText.substring(0, 10000),
      summary: parsed.summary || null,
    }).eq("id", candidateId);

    // Calculate weighted final score
    const kw = 0.30, sw = 0.35, ew = 0.20, edw = 0.15;
    const finalScore = (parsed.keyword_score * kw) + (parsed.skills_score * sw) + (parsed.experience_score * ew) + (parsed.education_score * edw);

    // Upsert score
    await supabase.from("candidate_scores").upsert({
      candidate_id: candidateId,
      keyword_score: parsed.keyword_score,
      skills_score: parsed.skills_score,
      experience_score: parsed.experience_score,
      education_score: parsed.education_score,
      final_score: finalScore,
      matched_skills: parsed.matched_skills || [],
      missing_skills: parsed.missing_skills || [],
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-resume error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Basic PDF text extraction
function extractTextFromPDF(bytes: Uint8Array): string {
  const text: string[] = [];
  const str = new TextDecoder("latin1").decode(bytes);

  // Find all text streams
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(str)) !== null) {
    const content = match[1];
    // Extract text between parentheses (PDF text objects)
    const textRegex = /\(([^)]*)\)/g;
    let textMatch;
    while ((textMatch = textRegex.exec(content)) !== null) {
      const decoded = textMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\\\/g, "\\")
        .replace(/\\([()])/g, "$1");
      if (decoded.trim()) text.push(decoded);
    }
  }

  return text.join(" ").replace(/\s+/g, " ").trim();
}
