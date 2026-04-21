
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Job descriptions table
CREATE TABLE public.job_descriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  extracted_keywords TEXT[] DEFAULT '{}',
  required_skills TEXT[] DEFAULT '{}',
  experience_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own job descriptions" ON public.job_descriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_job_descriptions_updated_at BEFORE UPDATE ON public.job_descriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Candidates table
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_description_id UUID REFERENCES public.job_descriptions(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  skills TEXT[] DEFAULT '{}',
  education TEXT[] DEFAULT '{}',
  experience TEXT[] DEFAULT '{}',
  resume_url TEXT,
  resume_filename TEXT,
  resume_text TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own candidates" ON public.candidates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON public.candidates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Candidate scores table
CREATE TABLE public.candidate_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL UNIQUE,
  keyword_score NUMERIC(5,2) DEFAULT 0,
  skills_score NUMERIC(5,2) DEFAULT 0,
  experience_score NUMERIC(5,2) DEFAULT 0,
  education_score NUMERIC(5,2) DEFAULT 0,
  final_score NUMERIC(5,2) DEFAULT 0,
  keyword_weight NUMERIC(3,2) DEFAULT 0.30,
  skills_weight NUMERIC(3,2) DEFAULT 0.35,
  experience_weight NUMERIC(3,2) DEFAULT 0.20,
  education_weight NUMERIC(3,2) DEFAULT 0.15,
  matched_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.candidate_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view scores for own candidates" ON public.candidate_scores FOR ALL USING (
  EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = candidate_id AND c.user_id = auth.uid())
);

-- AI Insights table
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL UNIQUE,
  fit_analysis TEXT,
  missing_skills_analysis TEXT,
  interview_questions TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view insights for own candidates" ON public.ai_insights FOR ALL USING (
  EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = candidate_id AND c.user_id = auth.uid())
);
CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON public.ai_insights FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recruiter notes table
CREATE TABLE public.recruiter_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recruiter_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON public.recruiter_notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_recruiter_notes_updated_at BEFORE UPDATE ON public.recruiter_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);
CREATE POLICY "Users upload own resumes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users view own resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own resumes" ON storage.objects FOR DELETE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
