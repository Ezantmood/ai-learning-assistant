// Database types cho AI Learning Assistant.
// Sinh bằng CLI từ schema Supabase remote (2026-09-17):
//   supabase gen types typescript --db-url "$SUPABASE_DB_URL" > src/types/database.ts
// ($SUPABASE_DB_URL lấy từ .env.local, session pooler; không commit secret.)
// Không sửa phần sinh tự động; alias tiện ích của project nằm ở cuối file.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          full_name: string
          id: string
          student_code: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string
          id: string
          student_code: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string
          id?: string
          student_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          display_name: string
          extracted_text: string | null
          extraction_status: string
          file_ext: string
          file_size: number
          id: string
          mime_type: string
          storage_path: string
          subject_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          extracted_text?: string | null
          extraction_status?: string
          file_ext: string
          file_size: number
          id?: string
          mime_type: string
          storage_path: string
          subject_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          extracted_text?: string | null
          extraction_status?: string
          file_ext?: string
          file_size?: number
          id?: string
          mime_type?: string
          storage_path?: string
          subject_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'documents_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
        ]
      }
      document_summaries: {
        Row: {
          created_at: string
          document_id: string
          id: string
          model: string
          summary_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          model?: string
          summary_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          model?: string
          summary_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'document_summaries_document_id_fkey'
            columns: ['document_id']
            isOneToOne: true
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
        ]
      }
      document_questions: {
        Row: {
          answer: string
          created_at: string
          document_id: string
          id: string
          model: string
          question: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          document_id: string
          id?: string
          model?: string
          question: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          document_id?: string
          id?: string
          model?: string
          question?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'document_questions_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
        ]
      }
      document_solutions: {
        Row: {
          created_at: string
          document_id: string
          id: string
          model: string
          solution_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          model?: string
          solution_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          model?: string
          solution_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'document_solutions_document_id_fkey'
            columns: ['document_id']
            isOneToOne: true
            referencedRelation: 'documents'
            referencedColumns: ['id']
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
    Enums: {},
  },
} as const

// Alias tiện ích của project (giữ từ bản mirror G2 để code feature ngắn gọn).
// Hai bảng CN2 (`subjects`, `documents`) đồng bộ tay theo
// `supabase/migrations/0002_cn2_documents.sql` (chờ regen bằng CLI).
// Bảng CN3 (`document_summaries`) đồng bộ tay theo
// `supabase/migrations/0004_cn3_summaries.sql` (chờ regen bằng CLI).
// Bảng CN4 (`document_questions`) đồng bộ tay theo
// `supabase/migrations/0005_cn4_questions.sql` (chờ regen bằng CLI).
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type StudyNoteRow = Database['public']['Tables']['study_notes']['Row'];
export type StudyNoteInsert =
  Database['public']['Tables']['study_notes']['Insert'];
export type StudyNoteUpdate =
  Database['public']['Tables']['study_notes']['Update'];
export type SubjectRow = Database['public']['Tables']['subjects']['Row'];
export type SubjectInsert =
  Database['public']['Tables']['subjects']['Insert'];
export type SubjectUpdate =
  Database['public']['Tables']['subjects']['Update'];
export type DocumentRow = Database['public']['Tables']['documents']['Row'];
export type DocumentInsert =
  Database['public']['Tables']['documents']['Insert'];
export type DocumentUpdate =
  Database['public']['Tables']['documents']['Update'];
export type DocumentSummaryRow =
  Database['public']['Tables']['document_summaries']['Row'];
export type DocumentSummaryInsert =
  Database['public']['Tables']['document_summaries']['Insert'];
export type DocumentSummaryUpdate =
  Database['public']['Tables']['document_summaries']['Update'];
export type DocumentQuestionRow =
  Database['public']['Tables']['document_questions']['Row'];
export type DocumentQuestionInsert =
  Database['public']['Tables']['document_questions']['Insert'];
export type DocumentQuestionUpdate =
  Database['public']['Tables']['document_questions']['Update'];
export type DocumentSolutionRow =
  Database['public']['Tables']['document_solutions']['Row'];
export type DocumentSolutionInsert =
  Database['public']['Tables']['document_solutions']['Insert'];
export type DocumentSolutionUpdate =
  Database['public']['Tables']['document_solutions']['Update'];
