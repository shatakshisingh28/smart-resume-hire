export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          candidate_id: string
          created_at: string
          fit_analysis: string | null
          id: string
          interview_questions: string[] | null
          missing_skills_analysis: string | null
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          fit_analysis?: string | null
          id?: string
          interview_questions?: string[] | null
          missing_skills_analysis?: string | null
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          fit_analysis?: string | null
          id?: string
          interview_questions?: string[] | null
          missing_skills_analysis?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_scores: {
        Row: {
          candidate_id: string
          created_at: string
          education_score: number | null
          education_weight: number | null
          experience_score: number | null
          experience_weight: number | null
          final_score: number | null
          id: string
          keyword_score: number | null
          keyword_weight: number | null
          matched_skills: string[] | null
          missing_skills: string[] | null
          skills_score: number | null
          skills_weight: number | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          education_score?: number | null
          education_weight?: number | null
          experience_score?: number | null
          experience_weight?: number | null
          final_score?: number | null
          id?: string
          keyword_score?: number | null
          keyword_weight?: number | null
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          skills_score?: number | null
          skills_weight?: number | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          education_score?: number | null
          education_weight?: number | null
          experience_score?: number | null
          experience_weight?: number | null
          final_score?: number | null
          id?: string
          keyword_score?: number | null
          keyword_weight?: number | null
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          skills_score?: number | null
          skills_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_scores_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          created_at: string
          education: string[] | null
          email: string | null
          experience: string[] | null
          id: string
          job_description_id: string
          name: string | null
          phone: string | null
          resume_filename: string | null
          resume_text: string | null
          resume_url: string | null
          skills: string[] | null
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          education?: string[] | null
          email?: string | null
          experience?: string[] | null
          id?: string
          job_description_id: string
          name?: string | null
          phone?: string | null
          resume_filename?: string | null
          resume_text?: string | null
          resume_url?: string | null
          skills?: string[] | null
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          education?: string[] | null
          email?: string | null
          experience?: string[] | null
          id?: string
          job_description_id?: string
          name?: string | null
          phone?: string | null
          resume_filename?: string | null
          resume_text?: string | null
          resume_url?: string | null
          skills?: string[] | null
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_job_description_id_fkey"
            columns: ["job_description_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_descriptions: {
        Row: {
          created_at: string
          description: string
          experience_level: string | null
          extracted_keywords: string[] | null
          id: string
          required_skills: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          experience_level?: string | null
          extracted_keywords?: string[] | null
          id?: string
          required_skills?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          experience_level?: string | null
          extracted_keywords?: string[] | null
          id?: string
          required_skills?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recruiter_notes: {
        Row: {
          candidate_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          candidate_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          candidate_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
