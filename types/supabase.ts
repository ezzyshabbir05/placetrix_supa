export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
  pgbouncer: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth: {
        Args: { p_usename: string }
        Returns: {
          password: string
          username: string
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
  public: {
    Tables: {
      attempt_answers: {
        Row: {
          answered_at: string
          attempt_id: string
          id: string
          is_correct: boolean | null
          marks_awarded: number | null
          question_id: string
          selected_option_ids: string[]
          time_spent_seconds: number
          updated_at: string
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          question_id: string
          selected_option_ids?: string[]
          time_spent_seconds?: number
          updated_at?: string
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          question_id?: string
          selected_option_ids?: string[]
          time_spent_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            referencedRelation: "attempt_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            referencedRelation: "view_test_results_detailed"
            referencedColumns: ["attempt_id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            referencedRelation: "view_question_analysis"
            referencedColumns: ["question_id"]
          },
        ]
      }
      candidate_profiles: {
        Row: {
          aadhaar_number: string | null
          cgpa: number | null
          course_name: string | null
          created_at: string
          current_address: string | null
          date_of_birth: string | null
          diploma_pass_year: number | null
          diploma_percentage: number | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          github_url: string | null
          hsc_pass_year: number | null
          hsc_percentage: number | null
          institute_id: string | null
          institute_verified: boolean | null
          is_diploma: boolean | null
          is_hsc: boolean | null
          last_name: string | null
          linkedin_url: string | null
          middle_name: string | null
          passout_year: number | null
          permanent_address: string | null
          phone_number: string | null
          portfolio_links: string[] | null
          profile_complete: boolean | null
          profile_id: string
          profile_image_path: string | null
          profile_updated: boolean
          sgpa_sem1: number | null
          sgpa_sem10: number | null
          sgpa_sem2: number | null
          sgpa_sem3: number | null
          sgpa_sem4: number | null
          sgpa_sem5: number | null
          sgpa_sem6: number | null
          sgpa_sem7: number | null
          sgpa_sem8: number | null
          sgpa_sem9: number | null
          skills: string[] | null
          ssc_pass_year: number | null
          ssc_percentage: number | null
          university_prn: string | null
          updated_at: string
        }
        Insert: {
          aadhaar_number?: string | null
          cgpa?: number | null
          course_name?: string | null
          created_at?: string
          current_address?: string | null
          date_of_birth?: string | null
          diploma_pass_year?: number | null
          diploma_percentage?: number | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          github_url?: string | null
          hsc_pass_year?: number | null
          hsc_percentage?: number | null
          institute_id?: string | null
          institute_verified?: boolean | null
          is_diploma?: boolean | null
          is_hsc?: boolean | null
          last_name?: string | null
          linkedin_url?: string | null
          middle_name?: string | null
          passout_year?: number | null
          permanent_address?: string | null
          phone_number?: string | null
          portfolio_links?: string[] | null
          profile_complete?: boolean | null
          profile_id: string
          profile_image_path?: string | null
          profile_updated?: boolean
          sgpa_sem1?: number | null
          sgpa_sem10?: number | null
          sgpa_sem2?: number | null
          sgpa_sem3?: number | null
          sgpa_sem4?: number | null
          sgpa_sem5?: number | null
          sgpa_sem6?: number | null
          sgpa_sem7?: number | null
          sgpa_sem8?: number | null
          sgpa_sem9?: number | null
          skills?: string[] | null
          ssc_pass_year?: number | null
          ssc_percentage?: number | null
          university_prn?: string | null
          updated_at?: string
        }
        Update: {
          aadhaar_number?: string | null
          cgpa?: number | null
          course_name?: string | null
          created_at?: string
          current_address?: string | null
          date_of_birth?: string | null
          diploma_pass_year?: number | null
          diploma_percentage?: number | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          github_url?: string | null
          hsc_pass_year?: number | null
          hsc_percentage?: number | null
          institute_id?: string | null
          institute_verified?: boolean | null
          is_diploma?: boolean | null
          is_hsc?: boolean | null
          last_name?: string | null
          linkedin_url?: string | null
          middle_name?: string | null
          passout_year?: number | null
          permanent_address?: string | null
          phone_number?: string | null
          portfolio_links?: string[] | null
          profile_complete?: boolean | null
          profile_id?: string
          profile_image_path?: string | null
          profile_updated?: boolean
          sgpa_sem1?: number | null
          sgpa_sem10?: number | null
          sgpa_sem2?: number | null
          sgpa_sem3?: number | null
          sgpa_sem4?: number | null
          sgpa_sem5?: number | null
          sgpa_sem6?: number | null
          sgpa_sem7?: number | null
          sgpa_sem8?: number | null
          sgpa_sem9?: number | null
          skills?: string[] | null
          ssc_pass_year?: number | null
          ssc_percentage?: number | null
          university_prn?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_profiles_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      institute_profiles: {
        Row: {
          address: string | null
          affiliation: string | null
          city: string | null
          country: string | null
          courses: string[] | null
          created_at: string
          email: string | null
          established_year: number | null
          institute_code: string | null
          institute_name: string
          logo_path: string | null
          phone_number: string | null
          pincode: string | null
          principal_email: string | null
          principal_name: string | null
          principal_phone: string | null
          profile_complete: boolean | null
          profile_id: string
          profile_updated: boolean
          social_links: string[] | null
          state: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          affiliation?: string | null
          city?: string | null
          country?: string | null
          courses?: string[] | null
          created_at?: string
          email?: string | null
          established_year?: number | null
          institute_code?: string | null
          institute_name: string
          logo_path?: string | null
          phone_number?: string | null
          pincode?: string | null
          principal_email?: string | null
          principal_name?: string | null
          principal_phone?: string | null
          profile_complete?: boolean | null
          profile_id: string
          profile_updated?: boolean
          social_links?: string[] | null
          state?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          affiliation?: string | null
          city?: string | null
          country?: string | null
          courses?: string[] | null
          created_at?: string
          email?: string | null
          established_year?: number | null
          institute_code?: string | null
          institute_name?: string
          logo_path?: string | null
          phone_number?: string | null
          pincode?: string | null
          principal_email?: string | null
          principal_name?: string | null
          principal_phone?: string | null
          profile_complete?: boolean | null
          profile_id?: string
          profile_updated?: boolean
          social_links?: string[] | null
          state?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institute_profiles_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      options: {
        Row: {
          id: string
          is_correct: boolean
          media_url: string | null
          option_text: string
          order_index: number
          question_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          media_url?: string | null
          option_text: string
          order_index: number
          question_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          media_url?: string | null
          option_text?: string
          order_index?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "options_question_id_fkey"
            columns: ["question_id"]
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "options_question_id_fkey"
            columns: ["question_id"]
            referencedRelation: "view_question_analysis"
            referencedColumns: ["question_id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_subtype: string | null
          account_type: string
          avatar_path: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_active: boolean
          updated_at: string
          username: string | null
        }
        Insert: {
          account_subtype?: string | null
          account_type?: string
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          is_active?: boolean
          updated_at?: string
          username?: string | null
        }
        Update: {
          account_subtype?: string | null
          account_type?: string
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      question_tags: {
        Row: {
          question_id: string
          tag_id: string
        }
        Insert: {
          question_id: string
          tag_id: string
        }
        Update: {
          question_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_tags_question_id_fkey"
            columns: ["question_id"]
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_tags_question_id_fkey"
            columns: ["question_id"]
            referencedRelation: "view_question_analysis"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "question_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "tag_performance"
            referencedColumns: ["tag_id"]
          },
          {
            foreignKeyName: "question_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          marks: number
          media_url: string | null
          negative_marks: number
          order_index: number
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          test_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          marks?: number
          media_url?: string | null
          negative_marks?: number
          order_index: number
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          test_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          marks?: number
          media_url?: string | null
          negative_marks?: number
          order_index?: number
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          test_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_test_id_fkey"
            columns: ["test_id"]
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_test_id_fkey"
            columns: ["test_id"]
            referencedRelation: "view_test_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      test_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          expires_at: string | null
          id: string
          ip_address: unknown
          passed: boolean | null
          percentage: number | null
          score: number | null
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          student_id: string
          submitted_at: string | null
          tab_switch_count: number
          test_id: string
          time_spent_seconds: number | null
          total_marks: number | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          passed?: boolean | null
          percentage?: number | null
          score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          student_id: string
          submitted_at?: string | null
          tab_switch_count?: number
          test_id: string
          time_spent_seconds?: number | null
          total_marks?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          attempt_number?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          passed?: boolean | null
          percentage?: number | null
          score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          student_id?: string
          submitted_at?: string | null
          tab_switch_count?: number
          test_id?: string
          time_spent_seconds?: number | null
          total_marks?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            referencedRelation: "view_test_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          available_from: string | null
          available_until: string | null
          created_at: string
          description: string | null
          id: string
          institute_id: string
          instructions: string | null
          max_attempts: number
          pass_percentage: number | null
          results_available: boolean
          shuffle_options: boolean
          shuffle_questions: boolean
          status: Database["public"]["Enums"]["test_status"]
          strict_mode: boolean
          time_limit_seconds: number | null
          title: string
          updated_at: string
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          created_at?: string
          description?: string | null
          id?: string
          institute_id: string
          instructions?: string | null
          max_attempts?: number
          pass_percentage?: number | null
          results_available?: boolean
          shuffle_options?: boolean
          shuffle_questions?: boolean
          status?: Database["public"]["Enums"]["test_status"]
          strict_mode?: boolean
          time_limit_seconds?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          created_at?: string
          description?: string | null
          id?: string
          institute_id?: string
          instructions?: string | null
          max_attempts?: number
          pass_percentage?: number | null
          results_available?: boolean
          shuffle_options?: boolean
          shuffle_questions?: boolean
          status?: Database["public"]["Enums"]["test_status"]
          strict_mode?: boolean
          time_limit_seconds?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_institute_id_fkey"
            columns: ["institute_id"]
            referencedRelation: "institute_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          id: string
          ip: unknown
          not_after: string | null
          tag: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id: string
          ip?: unknown
          not_after?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip?: unknown
          not_after?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      attempt_details: {
        Row: {
          attempt_number: number | null
          id: string | null
          passed: boolean | null
          percentage: number | null
          score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["attempt_status"] | null
          student_email: string | null
          student_id: string | null
          student_name: string | null
          submitted_at: string | null
          tab_switch_count: number | null
          test_id: string | null
          time_spent_seconds: number | null
          total_marks: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            referencedRelation: "view_test_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_performance: {
        Row: {
          accuracy_pct: number | null
          correct_count: number | null
          student_id: string | null
          tag_id: string | null
          tag_name: string | null
          test_id: string | null
          total_questions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            referencedRelation: "view_test_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      view_question_analysis: {
        Row: {
          avg_time_spent: number | null
          correct_answers: number | null
          marks: number | null
          question_id: string | null
          question_text: string | null
          success_rate_pct: number | null
          test_id: string | null
          total_answers: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_test_id_fkey"
            columns: ["test_id"]
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_test_id_fkey"
            columns: ["test_id"]
            referencedRelation: "view_test_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      view_test_results_detailed: {
        Row: {
          attempt_id: string | null
          attempt_number: number | null
          branch: string | null
          passed: boolean | null
          passout_year: number | null
          percentage: number | null
          score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["attempt_status"] | null
          student_email: string | null
          student_id: string | null
          student_name: string | null
          submitted_at: string | null
          tab_switch_count: number | null
          test_id: string | null
          time_spent_seconds: number | null
          total_marks: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            referencedRelation: "view_test_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      view_test_summary: {
        Row: {
          available_from: string | null
          available_until: string | null
          avg_score_pct: number | null
          description: string | null
          id: string | null
          institute_id: string | null
          institute_name: string | null
          question_count: number | null
          results_available: boolean | null
          status: Database["public"]["Enums"]["test_status"] | null
          submitted_attempts: number | null
          time_limit_seconds: number | null
          title: string | null
          total_attempts: number | null
          total_marks: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tests_institute_id_fkey"
            columns: ["institute_id"]
            referencedRelation: "institute_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
    }
    Functions: {
      check_username_available: {
        Args: { p_user_id: string; p_username: string }
        Returns: boolean
      }
      grade_attempt: { Args: { p_attempt_id: string }; Returns: undefined }
      revoke_session: { Args: { p_session_id: string }; Returns: undefined }
      revoke_sessions_batch: {
        Args: { p_session_ids: string[] }
        Returns: undefined
      }
      save_answer: {
        Args: {
          p_attempt_id: string
          p_question_id: string
          p_selected_option_ids: string[]
          p_time_spent_seconds?: number
        }
        Returns: undefined
      }
      save_test_v2: {
        Args: {
          p_questions: Json[]
          p_settings: Json
          p_status: string
          p_test_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      attempt_status:
        | "in_progress"
        | "submitted"
        | "abandoned"
        | "auto_submitted"
      question_type: "single_correct" | "multiple_correct" | "true_false"
      test_status: "draft" | "published" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
