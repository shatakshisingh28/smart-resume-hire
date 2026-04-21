import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, X, Loader2, Sparkles } from "lucide-react";
import SkillTag from "@/components/SkillTag";
import { toast } from "sonner";

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const pdfs = accepted.filter(f => f.type === "application/pdf");
    if (pdfs.length < accepted.length) toast.error("Only PDF files are accepted");
    setFiles(prev => [...prev, ...pdfs]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
  });

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const extractKeywords = async () => {
    if (!jobDescription.trim()) return toast.error("Enter a job description first");
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-jd", {
        body: { description: jobDescription },
      });
      if (error) throw error;
      setExtractedKeywords(data.keywords || []);
      toast.success("Keywords extracted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to extract keywords");
    } finally {
      setExtracting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!user) return;
    if (!jobTitle.trim() || !jobDescription.trim()) return toast.error("Fill in job details");
    if (files.length === 0) return toast.error("Upload at least one resume");

    setAnalyzing(true);
    try {
      // 1. Create job description
      const { data: jd, error: jdErr } = await supabase
        .from("job_descriptions")
        .insert({
          user_id: user.id,
          title: jobTitle,
          description: jobDescription,
          extracted_keywords: extractedKeywords,
          required_skills: extractedKeywords,
        })
        .select()
        .single();
      if (jdErr) throw jdErr;

      // 2. Upload resumes and create candidates
      for (const file of files) {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("resumes").upload(filePath, file);
        if (uploadErr) {
          console.error("Upload error:", uploadErr);
          continue;
        }

        // Create candidate record
        const { data: candidate, error: candErr } = await supabase
          .from("candidates")
          .insert({
            user_id: user.id,
            job_description_id: jd.id,
            resume_url: filePath,
            resume_filename: file.name,
          })
          .select()
          .single();
        if (candErr) {
          console.error("Candidate error:", candErr);
          continue;
        }

        // 3. Process resume with edge function
        try {
          await supabase.functions.invoke("process-resume", {
            body: {
              candidateId: candidate.id,
              jobDescriptionId: jd.id,
              resumePath: filePath,
            },
          });
        } catch (err) {
          console.error("Processing error:", err);
        }
      }

      toast.success("Analysis complete! Redirecting to results...");
      navigate(`/results?jd=${jd.id}`);
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload & Analyze</h1>
        <p className="text-muted-foreground">Upload resumes and enter job requirements</p>
      </div>

      {/* Job Description */}
      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Job Description
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Job Title (e.g., Senior Frontend Developer)"
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
          />
          <Textarea
            placeholder="Paste the full job description here..."
            rows={6}
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <Button onClick={extractKeywords} disabled={extracting} variant="outline">
              {extracting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Extract Keywords with AI
            </Button>
          </div>
          {extractedKeywords.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Extracted Keywords:</p>
              <div className="flex flex-wrap gap-2">
                {extractedKeywords.map(k => (
                  <SkillTag key={k} skill={k} variant="neutral" />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Resume Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-foreground font-medium">
              {isDragActive ? "Drop PDFs here..." : "Drag & drop resumes here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">or click to browse (PDF only)</p>
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{f.name}</span>
                    <span className="text-xs text-muted-foreground">({(f.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <button onClick={() => removeFile(i)}>
                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleAnalyze}
        disabled={analyzing || files.length === 0 || !jobTitle || !jobDescription}
        className="w-full gradient-primary text-primary-foreground h-12 text-lg"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Analyzing Resumes...
          </>
        ) : (
          <>
            <Brain className="w-5 h-5 mr-2" />
            Analyze {files.length} Resume{files.length !== 1 ? "s" : ""}
          </>
        )}
      </Button>
    </div>
  );
}

function Brain(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  );
}
