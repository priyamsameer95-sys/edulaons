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
      activity_completions: {
        Row: {
          activity_id: string
          activity_type: string
          completed_at: string | null
          created_at: string | null
          id: string
          impact_amount: number | null
          time_to_complete_seconds: number | null
          user_id: string | null
        }
        Insert: {
          activity_id: string
          activity_type: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          impact_amount?: number | null
          time_to_complete_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          activity_id?: string
          activity_type?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          impact_amount?: number | null
          time_to_complete_seconds?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_security_audit: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_lead_id: string | null
          target_partner_id: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_lead_id?: string | null
          target_partner_id?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_lead_id?: string | null
          target_partner_id?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ai_lender_recommendations: {
        Row: {
          accepted_lender_id: string | null
          ai_unavailable: boolean | null
          all_lender_scores: Json | null
          all_lenders_output: Json | null
          assignment_mode: string | null
          confidence_score: number | null
          created_at: string | null
          decision: string | null
          id: string
          inputs_snapshot: Json | null
          lead_id: string
          lender_snapshots: Json | null
          model_version: string | null
          override_reason: string | null
          pillar_scores: Json | null
          rationale: string | null
          recommendation_context: Json | null
          recommended_lender_ids: string[]
          recommended_lenders_data: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewed_by_role: string | null
          strategy: string | null
          student_facing_reason: string | null
          student_tier: string | null
          urgency_zone: string | null
          version: number | null
        }
        Insert: {
          accepted_lender_id?: string | null
          ai_unavailable?: boolean | null
          all_lender_scores?: Json | null
          all_lenders_output?: Json | null
          assignment_mode?: string | null
          confidence_score?: number | null
          created_at?: string | null
          decision?: string | null
          id?: string
          inputs_snapshot?: Json | null
          lead_id: string
          lender_snapshots?: Json | null
          model_version?: string | null
          override_reason?: string | null
          pillar_scores?: Json | null
          rationale?: string | null
          recommendation_context?: Json | null
          recommended_lender_ids: string[]
          recommended_lenders_data?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_role?: string | null
          strategy?: string | null
          student_facing_reason?: string | null
          student_tier?: string | null
          urgency_zone?: string | null
          version?: number | null
        }
        Update: {
          accepted_lender_id?: string | null
          ai_unavailable?: boolean | null
          all_lender_scores?: Json | null
          all_lenders_output?: Json | null
          assignment_mode?: string | null
          confidence_score?: number | null
          created_at?: string | null
          decision?: string | null
          id?: string
          inputs_snapshot?: Json | null
          lead_id?: string
          lender_snapshots?: Json | null
          model_version?: string | null
          override_reason?: string | null
          pillar_scores?: Json | null
          rationale?: string | null
          recommendation_context?: Json | null
          recommended_lender_ids?: string[]
          recommended_lenders_data?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_role?: string | null
          strategy?: string | null
          student_facing_reason?: string | null
          student_tier?: string | null
          urgency_zone?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_lender_recommendations_accepted_lender_id_fkey"
            columns: ["accepted_lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_lender_recommendations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_override_feedback: {
        Row: {
          context_snapshot: Json | null
          created_at: string
          feedback_processed: boolean | null
          id: string
          lead_id: string
          original_lender_id: string | null
          overridden_by: string | null
          overridden_by_role: string | null
          overridden_to_lender_id: string
          override_category: string | null
          override_reason: string
          processed_at: string | null
          recommendation_id: string | null
        }
        Insert: {
          context_snapshot?: Json | null
          created_at?: string
          feedback_processed?: boolean | null
          id?: string
          lead_id: string
          original_lender_id?: string | null
          overridden_by?: string | null
          overridden_by_role?: string | null
          overridden_to_lender_id: string
          override_category?: string | null
          override_reason: string
          processed_at?: string | null
          recommendation_id?: string | null
        }
        Update: {
          context_snapshot?: Json | null
          created_at?: string
          feedback_processed?: boolean | null
          id?: string
          lead_id?: string
          original_lender_id?: string | null
          overridden_by?: string | null
          overridden_by_role?: string | null
          overridden_to_lender_id?: string
          override_category?: string | null
          override_reason?: string
          processed_at?: string | null
          recommendation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_override_feedback_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_override_feedback_original_lender_id_fkey"
            columns: ["original_lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_override_feedback_overridden_to_lender_id_fkey"
            columns: ["overridden_to_lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_override_feedback_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "ai_lender_recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      app_users: {
        Row: {
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          deactivation_reason: string | null
          email: string
          first_login_at: string | null
          id: string
          is_active: boolean
          partner_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          email: string
          first_login_at?: string | null
          id?: string
          is_active?: boolean
          partner_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          email?: string
          first_login_at?: string | null
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
            referencedRelation: "partner_statistics"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "app_users_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_app_users_partner"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_statistics"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "fk_app_users_partner"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      application_activities: {
        Row: {
          activity_type: string
          actor_id: string | null
          actor_name: string | null
          actor_role: Database["public"]["Enums"]["app_role"] | null
          created_at: string
          description: string
          id: string
          lead_id: string
          metadata: Json | null
        }
        Insert: {
          activity_type: string
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          description: string
          id?: string
          lead_id: string
          metadata?: Json | null
        }
        Update: {
          activity_type?: string
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          description?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "application_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_application_activities_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
        ]
      }
      application_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          is_internal: boolean | null
          lead_id: string
          updated_at: string
          user_id: string | null
          user_name: string | null
          user_role: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          lead_id: string
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
          user_role?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          lead_id?: string
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
          user_role?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "application_comments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_application_comments_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
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
      clarification_templates: {
        Row: {
          auto_trigger_condition: Json | null
          category: string
          created_at: string
          display_order: number | null
          expected_document_type: string | null
          id: string
          is_active: boolean
          question_context: string | null
          question_text: string
          requires_document: boolean
          response_type: string | null
          updated_at: string
        }
        Insert: {
          auto_trigger_condition?: Json | null
          category: string
          created_at?: string
          display_order?: number | null
          expected_document_type?: string | null
          id?: string
          is_active?: boolean
          question_context?: string | null
          question_text: string
          requires_document?: boolean
          response_type?: string | null
          updated_at?: string
        }
        Update: {
          auto_trigger_condition?: Json | null
          category?: string
          created_at?: string
          display_order?: number | null
          expected_document_type?: string | null
          id?: string
          is_active?: boolean
          question_context?: string | null
          question_text?: string
          requires_document?: boolean
          response_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      co_applicants: {
        Row: {
          created_at: string
          credit_score: number | null
          documents_required: boolean | null
          email: string | null
          employer: string | null
          employer_details: string | null
          employment_duration_years: number | null
          employment_type: string | null
          id: string
          monthly_salary: number | null
          name: string
          occupation: string | null
          occupation_details: string | null
          phone: string | null
          pin_code: string
          relationship: Database["public"]["Enums"]["relationship_enum"]
          salary: number
          state: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_score?: number | null
          documents_required?: boolean | null
          email?: string | null
          employer?: string | null
          employer_details?: string | null
          employment_duration_years?: number | null
          employment_type?: string | null
          id?: string
          monthly_salary?: number | null
          name: string
          occupation?: string | null
          occupation_details?: string | null
          phone?: string | null
          pin_code: string
          relationship: Database["public"]["Enums"]["relationship_enum"]
          salary: number
          state?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_score?: number | null
          documents_required?: boolean | null
          email?: string | null
          employer?: string | null
          employer_details?: string | null
          employment_duration_years?: number | null
          employment_type?: string | null
          id?: string
          monthly_salary?: number | null
          name?: string
          occupation?: string | null
          occupation_details?: string | null
          phone?: string | null
          pin_code?: string
          relationship?: Database["public"]["Enums"]["relationship_enum"]
          salary?: number
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      course_eligibility: {
        Row: {
          course_name: string
          created_at: string | null
          eligible: boolean | null
          id: string
          required_qualification: string
          study_level: string
          updated_at: string | null
        }
        Insert: {
          course_name: string
          created_at?: string | null
          eligible?: boolean | null
          id?: string
          required_qualification: string
          study_level: string
          updated_at?: string | null
        }
        Update: {
          course_name?: string
          created_at?: string | null
          eligible?: boolean | null
          id?: string
          required_qualification?: string
          study_level?: string
          updated_at?: string | null
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
          {
            foreignKeyName: "fk_courses_university"
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
      document_requirements: {
        Row: {
          created_at: string | null
          display_order: number | null
          document_type_id: string | null
          id: string
          is_required: boolean | null
          loan_classification: Database["public"]["Enums"]["loan_classification_enum"]
          stage: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          document_type_id?: string | null
          id?: string
          is_required?: boolean | null
          loan_classification: Database["public"]["Enums"]["loan_classification_enum"]
          stage?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          document_type_id?: string | null
          id?: string
          is_required?: boolean | null
          loan_classification?: Database["public"]["Enums"]["loan_classification_enum"]
          stage?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_requirements_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
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
      eligibility_scores: {
        Row: {
          approval_status: string
          calculated_at: string | null
          calculation_version: string | null
          co_applicant_breakdown: Json | null
          co_applicant_score: number
          created_at: string | null
          eligible_loan_max: number | null
          eligible_loan_min: number | null
          id: string
          interest_rate_max: number | null
          interest_rate_min: number | null
          lead_id: string
          lender_id: string | null
          loan_band_percentage: string | null
          overall_score: number
          rate_tier: string | null
          rejection_reason: string | null
          student_breakdown: Json | null
          student_score: number
          university_breakdown: Json | null
          university_score: number
          updated_at: string | null
        }
        Insert: {
          approval_status: string
          calculated_at?: string | null
          calculation_version?: string | null
          co_applicant_breakdown?: Json | null
          co_applicant_score?: number
          created_at?: string | null
          eligible_loan_max?: number | null
          eligible_loan_min?: number | null
          id?: string
          interest_rate_max?: number | null
          interest_rate_min?: number | null
          lead_id: string
          lender_id?: string | null
          loan_band_percentage?: string | null
          overall_score?: number
          rate_tier?: string | null
          rejection_reason?: string | null
          student_breakdown?: Json | null
          student_score?: number
          university_breakdown?: Json | null
          university_score?: number
          updated_at?: string | null
        }
        Update: {
          approval_status?: string
          calculated_at?: string | null
          calculation_version?: string | null
          co_applicant_breakdown?: Json | null
          co_applicant_score?: number
          created_at?: string | null
          eligible_loan_max?: number | null
          eligible_loan_min?: number | null
          id?: string
          interest_rate_max?: number | null
          interest_rate_min?: number | null
          lead_id?: string
          lender_id?: string | null
          loan_band_percentage?: string | null
          overall_score?: number
          rate_tier?: string | null
          rejection_reason?: string | null
          student_breakdown?: Json | null
          student_score?: number
          university_breakdown?: Json | null
          university_score?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_scores_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
        ]
      }
      field_audit_log: {
        Row: {
          change_reason: string | null
          change_source: string
          changed_by_id: string | null
          changed_by_name: string | null
          changed_by_type: string
          created_at: string
          field_name: string
          id: string
          lead_id: string
          new_value: string | null
          old_value: string | null
          table_name: string
        }
        Insert: {
          change_reason?: string | null
          change_source: string
          changed_by_id?: string | null
          changed_by_name?: string | null
          changed_by_type: string
          created_at?: string
          field_name: string
          id?: string
          lead_id: string
          new_value?: string | null
          old_value?: string | null
          table_name: string
        }
        Update: {
          change_reason?: string | null
          change_source?: string
          changed_by_id?: string | null
          changed_by_name?: string | null
          changed_by_type?: string
          created_at?: string
          field_name?: string
          id?: string
          lead_id?: string
          new_value?: string | null
          old_value?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_audit_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_courses: {
        Row: {
          course_id: string
          created_at: string | null
          custom_course_name: string | null
          id: string
          is_custom_course: boolean | null
          lead_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          custom_course_name?: string | null
          id?: string
          is_custom_course?: boolean | null
          lead_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          custom_course_name?: string | null
          id?: string
          is_custom_course?: boolean | null
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_courses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_documents: {
        Row: {
          admin_notes: string | null
          ai_confidence_score: number | null
          ai_detected_type: string | null
          ai_quality_assessment: string | null
          ai_validated_at: string | null
          ai_validation_notes: string | null
          ai_validation_status: string | null
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
          verification_status: Database["public"]["Enums"]["document_status_enum"]
          verified_at: string | null
          verified_by: string | null
          version: number | null
        }
        Insert: {
          admin_notes?: string | null
          ai_confidence_score?: number | null
          ai_detected_type?: string | null
          ai_quality_assessment?: string | null
          ai_validated_at?: string | null
          ai_validation_notes?: string | null
          ai_validation_status?: string | null
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
          verification_status?: Database["public"]["Enums"]["document_status_enum"]
          verified_at?: string | null
          verified_by?: string | null
          version?: number | null
        }
        Update: {
          admin_notes?: string | null
          ai_confidence_score?: number | null
          ai_detected_type?: string | null
          ai_quality_assessment?: string | null
          ai_validated_at?: string | null
          ai_validation_notes?: string | null
          ai_validation_status?: string | null
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
          verification_status?: Database["public"]["Enums"]["document_status_enum"]
          verified_at?: string | null
          verified_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead_documents_document_type"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead_documents_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "lead_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
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
          reason_code: string | null
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
          reason_code?: string | null
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
          reason_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead_status_history_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "fk_lead_universities_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead_universities_lead_id"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead_universities_university"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
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
      leads_new: {
        Row: {
          case_complexity:
            | Database["public"]["Enums"]["case_complexity_enum"]
            | null
          case_id: string
          co_applicant_id: string
          course_type: string | null
          created_at: string
          created_by_role: string | null
          created_by_user_id: string | null
          current_stage_started_at: string | null
          documents_status: Database["public"]["Enums"]["document_status_enum"]
          documents_status_updated_at: string | null
          eligibility_checked_at: string | null
          eligibility_result: string | null
          eligibility_score: number | null
          id: string
          intake_month: number | null
          intake_year: number | null
          is_quick_lead: boolean | null
          lan_number: string | null
          lender_id: string
          loan_amount: number
          loan_classification:
            | Database["public"]["Enums"]["loan_classification_enum"]
            | null
          loan_config_updated_at: string | null
          loan_config_updated_by: string | null
          loan_type: Database["public"]["Enums"]["loan_type_enum"]
          partner_id: string | null
          pd_call_scheduled_at: string | null
          pd_call_status: string | null
          pf_amount: number | null
          pf_paid_at: string | null
          property_verification_status: string | null
          quick_lead_completed_at: string | null
          sanction_amount: number | null
          sanction_date: string | null
          sanction_letter_date: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status_enum"]
          status_updated_at: string | null
          student_id: string
          study_destination: Database["public"]["Enums"]["study_destination_enum"]
          target_lender_id: string | null
          updated_at: string
        }
        Insert: {
          case_complexity?:
            | Database["public"]["Enums"]["case_complexity_enum"]
            | null
          case_id: string
          co_applicant_id: string
          course_type?: string | null
          created_at?: string
          created_by_role?: string | null
          created_by_user_id?: string | null
          current_stage_started_at?: string | null
          documents_status?: Database["public"]["Enums"]["document_status_enum"]
          documents_status_updated_at?: string | null
          eligibility_checked_at?: string | null
          eligibility_result?: string | null
          eligibility_score?: number | null
          id?: string
          intake_month?: number | null
          intake_year?: number | null
          is_quick_lead?: boolean | null
          lan_number?: string | null
          lender_id: string
          loan_amount: number
          loan_classification?:
            | Database["public"]["Enums"]["loan_classification_enum"]
            | null
          loan_config_updated_at?: string | null
          loan_config_updated_by?: string | null
          loan_type: Database["public"]["Enums"]["loan_type_enum"]
          partner_id?: string | null
          pd_call_scheduled_at?: string | null
          pd_call_status?: string | null
          pf_amount?: number | null
          pf_paid_at?: string | null
          property_verification_status?: string | null
          quick_lead_completed_at?: string | null
          sanction_amount?: number | null
          sanction_date?: string | null
          sanction_letter_date?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status_enum"]
          status_updated_at?: string | null
          student_id: string
          study_destination: Database["public"]["Enums"]["study_destination_enum"]
          target_lender_id?: string | null
          updated_at?: string
        }
        Update: {
          case_complexity?:
            | Database["public"]["Enums"]["case_complexity_enum"]
            | null
          case_id?: string
          co_applicant_id?: string
          course_type?: string | null
          created_at?: string
          created_by_role?: string | null
          created_by_user_id?: string | null
          current_stage_started_at?: string | null
          documents_status?: Database["public"]["Enums"]["document_status_enum"]
          documents_status_updated_at?: string | null
          eligibility_checked_at?: string | null
          eligibility_result?: string | null
          eligibility_score?: number | null
          id?: string
          intake_month?: number | null
          intake_year?: number | null
          is_quick_lead?: boolean | null
          lan_number?: string | null
          lender_id?: string
          loan_amount?: number
          loan_classification?:
            | Database["public"]["Enums"]["loan_classification_enum"]
            | null
          loan_config_updated_at?: string | null
          loan_config_updated_by?: string | null
          loan_type?: Database["public"]["Enums"]["loan_type_enum"]
          partner_id?: string | null
          pd_call_scheduled_at?: string | null
          pd_call_status?: string | null
          pf_amount?: number | null
          pf_paid_at?: string | null
          property_verification_status?: string | null
          quick_lead_completed_at?: string | null
          sanction_amount?: number | null
          sanction_date?: string | null
          sanction_letter_date?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status_enum"]
          status_updated_at?: string | null
          student_id?: string
          study_destination?: Database["public"]["Enums"]["study_destination_enum"]
          target_lender_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_new_co_applicant_id_fkey"
            columns: ["co_applicant_id"]
            isOneToOne: false
            referencedRelation: "co_applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_new_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_new_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_statistics"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "leads_new_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_new_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_new_target_lender_id_fkey"
            columns: ["target_lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
        ]
      }
      lender_assignment_history: {
        Row: {
          assignment_notes: string | null
          change_reason: string | null
          changed_by: string | null
          created_at: string
          id: string
          lead_id: string
          new_lender_id: string
          old_lender_id: string | null
        }
        Insert: {
          assignment_notes?: string | null
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          lead_id: string
          new_lender_id: string
          old_lender_id?: string | null
        }
        Update: {
          assignment_notes?: string | null
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          new_lender_id?: string
          old_lender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lah_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lah_new_lender"
            columns: ["new_lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lah_old_lender"
            columns: ["old_lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lender_assignment_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lender_assignment_history_new_lender_id_fkey"
            columns: ["new_lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lender_assignment_history_old_lender_id_fkey"
            columns: ["old_lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
        ]
      }
      lender_bre_history: {
        Row: {
          admin_remarks: string | null
          bre_json: Json | null
          bre_text: string | null
          change_reason: string
          changed_at: string | null
          changed_by: string | null
          collateral_preference: string[] | null
          country_restrictions: string[] | null
          credit_expectations: string | null
          experience_score: number | null
          id: string
          income_expectations_max: number | null
          income_expectations_min: number | null
          lender_id: string
          processing_time_range_max: number | null
          processing_time_range_min: number | null
          university_restrictions: Json | null
          version_number: number
        }
        Insert: {
          admin_remarks?: string | null
          bre_json?: Json | null
          bre_text?: string | null
          change_reason: string
          changed_at?: string | null
          changed_by?: string | null
          collateral_preference?: string[] | null
          country_restrictions?: string[] | null
          credit_expectations?: string | null
          experience_score?: number | null
          id?: string
          income_expectations_max?: number | null
          income_expectations_min?: number | null
          lender_id: string
          processing_time_range_max?: number | null
          processing_time_range_min?: number | null
          university_restrictions?: Json | null
          version_number: number
        }
        Update: {
          admin_remarks?: string | null
          bre_json?: Json | null
          bre_text?: string | null
          change_reason?: string
          changed_at?: string | null
          changed_by?: string | null
          collateral_preference?: string[] | null
          country_restrictions?: string[] | null
          credit_expectations?: string | null
          experience_score?: number | null
          id?: string
          income_expectations_max?: number | null
          income_expectations_min?: number | null
          lender_id?: string
          processing_time_range_max?: number | null
          processing_time_range_min?: number | null
          university_restrictions?: Json | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "lender_bre_history_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
        ]
      }
      lender_config: {
        Row: {
          created_at: string | null
          id: string
          lender_id: string
          loan_bands: Json
          max_loan_amount: number
          rate_config: Json
          score_weights: Json | null
          scoring_rules: Json | null
          university_grade_mapping: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lender_id: string
          loan_bands?: Json
          max_loan_amount: number
          rate_config?: Json
          score_weights?: Json | null
          scoring_rules?: Json | null
          university_grade_mapping?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lender_id?: string
          loan_bands?: Json
          max_loan_amount?: number
          rate_config?: Json
          score_weights?: Json | null
          scoring_rules?: Json | null
          university_grade_mapping?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lender_config_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: true
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
        ]
      }
      lenders: {
        Row: {
          admin_remarks: string | null
          approval_rate: number | null
          bre_json: Json | null
          bre_text: string | null
          bre_updated_at: string | null
          bre_updated_by: string | null
          code: string
          collateral_preference: string[] | null
          contact_email: string | null
          contact_phone: string | null
          country_restrictions: string[] | null
          created_at: string
          credit_expectations: string | null
          description: string | null
          disbursement_time_days: number | null
          display_order: number | null
          eligible_expenses: Json | null
          experience_score: number | null
          foreclosure_charges: number | null
          id: string
          income_expectations_max: number | null
          income_expectations_min: number | null
          interest_rate_max: number | null
          interest_rate_min: number | null
          is_active: boolean
          key_features: Json | null
          loan_amount_max: number | null
          loan_amount_min: number | null
          logo_url: string | null
          moratorium_period: string | null
          name: string
          preferred_rank: number | null
          processing_fee: number | null
          processing_time_days: number | null
          processing_time_range_max: number | null
          processing_time_range_min: number | null
          required_documents: Json | null
          university_restrictions: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          admin_remarks?: string | null
          approval_rate?: number | null
          bre_json?: Json | null
          bre_text?: string | null
          bre_updated_at?: string | null
          bre_updated_by?: string | null
          code: string
          collateral_preference?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          country_restrictions?: string[] | null
          created_at?: string
          credit_expectations?: string | null
          description?: string | null
          disbursement_time_days?: number | null
          display_order?: number | null
          eligible_expenses?: Json | null
          experience_score?: number | null
          foreclosure_charges?: number | null
          id?: string
          income_expectations_max?: number | null
          income_expectations_min?: number | null
          interest_rate_max?: number | null
          interest_rate_min?: number | null
          is_active?: boolean
          key_features?: Json | null
          loan_amount_max?: number | null
          loan_amount_min?: number | null
          logo_url?: string | null
          moratorium_period?: string | null
          name: string
          preferred_rank?: number | null
          processing_fee?: number | null
          processing_time_days?: number | null
          processing_time_range_max?: number | null
          processing_time_range_min?: number | null
          required_documents?: Json | null
          university_restrictions?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          admin_remarks?: string | null
          approval_rate?: number | null
          bre_json?: Json | null
          bre_text?: string | null
          bre_updated_at?: string | null
          bre_updated_by?: string | null
          code?: string
          collateral_preference?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          country_restrictions?: string[] | null
          created_at?: string
          credit_expectations?: string | null
          description?: string | null
          disbursement_time_days?: number | null
          display_order?: number | null
          eligible_expenses?: Json | null
          experience_score?: number | null
          foreclosure_charges?: number | null
          id?: string
          income_expectations_max?: number | null
          income_expectations_min?: number | null
          interest_rate_max?: number | null
          interest_rate_min?: number | null
          is_active?: boolean
          key_features?: Json | null
          loan_amount_max?: number | null
          loan_amount_min?: number | null
          logo_url?: string | null
          moratorium_period?: string | null
          name?: string
          preferred_rank?: number | null
          processing_fee?: number | null
          processing_time_days?: number | null
          processing_time_range_max?: number | null
          processing_time_range_min?: number | null
          required_documents?: Json | null
          university_restrictions?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          in_app_notifications: boolean | null
          receive_lead_updates: boolean | null
          receive_partner_creation: boolean | null
          receive_student_first_login: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          in_app_notifications?: boolean | null
          receive_lead_updates?: boolean | null
          receive_partner_creation?: boolean | null
          receive_student_first_login?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          in_app_notifications?: boolean | null
          receive_lead_updates?: boolean | null
          receive_partner_creation?: boolean | null
          receive_student_first_login?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          lead_id: string | null
          message: string
          metadata: Json | null
          notification_type: string
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          lead_id?: string | null
          message: string
          metadata?: Json | null
          notification_type: string
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          lead_id?: string | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
        ]
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
      pin_code_tiers: {
        Row: {
          city: string
          created_at: string | null
          id: string
          pin_code: string
          state: string | null
          tier: string
          updated_at: string | null
        }
        Insert: {
          city: string
          created_at?: string | null
          id?: string
          pin_code: string
          state?: string | null
          tier: string
          updated_at?: string | null
        }
        Update: {
          city?: string
          created_at?: string | null
          id?: string
          pin_code?: string
          state?: string | null
          tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      protected_accounts: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          reason: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          reason: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          reason?: string
        }
        Relationships: []
      }
      role_change_audit: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          new_role: Database["public"]["Enums"]["app_role"] | null
          old_role: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_role?: Database["public"]["Enums"]["app_role"] | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_role?: Database["public"]["Enums"]["app_role"] | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string
        }
        Relationships: []
      }
      student_clarifications: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_role: string | null
          document_id: string | null
          due_date: string | null
          field_name: string | null
          id: string
          is_blocking: boolean
          lead_id: string
          priority: string
          question_context: string | null
          question_text: string
          question_type: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          responded_at: string | null
          response_document_id: string | null
          response_text: string | null
          response_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_role?: string | null
          document_id?: string | null
          due_date?: string | null
          field_name?: string | null
          id?: string
          is_blocking?: boolean
          lead_id: string
          priority?: string
          question_context?: string | null
          question_text: string
          question_type: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          responded_at?: string | null
          response_document_id?: string | null
          response_text?: string | null
          response_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_role?: string | null
          document_id?: string | null
          due_date?: string | null
          field_name?: string | null
          id?: string
          is_blocking?: boolean
          lead_id?: string
          priority?: string
          question_context?: string | null
          question_text?: string
          question_type?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          responded_at?: string | null
          response_document_id?: string | null
          response_text?: string | null
          response_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_clarifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "lead_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_clarifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_clarifications_response_document_id_fkey"
            columns: ["response_document_id"]
            isOneToOne: false
            referencedRelation: "lead_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      student_partner_mappings: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          mapped_at: string | null
          mapped_by: string | null
          mapping_reason: string | null
          partner_id: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          mapped_at?: string | null
          mapped_by?: string | null
          mapping_reason?: string | null
          partner_id: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          mapped_at?: string | null
          mapped_by?: string | null
          mapping_reason?: string | null
          partner_id?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_partner_mappings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_partner_mappings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_statistics"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "student_partner_mappings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_partner_mappings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          activated_at: string | null
          bachelors_cgpa: number | null
          bachelors_percentage: number | null
          city: string | null
          country: string | null
          created_at: string
          credit_score: number | null
          date_of_birth: string | null
          email: string | null
          email_invite_sent: boolean | null
          gender: string | null
          highest_qualification: string | null
          id: string
          invite_sent_at: string | null
          invite_token: string | null
          is_activated: boolean | null
          masters_cgpa: number | null
          masters_percentage: number | null
          name: string
          nationality: string | null
          otp_enabled: boolean | null
          phone: string
          pin_code_tier: string | null
          postal_code: string | null
          state: string | null
          street_address: string | null
          tenth_percentage: number | null
          twelfth_percentage: number | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          bachelors_cgpa?: number | null
          bachelors_percentage?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          credit_score?: number | null
          date_of_birth?: string | null
          email?: string | null
          email_invite_sent?: boolean | null
          gender?: string | null
          highest_qualification?: string | null
          id?: string
          invite_sent_at?: string | null
          invite_token?: string | null
          is_activated?: boolean | null
          masters_cgpa?: number | null
          masters_percentage?: number | null
          name: string
          nationality?: string | null
          otp_enabled?: boolean | null
          phone: string
          pin_code_tier?: string | null
          postal_code?: string | null
          state?: string | null
          street_address?: string | null
          tenth_percentage?: number | null
          twelfth_percentage?: number | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          bachelors_cgpa?: number | null
          bachelors_percentage?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          credit_score?: number | null
          date_of_birth?: string | null
          email?: string | null
          email_invite_sent?: boolean | null
          gender?: string | null
          highest_qualification?: string | null
          id?: string
          invite_sent_at?: string | null
          invite_token?: string | null
          is_activated?: boolean | null
          masters_cgpa?: number | null
          masters_percentage?: number | null
          name?: string
          nationality?: string | null
          otp_enabled?: boolean | null
          phone?: string
          pin_code_tier?: string | null
          postal_code?: string | null
          state?: string | null
          street_address?: string | null
          tenth_percentage?: number | null
          twelfth_percentage?: number | null
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
      university_lender_preferences: {
        Row: {
          compatibility_score: number | null
          created_at: string
          id: string
          is_preferred: boolean | null
          lender_id: string
          max_loan_amount: number | null
          min_loan_amount: number | null
          notes: string | null
          preferred_for_loan_type:
            | Database["public"]["Enums"]["loan_type_enum"]
            | null
          special_requirements: Json | null
          study_destination: Database["public"]["Enums"]["study_destination_enum"]
          university_id: string
          updated_at: string
        }
        Insert: {
          compatibility_score?: number | null
          created_at?: string
          id?: string
          is_preferred?: boolean | null
          lender_id: string
          max_loan_amount?: number | null
          min_loan_amount?: number | null
          notes?: string | null
          preferred_for_loan_type?:
            | Database["public"]["Enums"]["loan_type_enum"]
            | null
          special_requirements?: Json | null
          study_destination: Database["public"]["Enums"]["study_destination_enum"]
          university_id: string
          updated_at?: string
        }
        Update: {
          compatibility_score?: number | null
          created_at?: string
          id?: string
          is_preferred?: boolean | null
          lender_id?: string
          max_loan_amount?: number | null
          min_loan_amount?: number | null
          notes?: string | null
          preferred_for_loan_type?:
            | Database["public"]["Enums"]["loan_type_enum"]
            | null
          special_requirements?: Json | null
          study_destination?: Database["public"]["Enums"]["study_destination_enum"]
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ulp_lender"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ulp_university"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "university_lender_preferences_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "university_lender_preferences_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_management_logs: {
        Row: {
          action: string
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          performed_by: string
          reason: string | null
          success: boolean | null
          target_user_email: string
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by: string
          reason?: string | null
          success?: boolean | null
          target_user_email: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string
          reason?: string | null
          success?: boolean | null
          target_user_email?: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          revoked_at?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      partner_statistics: {
        Row: {
          active_lenders: number | null
          approved_leads: number | null
          approved_loan_amount: number | null
          in_progress_leads: number | null
          last_lead_date: string | null
          new_leads: number | null
          partner_code: string | null
          partner_id: string | null
          partner_name: string | null
          rejected_leads: number | null
          total_leads: number | null
          total_loan_amount: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      batch_insert_courses_ignore_duplicates: {
        Args: { course_data: Json[] }
        Returns: number
      }
      calculate_co_applicant_score: {
        Args: { p_co_applicant_id: string; p_lender_id: string }
        Returns: {
          breakdown: Json
          score: number
        }[]
      }
      calculate_eligibility_score: {
        Args: { p_lead_id: string }
        Returns: string
      }
      calculate_student_score: {
        Args: { p_lender_id: string; p_student_id: string }
        Returns: {
          breakdown: Json
          score: number
        }[]
      }
      calculate_university_score: {
        Args: { p_lead_id: string; p_lender_id: string }
        Returns: {
          breakdown: Json
          score: number
        }[]
      }
      check_duplicate_application: {
        Args: {
          _intake_month: number
          _intake_year: number
          _student_id: string
          _study_destination: Database["public"]["Enums"]["study_destination_enum"]
        }
        Returns: boolean
      }
      check_email_exists_system_wide: {
        Args: { check_email: string }
        Returns: {
          entity_id: string
          entity_role: string
          exists_in: string
        }[]
      }
      get_partner_lead_stats: {
        Args: { _partner_id: string }
        Returns: {
          approved_leads: number
          approved_loan_amount: number
          in_progress_leads: number
          new_leads: number
          rejected_leads: number
          total_leads: number
          total_loan_amount: number
        }[]
      }
      get_student_id_by_email: { Args: { _email: string }; Returns: string }
      get_user_partner: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_streak: { Args: { user_uuid: string }; Returns: number }
      grant_user_role: {
        Args: {
          _granted_by: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_student_user: { Args: never; Returns: boolean }
      log_admin_action: {
        Args: {
          _action: string
          _details?: Json
          _target_lead_id?: string
          _target_partner_id?: string
          _target_user_id?: string
        }
        Returns: string
      }
      migrate_existing_leads: { Args: never; Returns: undefined }
      migrate_existing_leads_safe: { Args: never; Returns: undefined }
      refresh_partner_statistics: { Args: never; Returns: undefined }
      revoke_user_role: {
        Args: {
          _revoked_by: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_leads: {
        Args: {
          page_num?: number
          page_size?: number
          partner_filter?: string
          search_query?: string
          status_filter?: string
        }
        Returns: {
          case_id: string
          co_applicant_id: string
          created_at: string
          documents_status: Database["public"]["Enums"]["document_status_enum"]
          id: string
          intake_month: number
          intake_year: number
          lender_id: string
          loan_amount: number
          loan_type: Database["public"]["Enums"]["loan_type_enum"]
          partner_id: string
          status: Database["public"]["Enums"]["lead_status_enum"]
          student_id: string
          study_destination: Database["public"]["Enums"]["study_destination_enum"]
          total_count: number
          updated_at: string
        }[]
      }
    }
    Enums: {
      app_role: "partner" | "admin" | "super_admin" | "student" | "kam"
      case_complexity_enum:
        | "straightforward"
        | "edge_case"
        | "high_risk"
        | "nri_case"
        | "low_credit_case"
        | "late_intake_case"
        | "rejected_case"
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
        | "lead_intake"
        | "first_contact"
        | "lenders_mapped"
        | "checklist_shared"
        | "docs_uploading"
        | "docs_submitted"
        | "docs_verified"
        | "logged_with_lender"
        | "counselling_done"
        | "pd_scheduled"
        | "pd_completed"
        | "additional_docs_pending"
        | "property_verification"
        | "credit_assessment"
        | "sanctioned"
        | "pf_pending"
        | "pf_paid"
        | "sanction_letter_issued"
        | "docs_dispatched"
        | "security_creation"
        | "ops_verification"
        | "disbursed"
      loan_classification_enum:
        | "unsecured_nbfc"
        | "secured_property"
        | "psu_bank"
        | "undecided"
        | "secured_fd"
        | "unsecured"
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
      app_role: ["partner", "admin", "super_admin", "student", "kam"],
      case_complexity_enum: [
        "straightforward",
        "edge_case",
        "high_risk",
        "nri_case",
        "low_credit_case",
        "late_intake_case",
        "rejected_case",
      ],
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
        "lead_intake",
        "first_contact",
        "lenders_mapped",
        "checklist_shared",
        "docs_uploading",
        "docs_submitted",
        "docs_verified",
        "logged_with_lender",
        "counselling_done",
        "pd_scheduled",
        "pd_completed",
        "additional_docs_pending",
        "property_verification",
        "credit_assessment",
        "sanctioned",
        "pf_pending",
        "pf_paid",
        "sanction_letter_issued",
        "docs_dispatched",
        "security_creation",
        "ops_verification",
        "disbursed",
      ],
      loan_classification_enum: [
        "unsecured_nbfc",
        "secured_property",
        "psu_bank",
        "undecided",
        "secured_fd",
        "unsecured",
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
