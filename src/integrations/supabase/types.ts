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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          analysis: Json
          building_id: string
          created_at: string
          id: string
          job_id: string | null
          recommendations: string[]
          risks: string[]
          suitability_result: string
        }
        Insert: {
          analysis?: Json
          building_id: string
          created_at?: string
          id?: string
          job_id?: string | null
          recommendations?: string[]
          risks?: string[]
          suitability_result: string
        }
        Update: {
          analysis?: Json
          building_id?: string
          created_at?: string
          id?: string
          job_id?: string | null
          recommendations?: string[]
          risks?: string[]
          suitability_result?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          access_constraints: string
          address: string
          city: string
          cleaning_frequency: string
          created_at: string
          customer_budget: number | null
          dirt_condition: string
          existing_method: string | null
          exterior_area: number
          floors: number | null
          height: number
          id: string
          is_demo: boolean
          name: string
          photos: string[]
          site_notes: string | null
          surface_type: string
        }
        Insert: {
          access_constraints: string
          address: string
          city: string
          cleaning_frequency: string
          created_at?: string
          customer_budget?: number | null
          dirt_condition: string
          existing_method?: string | null
          exterior_area: number
          floors?: number | null
          height: number
          id?: string
          is_demo?: boolean
          name: string
          photos?: string[]
          site_notes?: string | null
          surface_type: string
        }
        Update: {
          access_constraints?: string
          address?: string
          city?: string
          cleaning_frequency?: string
          created_at?: string
          customer_budget?: number | null
          dirt_condition?: string
          existing_method?: string | null
          exterior_area?: number
          floors?: number | null
          height?: number
          id?: string
          is_demo?: boolean
          name?: string
          photos?: string[]
          site_notes?: string | null
          surface_type?: string
        }
        Relationships: []
      }
      experiments: {
        Row: {
          assumption: string
          created_at: string
          duration: string | null
          failure_criteria: string | null
          id: string
          methodology: string
          objective: string | null
          resources: string | null
          status: string
          success_criteria: string
          title: string
        }
        Insert: {
          assumption: string
          created_at?: string
          duration?: string | null
          failure_criteria?: string | null
          id?: string
          methodology: string
          objective?: string | null
          resources?: string | null
          status?: string
          success_criteria: string
          title: string
        }
        Update: {
          assumption?: string
          created_at?: string
          duration?: string | null
          failure_criteria?: string | null
          id?: string
          methodology?: string
          objective?: string | null
          resources?: string | null
          status?: string
          success_criteria?: string
          title?: string
        }
        Relationships: []
      }
      invention_demo_templates: {
        Row: {
          analysis: Json
          finances: Json
          id: string
          inputs: Json
          invention_name: string
          readiness: Json
        }
        Insert: {
          analysis: Json
          finances: Json
          id: string
          inputs: Json
          invention_name: string
          readiness: Json
        }
        Update: {
          analysis?: Json
          finances?: Json
          id?: string
          inputs?: Json
          invention_name?: string
          readiness?: Json
        }
        Relationships: []
      }
      invention_projects: {
        Row: {
          analysis: Json | null
          created_at: string
          error_message: string | null
          experiment_statuses: Json
          finances: Json
          id: string
          inputs: Json
          invention_name: string
          is_demo: boolean
          readiness: Json
          status: string
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          created_at?: string
          error_message?: string | null
          experiment_statuses?: Json
          finances?: Json
          id?: string
          inputs?: Json
          invention_name: string
          is_demo?: boolean
          readiness?: Json
          status?: string
          user_id?: string
        }
        Update: {
          analysis?: Json | null
          created_at?: string
          error_message?: string | null
          experiment_statuses?: Json
          finances?: Json
          id?: string
          inputs?: Json
          invention_name?: string
          is_demo?: boolean
          readiness?: Json
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      job_events: {
        Row: {
          created_at: string
          from_status: string | null
          id: string
          job_id: string
          note: string | null
          to_status: string
        }
        Insert: {
          created_at?: string
          from_status?: string | null
          id?: string
          job_id: string
          note?: string | null
          to_status: string
        }
        Update: {
          created_at?: string
          from_status?: string | null
          id?: string
          job_id?: string
          note?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          assigned_crew: string | null
          building_id: string
          created_at: string
          equipment: string | null
          estimated_duration: number | null
          id: string
          is_demo: boolean
          job_number: string
          operator_notes: string | null
          quoted_price: number | null
          requested_date: string | null
          scheduled_date: string | null
          status: string
        }
        Insert: {
          assigned_crew?: string | null
          building_id: string
          created_at?: string
          equipment?: string | null
          estimated_duration?: number | null
          id?: string
          is_demo?: boolean
          job_number?: string
          operator_notes?: string | null
          quoted_price?: number | null
          requested_date?: string | null
          scheduled_date?: string | null
          status?: string
        }
        Update: {
          assigned_crew?: string | null
          building_id?: string
          created_at?: string
          equipment?: string | null
          estimated_duration?: number | null
          id?: string
          is_demo?: boolean
          job_number?: string
          operator_notes?: string | null
          quoted_price?: number | null
          requested_date?: string | null
          scheduled_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      market_ai_access: {
        Row: {
          created_at: string
          message: string
          status: number
          user_id: string
        }
        Insert: {
          created_at?: string
          message: string
          status: number
          user_id?: string
        }
        Update: {
          created_at?: string
          message?: string
          status?: number
          user_id?: string
        }
        Relationships: []
      }
      market_chunks: {
        Row: {
          chunk_index: number
          content: string
          document_id: string
          embedding: string
          embedding_model: string
          id: string
          user_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          document_id: string
          embedding: string
          embedding_model?: string
          id?: string
          user_id?: string
        }
        Update: {
          chunk_index?: number
          content?: string
          document_id?: string
          embedding?: string
          embedding_model?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "market_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      market_documents: {
        Row: {
          content: string
          created_at: string
          id: string
          source_url: string | null
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          source_url?: string | null
          title: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          source_url?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      quotations: {
        Row: {
          additional_costs: number
          ai_explanation: string | null
          area: number
          assumptions: Json
          created_at: string
          crew_size: number
          daily_rate: number
          id: string
          job_id: string
          partner_margin: number
          total_price: number
          working_days: number
        }
        Insert: {
          additional_costs?: number
          ai_explanation?: string | null
          area: number
          assumptions?: Json
          created_at?: string
          crew_size: number
          daily_rate: number
          id?: string
          job_id: string
          partner_margin?: number
          total_price: number
          working_days: number
        }
        Update: {
          additional_costs?: number
          ai_explanation?: string | null
          area?: number
          assumptions?: Json
          created_at?: string
          crew_size?: number
          daily_rate?: number
          id?: string
          job_id?: string
          partner_margin?: number
          total_price?: number
          working_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          actual_duration: number | null
          after_photos: string[]
          before_photos: string[]
          completed_area: number | null
          completion_date: string | null
          created_at: string
          customer_acceptance: string
          id: string
          issues: string | null
          job_id: string
          operator_notes: string | null
        }
        Insert: {
          actual_duration?: number | null
          after_photos?: string[]
          before_photos?: string[]
          completed_area?: number | null
          completion_date?: string | null
          created_at?: string
          customer_acceptance?: string
          id?: string
          issues?: string | null
          job_id: string
          operator_notes?: string | null
        }
        Update: {
          actual_duration?: number | null
          after_photos?: string[]
          before_photos?: string[]
          completed_area?: number | null
          completion_date?: string | null
          created_at?: string
          customer_acceptance?: string
          id?: string
          issues?: string | null
          job_id?: string
          operator_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_market_chunks: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          content: string
          document_id: string
          id: string
          similarity: number
          source_url: string
          title: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "team"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "team"],
    },
  },
} as const
