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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      courses: {
        Row: {
          course_intensity: string | null
          created_at: string
          degree: string
          id: string
          program_duration: string | null
          program_name: string
          starting_month: string | null
          stream_name: string
          study_level: string
          study_mode: string | null
          tuition_fees: string | null
          university_id: string
          updated_at: string
        }
        Insert: {
          course_intensity?: string | null
          created_at?: string
          degree: string
          id?: string
          program_duration?: string | null
          program_name: string
          starting_month?: string | null
          stream_name: string
          study_level: string
          study_mode?: string | null
          tuition_fees?: string | null
          university_id: string
          updated_at?: string
        }
        Update: {
          course_intensity?: string | null
          created_at?: string
          degree?: string
          id?: string
          program_duration?: string | null
          program_name?: string
          starting_month?: string | null
          stream_name?: string
          study_level?: string
          study_mode?: string | null
          tuition_fees?: string | null
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          accepted_formats: string[] | null
          category: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          max_file_size_image: number | null
          max_file_size_pdf: number | null
          name: string
          required: boolean | null
          updated_at: string | null
        }
        Insert: {
          accepted_formats?: string[] | null
          category: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          max_file_size_image?: number | null
          max_file_size_pdf?: number | null
          name: string
          required?: boolean | null
          updated_at?: string | null
        }
        Update: {
          accepted_formats?: string[] | null
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          max_file_size_image?: number | null
          max_file_size_pdf?: number | null
          name?: string
          required?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_documents: {
        Row: {
          created_at: string | null
          document_type_id: string
          file_path: string
          file_size: number
          id: string
          lead_id: string
          mime_type: string
          original_filename: string
          stored_filename: string
          updated_at: string | null
          upload_status: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          verification_notes: string | null
          verified_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          document_type_id: string
          file_path: string
          file_size: number
          id?: string
          lead_id: string
          mime_type: string
          original_filename: string
          stored_filename: string
          updated_at?: string | null
          upload_status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          document_type_id?: string
          file_path?: string
          file_size?: number
          id?: string
          lead_id?: string
          mime_type?: string
          original_filename?: string
          stored_filename?: string
          updated_at?: string | null
          upload_status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_universities: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          university_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          university_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead_universities_lead_id"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_universities_Global_uni_Rank_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_universities_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          case_id: string
          co_applicant_name: string
          co_applicant_pin: string
          co_applicant_relationship: string
          co_applicant_salary: number
          created_at: string
          documents_status: string
          id: string
          intake_month: number | null
          intake_year: number | null
          lender: string
          loan_amount: number
          loan_type: string
          status: string
          student_dob: string | null
          student_email: string
          student_name: string
          student_phone: string
          study_destination: string
          test_score: string | null
          test_type: string | null
          updated_at: string
        }
        Insert: {
          case_id: string
          co_applicant_name: string
          co_applicant_pin: string
          co_applicant_relationship: string
          co_applicant_salary: number
          created_at?: string
          documents_status?: string
          id?: string
          intake_month?: number | null
          intake_year?: number | null
          lender: string
          loan_amount: number
          loan_type: string
          status?: string
          student_dob?: string | null
          student_email: string
          student_name: string
          student_phone: string
          study_destination: string
          test_score?: string | null
          test_type?: string | null
          updated_at?: string
        }
        Update: {
          case_id?: string
          co_applicant_name?: string
          co_applicant_pin?: string
          co_applicant_relationship?: string
          co_applicant_salary?: number
          created_at?: string
          documents_status?: string
          id?: string
          intake_month?: number | null
          intake_year?: number | null
          lender?: string
          loan_amount?: number
          loan_type?: string
          status?: string
          student_dob?: string | null
          student_email?: string
          student_name?: string
          student_phone?: string
          study_destination?: string
          test_score?: string | null
          test_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          city: string
          country: string
          created_at: string
          global_rank: number | null
          id: string
          name: string
          score: number | null
          updated_at: string
          url: string | null
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          global_rank?: number | null
          id?: string
          name: string
          score?: number | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          global_rank?: number | null
          id?: string
          name?: string
          score?: number | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
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
