export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      announcements: {
        Row: {
          id: string
          title: string
          message: string
          created_at: string
          created_by?: string
          priority?: boolean
        }
        Insert: {
          id?: string
          title: string
          message: string
          created_at?: string
          created_by?: string
          priority?: boolean
        }
        Update: {
          id?: string
          title?: string
          message?: string
          created_at?: string
          created_by?: string
          priority?: boolean
        }
      }
      clubs: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          imageUrl: string
          created_at: string
          created_by?: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          category: string
          imageUrl: string
          created_at?: string
          created_by?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          imageUrl?: string
          created_at?: string
          created_by?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          date: string
          location: string
          imageUrl: string
          created_at: string
          created_by?: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          date: string
          location: string
          imageUrl: string
          created_at?: string
          created_by?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          date?: string
          location?: string
          imageUrl?: string
          created_at?: string
          created_by?: string
        }
      }
    }
  }
} 