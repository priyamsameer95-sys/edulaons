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
      academic_tests: {
        Row: {
          certificate_number: string | null
          created_at: string
          expiry_date: string | null
          id: string
          score: string
          student_id: string
          test_date: string | null
          test_type: Database["public"]["Enums"]["test_type_enum"]
          updated_at: string
        }
        Insert: {
          certificate_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          score: string
          student_id: string
          test_date?: string | null
          test_type: Database["public"]["Enums"]["test_type_enum"]
          updated_at?: string
        }
        Update: {
          certificate_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          score?: string
          student_id?: string
          test_date?: string | null
          test_type?: Database["public"]["Enums"]["test_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_academic_tests_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      app_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          partner_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          partner_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          partner_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_users_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_error_logs: {
        Row: {
          context: Json | null
          created_at: string
          error_message: string | null
          error_type: string
          id: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          error_message?: string | null
          error_type: string
          id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          error_message?: string | null
          error_type?: string
          id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      co_applicants: {
        Row: {
          created_at: string
          email: string | null
          employer: string | null
          id: string
          name: string
          occupation: string | null
          phone: string | null
          pin_code: string
          relationship: Database["public"]["Enums"]["relationship_enum"]
          salary: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          employer?: string | null
          id?: string
          name: string
          occupation?: string | null
          phone?: string | null
          pin_code: string
          relationship: Database["public"]["Enums"]["relationship_enum"]
          salary: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          employer?: string | null
          id?: string
          name?: string
          occupation?: string | null
          phone?: string | null
          pin_code?: string
          relationship?: Database["public"]["Enums"]["relationship_enum"]
          salary?: number
          updated_at?: string
        }
        Relationships: []
      }
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
      data_access_logs: {
        Row: {
          accessed_at: string | null
          action: string
          id: string
          ip_address: string | null
          partner_id: string | null
          record_count: number | null
          table_name: string
          user_agent: string | null
          user_email: string
          user_id: string | null
          user_role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          accessed_at?: string | null
          action: string
          id?: string
          ip_address?: string | null
          partner_id?: string | null
          record_count?: number | null
          table_name: string
          user_agent?: string | null
          user_email: string
          user_id?: string | null
          user_role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          accessed_at?: string | null
          action?: string
          id?: string
          ip_address?: string | null
          partner_id?: string | null
          record_count?: number | null
          table_name?: string
          user_agent?: string | null
          user_email?: string
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
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
          admin_notes: string | null
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
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
          version: number | null
        }
        Insert: {
          admin_notes?: string | null
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
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          version?: number | null
        }
        Update: {
          admin_notes?: string | null
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
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead_documents_lead_id"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead_documents_lead_new"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_status_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string
          id: string
          lead_id: string
          new_documents_status:
            | Database["public"]["Enums"]["document_status_enum"]
            | null
          new_status: Database["public"]["Enums"]["lead_status_enum"]
          notes: string | null
          old_documents_status:
            | Database["public"]["Enums"]["document_status_enum"]
            | null
          old_status: Database["public"]["Enums"]["lead_status_enum"] | null
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          lead_id: string
          new_documents_status?:
            | Database["public"]["Enums"]["document_status_enum"]
            | null
          new_status: Database["public"]["Enums"]["lead_status_enum"]
          notes?: string | null
          old_documents_status?:
            | Database["public"]["Enums"]["document_status_enum"]
            | null
          old_status?: Database["public"]["Enums"]["lead_status_enum"] | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          new_documents_status?:
            | Database["public"]["Enums"]["document_status_enum"]
            | null
          new_status?: Database["public"]["Enums"]["lead_status_enum"]
          notes?: string | null
          old_documents_status?:
            | Database["public"]["Enums"]["document_status_enum"]
            | null
          old_status?: Database["public"]["Enums"]["lead_status_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_status_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
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
            referencedRelation: "leads_new"
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
      leads_new: {
        Row: {
          case_id: string
          co_applicant_id: string
          created_at: string
          documents_status: Database["public"]["Enums"]["document_status_enum"]
          documents_status_updated_at: string | null
          id: string
          intake_month: number | null
          intake_year: number | null
          lender_id: string
          loan_amount: number
          loan_type: Database["public"]["Enums"]["loan_type_enum"]
          partner_id: string | null
          status: Database["public"]["Enums"]["lead_status_enum"]
          status_updated_at: string | null
          student_id: string
          study_destination: Database["public"]["Enums"]["study_destination_enum"]
          updated_at: string
        }
        Insert: {
          case_id: string
          co_applicant_id: string
          created_at?: string
          documents_status?: Database["public"]["Enums"]["document_status_enum"]
          documents_status_updated_at?: string | null
          id?: string
          intake_month?: number | null
          intake_year?: number | null
          lender_id: string
          loan_amount: number
          loan_type: Database["public"]["Enums"]["loan_type_enum"]
          partner_id?: string | null
          status?: Database["public"]["Enums"]["lead_status_enum"]
          status_updated_at?: string | null
          student_id: string
          study_destination: Database["public"]["Enums"]["study_destination_enum"]
          updated_at?: string
        }
        Update: {
          case_id?: string
          co_applicant_id?: string
          created_at?: string
          documents_status?: Database["public"]["Enums"]["document_status_enum"]
          documents_status_updated_at?: string | null
          id?: string
          intake_month?: number | null
          intake_year?: number | null
          lender_id?: string
          loan_amount?: number
          loan_type?: Database["public"]["Enums"]["loan_type_enum"]
          partner_id?: string | null
          status?: Database["public"]["Enums"]["lead_status_enum"]
          status_updated_at?: string | null
          student_id?: string
          study_destination?: Database["public"]["Enums"]["study_destination_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_leads_co_applicant"
            columns: ["co_applicant_id"]
            isOneToOne: false
            referencedRelation: "co_applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_leads_lender"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_leads_partner"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_leads_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lenders: {
        Row: {
          code: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          code: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          code?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          address: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          partner_code: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          partner_code: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          partner_code?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          id: string
          name: string
          nationality: string | null
          phone: string
          postal_code: string | null
          state: string | null
          street_address: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          id?: string
          name: string
          nationality?: string | null
          phone: string
          postal_code?: string | null
          state?: string | null
          street_address?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          id?: string
          name?: string
          nationality?: string | null
          phone?: string
          postal_code?: string | null
          state?: string | null
          street_address?: string | null
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
      get_user_partner: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      migrate_existing_leads: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      migrate_existing_leads_safe: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "partner" | "admin" | "super_admin"
      document_status_enum:
        | "pending"
        | "uploaded"
        | "verified"
        | "rejected"
        | "resubmission_required"
      lead_status_enum:
        | "new"
        | "contacted"
        | "in_progress"
        | "document_review"
        | "approved"
        | "rejected"
        | "withdrawn"
      loan_type_enum: "secured" | "unsecured"
      relationship_enum: "parent" | "spouse" | "sibling" | "guardian" | "other"
      study_destination_enum:
        | "Australia"
        | "Canada"
        | "Germany"
        | "Ireland"
        | "New Zealand"
        | "UK"
        | "USA"
        | "Other"
      test_type_enum:
        | "IELTS"
        | "TOEFL"
        | "PTE"
        | "GRE"
        | "GMAT"
        | "SAT"
        | "Other"
      upload_status_enum: "uploading" | "uploaded" | "failed" | "processing"
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
    Enums: {
      app_role: ["partner", "admin", "super_admin"],
      document_status_enum: [
        "pending",
        "uploaded",
        "verified",
        "rejected",
        "resubmission_required",
      ],
      lead_status_enum: [
        "new",
        "contacted",
        "in_progress",
        "document_review",
        "approved",
        "rejected",
        "withdrawn",
      ],
      loan_type_enum: ["secured", "unsecured"],
      relationship_enum: ["parent", "spouse", "sibling", "guardian", "other"],
      study_destination_enum: [
        "Australia",
        "Canada",
        "Germany",
        "Ireland",
        "New Zealand",
        "UK",
        "USA",
        "Other",
      ],
      test_type_enum: ["IELTS", "TOEFL", "PTE", "GRE", "GMAT", "SAT", "Other"],
      upload_status_enum: ["uploading", "uploaded", "failed", "processing"],
    },
  },
} as const
