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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          quiz_session_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          quiz_session_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          quiz_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      app_users: {
        Row: {
          created_at: string
          full_name: string
          guest_number: number | null
          id: string
          is_guest: boolean
          user_key: string
          username: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          guest_number?: number | null
          id?: string
          is_guest?: boolean
          user_key: string
          username: string
        }
        Update: {
          created_at?: string
          full_name?: string
          guest_number?: number | null
          id?: string
          is_guest?: boolean
          user_key?: string
          username?: string
        }
        Relationships: []
      }
      gap_analyses: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          identified_gaps: Json | null
          remediation_slides: Json | null
          session_id: string | null
          standard_code: string | null
          sub_skills: Json | null
          summary: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          identified_gaps?: Json | null
          remediation_slides?: Json | null
          session_id?: string | null
          standard_code?: string | null
          sub_skills?: Json | null
          summary?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          identified_gaps?: Json | null
          remediation_slides?: Json | null
          session_id?: string | null
          standard_code?: string | null
          sub_skills?: Json | null
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gap_analyses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_attempts: {
        Row: {
          adaptive_enabled: boolean
          adaptive_path: Json | null
          attempt_metadata: Json | null
          attempt_order: number | null
          completed_at: string
          created_at: string | null
          id: string
          is_correct: boolean
          metadata: Json | null
          question_id: string | null
          results: Json | null
          score: number | null
          selected_answer: string | null
          session_id: string
          standard_code: string | null
          time_spent_seconds: number
          total: number | null
          user_id: string
        }
        Insert: {
          adaptive_enabled?: boolean
          adaptive_path?: Json | null
          attempt_metadata?: Json | null
          attempt_order?: number | null
          completed_at?: string
          created_at?: string | null
          id?: string
          is_correct: boolean
          metadata?: Json | null
          question_id?: string | null
          results?: Json | null
          score?: number | null
          selected_answer?: string | null
          session_id: string
          standard_code?: string | null
          time_spent_seconds: number
          total?: number | null
          user_id: string
        }
        Update: {
          adaptive_enabled?: boolean
          adaptive_path?: Json | null
          attempt_metadata?: Json | null
          attempt_order?: number | null
          completed_at?: string
          created_at?: string | null
          id?: string
          is_correct?: boolean
          metadata?: Json | null
          question_id?: string | null
          results?: Json | null
          score?: number | null
          selected_answer?: string | null
          session_id?: string
          standard_code?: string | null
          time_spent_seconds?: number
          total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_materials: {
        Row: {
          content_kind: string | null
          created_at: string | null
          description: string | null
          difficulty_hint: string | null
          grade: string | null
          id: string
          is_active: boolean
          keywords: Json | null
          material_type: string
          metadata: Json | null
          provider: string | null
          provider_item_id: string | null
          question_id: string | null
          source: string | null
          standard_code: string | null
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          content_kind?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_hint?: string | null
          grade?: string | null
          id?: string
          is_active?: boolean
          keywords?: Json | null
          material_type: string
          metadata?: Json | null
          provider?: string | null
          provider_item_id?: string | null
          question_id?: string | null
          source?: string | null
          standard_code?: string | null
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          content_kind?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_hint?: string | null
          grade?: string | null
          id?: string
          is_active?: boolean
          keywords?: Json | null
          material_type?: string
          metadata?: Json | null
          provider?: string | null
          provider_item_id?: string | null
          question_id?: string | null
          source?: string | null
          standard_code?: string | null
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_materials_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_answer: string | null
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          external_id: string | null
          generated_by_ai: boolean
          generation_metadata: Json | null
          grade: string
          id: string
          image_url: string | null
          is_validated: boolean | null
          license: string | null
          metadata: Json | null
          options: Json | null
          presented_difficulty: string | null
          question: Json | null
          question_index: number | null
          question_text: string
          question_type: string
          session_id: string
          source: string
          source_type: string
          source_url: string | null
          standard_code: string
          strand: string | null
          tags: string[] | null
          updated_at: string | null
          visual_intent: string | null
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          external_id?: string | null
          generated_by_ai?: boolean
          generation_metadata?: Json | null
          grade: string
          id?: string
          image_url?: string | null
          is_validated?: boolean | null
          license?: string | null
          metadata?: Json | null
          options?: Json | null
          presented_difficulty?: string | null
          question?: Json | null
          question_index?: number | null
          question_text: string
          question_type?: string
          session_id: string
          source: string
          source_type?: string
          source_url?: string | null
          standard_code: string
          strand?: string | null
          tags?: string[] | null
          updated_at?: string | null
          visual_intent?: string | null
        }
        Update: {
          correct_answer?: string | null
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          external_id?: string | null
          generated_by_ai?: boolean
          generation_metadata?: Json | null
          grade?: string
          id?: string
          image_url?: string | null
          is_validated?: boolean | null
          license?: string | null
          metadata?: Json | null
          options?: Json | null
          presented_difficulty?: string | null
          question?: Json | null
          question_index?: number | null
          question_text?: string
          question_type?: string
          session_id?: string
          source?: string
          source_type?: string
          source_url?: string | null
          standard_code?: string
          strand?: string | null
          tags?: string[] | null
          updated_at?: string | null
          visual_intent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_standard_code_fkey"
            columns: ["standard_code"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["code"]
          },
        ]
      }
      quiz_sessions: {
        Row: {
          adaptive_enabled: boolean
          adaptive_policy: string | null
          completed_at: string | null
          config: Json | null
          created_at: string
          grade: string | null
          grade_token: string | null
          id: string
          metadata: Json | null
          prompt_version: string | null
          provider_metadata: Json | null
          quiz_config: Json | null
          score: number | null
          session_metadata: Json | null
          source_policy: string | null
          standard_clarifications: Json | null
          standard_code: string | null
          standard_description: string | null
          standard_examples: Json | null
          standard_grade_label: string | null
          standard_misconceptions: Json | null
          standard_purpose_and_strategies: Json | null
          standard_tiered_instruction: Json | null
          started_at: string | null
          strand_code: string | null
          user_id: string
        }
        Insert: {
          adaptive_enabled?: boolean
          adaptive_policy?: string | null
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          grade?: string | null
          grade_token?: string | null
          id?: string
          metadata?: Json | null
          prompt_version?: string | null
          provider_metadata?: Json | null
          quiz_config?: Json | null
          score?: number | null
          session_metadata?: Json | null
          source_policy?: string | null
          standard_clarifications?: Json | null
          standard_code?: string | null
          standard_description?: string | null
          standard_examples?: Json | null
          standard_grade_label?: string | null
          standard_misconceptions?: Json | null
          standard_purpose_and_strategies?: Json | null
          standard_tiered_instruction?: Json | null
          started_at?: string | null
          strand_code?: string | null
          user_id: string
        }
        Update: {
          adaptive_enabled?: boolean
          adaptive_policy?: string | null
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          grade?: string | null
          grade_token?: string | null
          id?: string
          metadata?: Json | null
          prompt_version?: string | null
          provider_metadata?: Json | null
          quiz_config?: Json | null
          score?: number | null
          session_metadata?: Json | null
          source_policy?: string | null
          standard_clarifications?: Json | null
          standard_code?: string | null
          standard_description?: string | null
          standard_examples?: Json | null
          standard_grade_label?: string | null
          standard_misconceptions?: Json | null
          standard_purpose_and_strategies?: Json | null
          standard_tiered_instruction?: Json | null
          started_at?: string | null
          strand_code?: string | null
          user_id?: string
        }
        Relationships: []
      }
      standard_practice_links: {
        Row: {
          content_kind: string
          content_title: string
          content_url: string
          created_at: string
          id: string
          set_id: string
          source_generated_at: string | null
          standard_description: string | null
          standard_id: string
        }
        Insert: {
          content_kind?: string
          content_title: string
          content_url: string
          created_at?: string
          id?: string
          set_id?: string
          source_generated_at?: string | null
          standard_description?: string | null
          standard_id: string
        }
        Update: {
          content_kind?: string
          content_title?: string
          content_url?: string
          created_at?: string
          id?: string
          set_id?: string
          source_generated_at?: string | null
          standard_description?: string | null
          standard_id?: string
        }
        Relationships: []
      }
      standards: {
        Row: {
          clarifications: Json | null
          cluster: string | null
          code: string
          created_at: string | null
          description: string
          examples: Json | null
          grade: string
          id: string
          metadata: Json | null
          misconceptions: Json | null
          purpose_and_strategies: Json | null
          source: string | null
          source_url: string | null
          strand: string | null
          subject: string
          tiered_instruction: Json | null
          updated_at: string | null
        }
        Insert: {
          clarifications?: Json | null
          cluster?: string | null
          code: string
          created_at?: string | null
          description: string
          examples?: Json | null
          grade: string
          id?: string
          metadata?: Json | null
          misconceptions?: Json | null
          purpose_and_strategies?: Json | null
          source?: string | null
          source_url?: string | null
          strand?: string | null
          subject?: string
          tiered_instruction?: Json | null
          updated_at?: string | null
        }
        Update: {
          clarifications?: Json | null
          cluster?: string | null
          code?: string
          created_at?: string | null
          description?: string
          examples?: Json | null
          grade?: string
          id?: string
          metadata?: Json | null
          misconceptions?: Json | null
          purpose_and_strategies?: Json | null
          source?: string | null
          source_url?: string | null
          strand?: string | null
          subject?: string
          tiered_instruction?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_guest_app_user: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          user_key: string
          guest_number: number
          username: string
          full_name: string
        }[]
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
