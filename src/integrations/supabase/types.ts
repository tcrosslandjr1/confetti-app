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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          description: string
          icon: string
          id: string
          title: string
          xp_reward: number
        }
        Insert: {
          code: string
          description: string
          icon?: string
          id?: string
          title: string
          xp_reward?: number
        }
        Update: {
          code?: string
          description?: string
          icon?: string
          id?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      itineraries: {
        Row: {
          city: string | null
          completed_at: string | null
          created_at: string
          date: string | null
          est_total_cost: string | null
          id: string
          occasion_slug: string | null
          overall_rating: number | null
          overall_review: string | null
          source: string
          start_time: string | null
          summary: string | null
          title: string
          transport_mode: string | null
          updated_at: string
          user_id: string
          vibe: string | null
        }
        Insert: {
          city?: string | null
          completed_at?: string | null
          created_at?: string
          date?: string | null
          est_total_cost?: string | null
          id?: string
          occasion_slug?: string | null
          overall_rating?: number | null
          overall_review?: string | null
          source?: string
          start_time?: string | null
          summary?: string | null
          title: string
          transport_mode?: string | null
          updated_at?: string
          user_id: string
          vibe?: string | null
        }
        Update: {
          city?: string | null
          completed_at?: string | null
          created_at?: string
          date?: string | null
          est_total_cost?: string | null
          id?: string
          occasion_slug?: string | null
          overall_rating?: number | null
          overall_review?: string | null
          source?: string
          start_time?: string | null
          summary?: string | null
          title?: string
          transport_mode?: string | null
          updated_at?: string
          user_id?: string
          vibe?: string | null
        }
        Relationships: []
      }
      itinerary_stops: {
        Row: {
          address: string | null
          booking_provider: string | null
          booking_ref: string | null
          booking_status: string
          booking_url: string | null
          category: string | null
          completed_at: string | null
          confirmation_note: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          est_cost: string | null
          id: string
          itinerary_id: string
          name: string
          parking: Json | null
          party_size: number | null
          position: number
          reservation_time: string | null
          review_snippets: Json | null
          start_time: string | null
          tips: Json | null
          travel_from_prev: Json | null
          user_notes: string | null
          user_rating: number | null
          user_review: string | null
          what_to_do: string | null
        }
        Insert: {
          address?: string | null
          booking_provider?: string | null
          booking_ref?: string | null
          booking_status?: string
          booking_url?: string | null
          category?: string | null
          completed_at?: string | null
          confirmation_note?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          est_cost?: string | null
          id?: string
          itinerary_id: string
          name: string
          parking?: Json | null
          party_size?: number | null
          position: number
          reservation_time?: string | null
          review_snippets?: Json | null
          start_time?: string | null
          tips?: Json | null
          travel_from_prev?: Json | null
          user_notes?: string | null
          user_rating?: number | null
          user_review?: string | null
          what_to_do?: string | null
        }
        Update: {
          address?: string | null
          booking_provider?: string | null
          booking_ref?: string | null
          booking_status?: string
          booking_url?: string | null
          category?: string | null
          completed_at?: string | null
          confirmation_note?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          est_cost?: string | null
          id?: string
          itinerary_id?: string
          name?: string
          parking?: Json | null
          party_size?: number | null
          position?: number
          reservation_time?: string | null
          review_snippets?: Json | null
          start_time?: string | null
          tips?: Json | null
          travel_from_prev?: Json | null
          user_notes?: string | null
          user_rating?: number | null
          user_review?: string | null
          what_to_do?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_stops_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          level: number
          onboarding_complete: boolean
          updated_at: string
          xp: number
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          level?: number
          onboarding_complete?: boolean
          updated_at?: string
          xp?: number
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          level?: number
          onboarding_complete?: boolean
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          about_me: string | null
          activities: string[]
          budget_max: number
          budget_min: number
          cuisines: string[]
          taste_profile: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          about_me?: string | null
          activities?: string[]
          budget_max?: number
          budget_min?: number
          cuisines?: string[]
          taste_profile?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          about_me?: string | null
          activities?: string[]
          budget_max?: number
          budget_min?: number
          cuisines?: string[]
          taste_profile?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          category: string
          city: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          neighborhood: string | null
          price_level: number
        }
        Insert: {
          category: string
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          neighborhood?: string | null
          price_level?: number
        }
        Update: {
          category?: string
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          neighborhood?: string | null
          price_level?: number
        }
        Relationships: []
      }
      visits: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          user_id: string
          venue_id: string | null
          venue_name: string
          visited_at: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          user_id: string
          venue_id?: string | null
          venue_name: string
          visited_at?: string
          xp_earned?: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string
          venue_id?: string | null
          venue_name?: string
          visited_at?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "visits_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "admin" | "customer"
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
      app_role: ["admin", "customer"],
    },
  },
} as const
