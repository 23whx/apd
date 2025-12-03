// Database types based on project documentation
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
      users: {
        Row: {
          id: string
          email: string
          username: string
          display_name: string | null
          avatar_id: number
          role: 'user' | 'mod' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          display_name?: string | null
          avatar_id?: number
          role?: 'user' | 'mod' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          display_name?: string | null
          avatar_id?: number
          role?: 'user' | 'mod' | 'admin'
          created_at?: string
        }
      }
      works: {
        Row: {
          id: string
          name_cn: string
          name_en: string | null
          name_jp: string | null
          alias: Json | null
          type: 'anime' | 'manga' | 'game' | 'novel'
          summary_md: string | null
          source_urls: Json | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name_cn: string
          name_en?: string | null
          name_jp?: string | null
          alias?: Json | null
          type: 'anime' | 'manga' | 'game' | 'novel'
          summary_md?: string | null
          source_urls?: Json | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name_cn?: string
          name_en?: string | null
          name_jp?: string | null
          alias?: Json | null
          type?: 'anime' | 'manga' | 'game' | 'novel'
          summary_md?: string | null
          source_urls?: Json | null
          created_by?: string
          created_at?: string
        }
      }
      characters: {
        Row: {
          id: string
          work_id: string
          name_cn: string
          name_en: string | null
          name_jp: string | null
          avatar_url: string | null
          source_link: string | null
          summary_md: string | null
          sources: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          work_id: string
          name_cn: string
          name_en?: string | null
          name_jp?: string | null
          avatar_url?: string | null
          source_link?: string | null
          summary_md?: string | null
          sources?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          work_id?: string
          name_cn?: string
          name_en?: string | null
          name_jp?: string | null
          avatar_url?: string | null
          source_link?: string | null
          summary_md?: string | null
          sources?: Json | null
          created_at?: string
        }
      }
      personality_votes: {
        Row: {
          id: string
          character_id: string
          user_id: string
          mbti: string | null
          enneagram: string | null
          subtype: string | null
          yi_hexagram: string | null
          created_at: string
        }
        Insert: {
          id?: string
          character_id: string
          user_id: string
          mbti?: string | null
          enneagram?: string | null
          subtype?: string | null
          yi_hexagram?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          character_id?: string
          user_id?: string
          mbti?: string | null
          enneagram?: string | null
          subtype?: string | null
          yi_hexagram?: string | null
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          target_type: 'work' | 'character' | 'poll'
          target_id: string
          user_id: string
          content_md: string
          parent_comment_id: string | null
          created_at: string
          is_deleted: boolean
          flagged: boolean
        }
        Insert: {
          id?: string
          target_type: 'work' | 'character' | 'poll'
          target_id: string
          user_id: string
          content_md: string
          parent_comment_id?: string | null
          created_at?: string
          is_deleted?: boolean
          flagged?: boolean
        }
        Update: {
          id?: string
          target_type?: 'work' | 'character' | 'poll'
          target_id?: string
          user_id?: string
          content_md?: string
          parent_comment_id?: string | null
          created_at?: string
          is_deleted?: boolean
          flagged?: boolean
        }
      }
      source_snapshots: {
        Row: {
          id: string
          url: string
          fetched_at: string
          fetched_by: string | null
          raw_md: string
          raw_html: string | null
          license_info: string | null
        }
        Insert: {
          id?: string
          url: string
          fetched_at?: string
          fetched_by?: string | null
          raw_md: string
          raw_html?: string | null
          license_info?: string | null
        }
        Update: {
          id?: string
          url?: string
          fetched_at?: string
          fetched_by?: string | null
          raw_md?: string
          raw_html?: string | null
          license_info?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      work_type: 'anime' | 'manga' | 'game' | 'novel'
      user_role: 'user' | 'mod' | 'admin'
      target_type: 'work' | 'character' | 'poll'
    }
  }
}

