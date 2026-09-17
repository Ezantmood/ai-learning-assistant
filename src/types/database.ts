// Database types cho Student Account Manager (G2).
// Mirror thủ công từ supabase/migrations/0001_account_manager.sql.
// Sau khi apply migration lên Supabase project, regen bằng CLI và thay file này:
//   npx supabase gen types typescript --project-id <ref> --schema public > src/types/database.ts
// Không sửa tay sau khi đã regen bằng CLI.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_path: string | null;
          created_at: string;
          full_name: string;
          id: string;
          student_code: string;
          updated_at: string;
        };
        Insert: {
          avatar_path?: string | null;
          created_at?: string;
          full_name?: string;
          id: string;
          student_code: string;
          updated_at?: string;
        };
        Update: {
          avatar_path?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          student_code?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      study_notes: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content?: string;
          created_at?: string;
          id?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type StudyNoteRow = Database['public']['Tables']['study_notes']['Row'];
export type StudyNoteInsert =
  Database['public']['Tables']['study_notes']['Insert'];
export type StudyNoteUpdate =
  Database['public']['Tables']['study_notes']['Update'];
