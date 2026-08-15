/**
 * Supabase Database type scaffold.
 * Contains type definitions for Supabase tables used in Academia X.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: string;
          created_at: string;
          updated_at: string;
          teacher_id?: string | null;
          phone?: string | null;
          address?: string | null;
          roll_id?: string | null;
          roll_number?: string | null;
          enrollment_date?: string | null;
          father_name?: string | null;
          batch?: string | null;
          timing?: string | null;
        };
        Insert: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
          teacher_id?: string | null;
          phone?: string | null;
          address?: string | null;
          roll_id?: string | null;
          roll_number?: string | null;
          enrollment_date?: string | null;
          father_name?: string | null;
          batch?: string | null;
          timing?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
          teacher_id?: string | null;
          phone?: string | null;
          address?: string | null;
          roll_id?: string | null;
          roll_number?: string | null;
          enrollment_date?: string | null;
          father_name?: string | null;
          batch?: string | null;
          timing?: string | null;
        };
        Relationships: any[];
      };
      courses: {
        Row: {
          id: string;
          title: string;
          code?: string | null;
          description?: string | null;
          duration?: string | null;
          status?: string | null;
          teacher_id: string;
          created_by?: string | null;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          title?: string;
          code?: string | null;
          description?: string | null;
          duration?: string | null;
          status?: string | null;
          teacher_id?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          code?: string | null;
          description?: string | null;
          duration?: string | null;
          status?: string | null;
          teacher_id?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: any[];
      };
      enrollments: {
        Row: {
          id: string;
          course_id: string;
          student_id: string;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          course_id?: string;
          student_id?: string;
          enrolled_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          student_id?: string;
          enrolled_at?: string;
        };
        Relationships: any[];
      };
      assignments: {
        Row: {
          id: string;
          course_id: string;
          batch_id?: string | null;
          teacher_id?: string | null;
          created_by?: string | null;
          title: string;
          description?: string | null;
          due_date?: string | null;
          max_score: number;
          total_marks?: number;
          file_url?: string | null;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          course_id?: string;
          batch_id?: string | null;
          teacher_id?: string | null;
          created_by?: string | null;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          max_score?: number;
          total_marks?: number;
          file_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          batch_id?: string | null;
          teacher_id?: string | null;
          created_by?: string | null;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          max_score?: number;
          total_marks?: number;
          file_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: any[];
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          content?: string | null;
          file_url?: string | null;
          notes?: string | null;
          score?: number | null;
          obtained_marks?: number | null;
          feedback?: string | null;
          status?: string | null;
          submitted_at?: string;
          graded_at?: string | null;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          assignment_id?: string;
          student_id?: string;
          content?: string | null;
          file_url?: string | null;
          notes?: string | null;
          score?: number | null;
          obtained_marks?: number | null;
          feedback?: string | null;
          status?: string | null;
          submitted_at?: string;
          graded_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          student_id?: string;
          content?: string | null;
          file_url?: string | null;
          notes?: string | null;
          score?: number | null;
          obtained_marks?: number | null;
          feedback?: string | null;
          status?: string | null;
          submitted_at?: string;
          graded_at?: string | null;
          updated_at?: string;
        };
        Relationships: any[];
      };
      attendance: {
        Row: {
          id: string;
          course_id: string;
          student_id: string;
          date: string;
          status: string;
          notes?: string | null;
          marked_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          course_id?: string;
          student_id?: string;
          date?: string;
          status?: string;
          notes?: string | null;
          marked_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          student_id?: string;
          date?: string;
          status?: string;
          notes?: string | null;
          marked_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: any[];
      };
      batches: {
        Row: {
          id: string;
          name: string;
          code?: string | null;
          course_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          name?: string;
          code?: string | null;
          course_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string | null;
          course_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: any[];
      };
      activity_logs: {
        Row: {
          id: string;
          user_id?: string | null;
          action?: string | null;
          entity_type?: string | null;
          details?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action?: string | null;
          entity_type?: string | null;
          details?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string | null;
          entity_type?: string | null;
          details?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: any[];
      };
      announcements: {
        Row: {
          id: string;
          title?: string | null;
          content?: string | null;
          code?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Insert: {
          id?: string;
          title?: string | null;
          content?: string | null;
          code?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string | null;
          content?: string | null;
          code?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: any[];
      };
    };
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: {
      user_role: 'super_admin' | 'admin' | 'teacher' | 'student';
      attendance_status: 'present' | 'absent' | 'late' | 'excused';
    };
  };
}
