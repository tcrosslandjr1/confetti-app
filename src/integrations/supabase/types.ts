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
      ad_campaigns: {
        Row: {
          admin_note: string | null
          advertiser_id: string
          blurb: string | null
          category: string | null
          city: string | null
          created_at: string
          cta_label: string | null
          cta_url: string | null
          headline: string
          id: string
          image_url: string | null
          package_tier: string
          placement: string
          runs_from: string | null
          runs_until: string | null
          status: string
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          admin_note?: string | null
          advertiser_id: string
          blurb?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          headline: string
          id?: string
          image_url?: string | null
          package_tier?: string
          placement?: string
          runs_from?: string | null
          runs_until?: string | null
          status?: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          admin_note?: string | null
          advertiser_id?: string
          blurb?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          headline?: string
          id?: string
          image_url?: string | null
          package_tier?: string
          placement?: string
          runs_from?: string | null
          runs_until?: string | null
          status?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_events: {
        Row: {
          brand: string | null
          campaign_id: string | null
          created_at: string
          href: string | null
          id: string
          kind: string
          occasion: string | null
          surface: string | null
          user_id: string | null
        }
        Insert: {
          brand?: string | null
          campaign_id?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind: string
          occasion?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Update: {
          brand?: string | null
          campaign_id?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind?: string
          occasion?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      advertiser_confetti_balances: {
        Row: {
          advertiser_id: string
          balance_credits: number
          created_at: string
          lifetime_granted_credits: number
          lifetime_purchased_credits: number
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          balance_credits?: number
          created_at?: string
          lifetime_granted_credits?: number
          lifetime_purchased_credits?: number
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          balance_credits?: number
          created_at?: string
          lifetime_granted_credits?: number
          lifetime_purchased_credits?: number
          updated_at?: string
        }
        Relationships: []
      }
      advertiser_subscriptions: {
        Row: {
          advertiser_id: string
          created_at: string
          current_period_end: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stub: boolean
          tier: string
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stub?: boolean
          tier?: string
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stub?: boolean
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      advertisers: {
        Row: {
          business_name: string
          category: string | null
          city: string | null
          contact_email: string
          contact_phone: string | null
          created_at: string
          id: string
          notes: string | null
          owner_id: string
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          business_name: string
          category?: string | null
          city?: string | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          owner_id: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          business_name?: string
          category?: string | null
          city?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          event_type: string
          id: string
          metadata: Json
          path: string
          session_id: string
          user_agent: string | null
          user_id: string | null
          value: number | null
        }
        Insert: {
          created_at?: string
          event_name: string
          event_type: string
          id?: string
          metadata?: Json
          path: string
          session_id: string
          user_agent?: string | null
          user_id?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_type?: string
          id?: string
          metadata?: Json
          path?: string
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
          value?: number | null
        }
        Relationships: []
      }
      booking_notification_deliveries: {
        Row: {
          body: string | null
          booking_id: string | null
          channel: string
          created_at: string
          error: string | null
          id: string
          recipient_email: string | null
          source: string
          status: string
          subject: string | null
          test: boolean
          updated_at: string
          venue_id: string | null
          venue_name: string | null
        }
        Insert: {
          body?: string | null
          booking_id?: string | null
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          recipient_email?: string | null
          source?: string
          status?: string
          subject?: string | null
          test?: boolean
          updated_at?: string
          venue_id?: string | null
          venue_name?: string | null
        }
        Update: {
          body?: string | null
          booking_id?: string | null
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          recipient_email?: string | null
          source?: string
          status?: string
          subject?: string | null
          test?: boolean
          updated_at?: string
          venue_id?: string | null
          venue_name?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          admin_notes: string | null
          cancelled_at: string | null
          created_at: string
          id: string
          notes: string | null
          party_size: number
          pre_order_drinks: Json
          seating_preference: string | null
          starts_at: string
          status: string
          stripe_session_id: string | null
          total_cents: number
          updated_at: string
          user_id: string
          venue_id: string | null
          venue_name: string
        }
        Insert: {
          admin_notes?: string | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          party_size?: number
          pre_order_drinks?: Json
          seating_preference?: string | null
          starts_at: string
          status?: string
          stripe_session_id?: string | null
          total_cents?: number
          updated_at?: string
          user_id: string
          venue_id?: string | null
          venue_name: string
        }
        Update: {
          admin_notes?: string | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          party_size?: number
          pre_order_drinks?: Json
          seating_preference?: string | null
          starts_at?: string
          status?: string
          stripe_session_id?: string | null
          total_cents?: number
          updated_at?: string
          user_id?: string
          venue_id?: string | null
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      confetti_grants: {
        Row: {
          advertiser_id: string | null
          booking_id: string | null
          created_at: string
          credits: number
          id: string
          reason: string
          user_id: string
          venue_name: string | null
        }
        Insert: {
          advertiser_id?: string | null
          booking_id?: string | null
          created_at?: string
          credits: number
          id?: string
          reason?: string
          user_id: string
          venue_name?: string | null
        }
        Update: {
          advertiser_id?: string | null
          booking_id?: string | null
          created_at?: string
          credits?: number
          id?: string
          reason?: string
          user_id?: string
          venue_name?: string | null
        }
        Relationships: []
      }
      confetti_purchases: {
        Row: {
          advertiser_id: string
          amount_cents: number
          created_at: string
          credits: number
          id: string
          package_key: string
          status: string
        }
        Insert: {
          advertiser_id: string
          amount_cents: number
          created_at?: string
          credits: number
          id?: string
          package_key: string
          status?: string
        }
        Update: {
          advertiser_id?: string
          amount_cents?: number
          created_at?: string
          credits?: number
          id?: string
          package_key?: string
          status?: string
        }
        Relationships: []
      }
      confetti_redemptions: {
        Row: {
          advertiser_id: string | null
          created_at: string
          credits: number
          id: string
          redeem_code: string
          redeemed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          advertiser_id?: string | null
          created_at?: string
          credits: number
          id?: string
          redeem_code: string
          redeemed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          advertiser_id?: string | null
          created_at?: string
          credits?: number
          id?: string
          redeem_code?: string
          redeemed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      corporate_attendees: {
        Row: {
          created_at: string
          dietary: string | null
          email: string
          event_id: string
          id: string
          name: string | null
          responded_at: string | null
          role: string
          rsvp_status: string
          rsvp_token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dietary?: string | null
          email: string
          event_id: string
          id?: string
          name?: string | null
          responded_at?: string | null
          role?: string
          rsvp_status?: string
          rsvp_token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dietary?: string | null
          email?: string
          event_id?: string
          id?: string
          name?: string | null
          responded_at?: string | null
          role?: string
          rsvp_status?: string
          rsvp_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "corporate_events"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_events: {
        Row: {
          budget_per_person_cents: number
          created_at: string
          ends_at: string | null
          headcount: number
          id: string
          itinerary_id: string | null
          notes: string | null
          org_name: string
          owner_id: string
          purpose: string
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget_per_person_cents?: number
          created_at?: string
          ends_at?: string | null
          headcount?: number
          id?: string
          itinerary_id?: string | null
          notes?: string | null
          org_name: string
          owner_id: string
          purpose?: string
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget_per_person_cents?: number
          created_at?: string
          ends_at?: string | null
          headcount?: number
          id?: string
          itinerary_id?: string | null
          notes?: string | null
          org_name?: string
          owner_id?: string
          purpose?: string
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorite_stops: {
        Row: {
          address: string | null
          created_at: string
          id: string
          neighborhood: string | null
          notes: string | null
          tone: string | null
          user_id: string
          venue_name: string
          vibe: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          neighborhood?: string | null
          notes?: string | null
          tone?: string | null
          user_id: string
          venue_name: string
          vibe?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          neighborhood?: string | null
          notes?: string | null
          tone?: string | null
          user_id?: string
          venue_name?: string
          vibe?: string | null
        }
        Relationships: []
      }
      featured_content: {
        Row: {
          active: boolean
          collection_slug: string | null
          created_at: string
          id: string
          kind: string
          position: number
          subtitle: string | null
          title: string | null
          venue_id: string | null
        }
        Insert: {
          active?: boolean
          collection_slug?: string | null
          created_at?: string
          id?: string
          kind?: string
          position?: number
          subtitle?: string | null
          title?: string | null
          venue_id?: string | null
        }
        Update: {
          active?: boolean
          collection_slug?: string | null
          created_at?: string
          id?: string
          kind?: string
          position?: number
          subtitle?: string | null
          title?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_content_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_oauth_states: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          redirect_to: string | null
          state: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          redirect_to?: string | null
          state: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          redirect_to?: string | null
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      itineraries: {
        Row: {
          city: string | null
          completed_at: string | null
          created_at: string
          date: string | null
          day_count: number
          end_date: string | null
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
          trip_type: string
          updated_at: string
          user_id: string
          vibe: string | null
        }
        Insert: {
          city?: string | null
          completed_at?: string | null
          created_at?: string
          date?: string | null
          day_count?: number
          end_date?: string | null
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
          trip_type?: string
          updated_at?: string
          user_id: string
          vibe?: string | null
        }
        Update: {
          city?: string | null
          completed_at?: string | null
          created_at?: string
          date?: string | null
          day_count?: number
          end_date?: string | null
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
          trip_type?: string
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
          day_index: number
          description: string | null
          dress_code: string | null
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
          stop_date: string | null
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
          day_index?: number
          description?: string | null
          dress_code?: string | null
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
          stop_date?: string | null
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
          day_index?: number
          description?: string | null
          dress_code?: string | null
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
          stop_date?: string | null
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
      linked_social_accounts: {
        Row: {
          access_token: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          expires_at: string | null
          id: string
          provider: string
          provider_user_id: string
          raw: Json | null
          refresh_token: string | null
          scope: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          access_token?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          expires_at?: string | null
          id?: string
          provider: string
          provider_user_id: string
          raw?: Json | null
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          access_token?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          expires_at?: string | null
          id?: string
          provider?: string
          provider_user_id?: string
          raw?: Json | null
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      marquee_sponsorships: {
        Row: {
          active: boolean
          brand: string
          created_at: string
          cta_label: string
          cta_url: string
          id: string
          notes: string | null
          occasion: string
          position: number
          runs_from: string | null
          runs_until: string | null
          surface: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          brand: string
          created_at?: string
          cta_label?: string
          cta_url: string
          id?: string
          notes?: string | null
          occasion: string
          position?: number
          runs_from?: string | null
          runs_until?: string | null
          surface?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          brand?: string
          created_at?: string
          cta_label?: string
          cta_url?: string
          id?: string
          notes?: string | null
          occasion?: string
          position?: number
          runs_from?: string | null
          runs_until?: string | null
          surface?: string
          updated_at?: string
        }
        Relationships: []
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
      notifications: {
        Row: {
          body: string | null
          booking_id: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
          venue_id: string | null
        }
        Insert: {
          body?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
          venue_id?: string | null
        }
        Update: {
          body?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
          venue_id?: string | null
        }
        Relationships: []
      }
      oauth_credential_submissions: {
        Row: {
          callback_url: string
          client_id: string
          client_secret: string
          created_at: string
          id: string
          notes: string | null
          provider: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["oauth_submission_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          callback_url: string
          client_id: string
          client_secret: string
          created_at?: string
          id?: string
          notes?: string | null
          provider: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["oauth_submission_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          callback_url?: string
          client_id?: string
          client_secret?: string
          created_at?: string
          id?: string
          notes?: string | null
          provider?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["oauth_submission_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      outreach_snapshots: {
        Row: {
          csv: string
          generated_at: string
          id: string
          source: string
          venue_count: number
          window_days: number
        }
        Insert: {
          csv: string
          generated_at?: string
          id?: string
          source?: string
          venue_count: number
          window_days: number
        }
        Update: {
          csv?: string
          generated_at?: string
          id?: string
          source?: string
          venue_count?: number
          window_days?: number
        }
        Relationships: []
      }
      pick_events: {
        Row: {
          client_at: string | null
          context: string | null
          created_at: string
          id: string
          meta: Json
          name: string
          pick_id: string
          session_id: string | null
          signals: string[]
          user_id: string | null
        }
        Insert: {
          client_at?: string | null
          context?: string | null
          created_at?: string
          id?: string
          meta?: Json
          name: string
          pick_id: string
          session_id?: string | null
          signals?: string[]
          user_id?: string | null
        }
        Update: {
          client_at?: string | null
          context?: string | null
          created_at?: string
          id?: string
          meta?: Json
          name?: string
          pick_id?: string
          session_id?: string | null
          signals?: string[]
          user_id?: string | null
        }
        Relationships: []
      }
      pick_signals: {
        Row: {
          context: Json
          created_at: string
          id: string
          kind: string
          user_id: string
          value: string
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: string
          kind: string
          user_id: string
          value: string
        }
        Update: {
          context?: Json
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      places_match_audit: {
        Row: {
          business_status: string | null
          city: string | null
          created_at: string
          id: string
          matched_name: string | null
          meta: Json
          place_id: string | null
          query: string | null
          rating: number | null
          requested_name: string | null
          score: number | null
          source: string
          status: string
          user_id: string | null
          user_rating_count: number | null
        }
        Insert: {
          business_status?: string | null
          city?: string | null
          created_at?: string
          id?: string
          matched_name?: string | null
          meta?: Json
          place_id?: string | null
          query?: string | null
          rating?: number | null
          requested_name?: string | null
          score?: number | null
          source: string
          status: string
          user_id?: string | null
          user_rating_count?: number | null
        }
        Update: {
          business_status?: string | null
          city?: string | null
          created_at?: string
          id?: string
          matched_name?: string | null
          meta?: Json
          place_id?: string | null
          query?: string | null
          rating?: number | null
          requested_name?: string | null
          score?: number | null
          source?: string
          status?: string
          user_id?: string | null
          user_rating_count?: number | null
        }
        Relationships: []
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
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          issued_at: string | null
          redeem_code: string | null
          redeemed_at: string | null
          referral_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          id?: string
          issued_at?: string | null
          redeem_code?: string | null
          redeemed_at?: string | null
          referral_id?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          issued_at?: string | null
          redeem_code?: string | null
          redeemed_at?: string | null
          referral_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          channel: string
          code: string
          completed_at: string | null
          created_at: string
          id: string
          referee_email: string | null
          referee_id: string | null
          referrer_id: string
          signed_up_at: string | null
          status: string
        }
        Insert: {
          channel?: string
          code: string
          completed_at?: string | null
          created_at?: string
          id?: string
          referee_email?: string | null
          referee_id?: string | null
          referrer_id: string
          signed_up_at?: string | null
          status?: string
        }
        Update: {
          channel?: string
          code?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          referee_email?: string | null
          referee_id?: string | null
          referrer_id?: string
          signed_up_at?: string | null
          status?: string
        }
        Relationships: []
      }
      saved_events: {
        Row: {
          created_at: string
          event_id: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          kind?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_venues: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          user_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          user_id: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_venues_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      stop_menus: {
        Row: {
          generated_at: string
          items: Json
          source: string
          stop_id: string
        }
        Insert: {
          generated_at?: string
          items?: Json
          source?: string
          stop_id: string
        }
        Update: {
          generated_at?: string
          items?: Json
          source?: string
          stop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stop_menus_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: true
            referencedRelation: "itinerary_stops"
            referencedColumns: ["id"]
          },
        ]
      }
      stop_orders: {
        Row: {
          created_at: string
          id: string
          items: Json
          itinerary_id: string
          note: string | null
          status: string
          stop_id: string
          total_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          itinerary_id: string
          note?: string | null
          status?: string
          stop_id: string
          total_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          itinerary_id?: string
          note?: string | null
          status?: string
          stop_id?: string
          total_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stop_orders_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stop_orders_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "itinerary_stops"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          active: boolean
          body: string
          country: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          position: number
          rating: number | null
          updated_at: string
          username: string
        }
        Insert: {
          active?: boolean
          body: string
          country?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          position?: number
          rating?: number | null
          updated_at?: string
          username: string
        }
        Update: {
          active?: boolean
          body?: string
          country?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          position?: number
          rating?: number | null
          updated_at?: string
          username?: string
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
      tiktok_oauth_states: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          redirect_to: string | null
          state: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          redirect_to?: string | null
          state: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          redirect_to?: string | null
          state?: string
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
          social_handles: Json
          social_signals: string | null
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
          social_handles?: Json
          social_signals?: string | null
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
          social_handles?: Json
          social_signals?: string | null
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
      venue_claims: {
        Row: {
          admin_note: string | null
          advertiser_id: string | null
          contact_email: string | null
          created_at: string
          evidence_domain: string | null
          evidence_email: string | null
          evidence_handle: string | null
          evidence_url: string | null
          id: string
          method: string | null
          notes: string | null
          proof_url: string | null
          proposed_city: string | null
          proposed_name: string | null
          proposed_place_id: string | null
          proposed_website: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string | null
          venue_id: string
          verification_tier: string
        }
        Insert: {
          admin_note?: string | null
          advertiser_id?: string | null
          contact_email?: string | null
          created_at?: string
          evidence_domain?: string | null
          evidence_email?: string | null
          evidence_handle?: string | null
          evidence_url?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          proof_url?: string | null
          proposed_city?: string | null
          proposed_name?: string | null
          proposed_place_id?: string | null
          proposed_website?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          venue_id: string
          verification_tier?: string
        }
        Update: {
          admin_note?: string | null
          advertiser_id?: string | null
          contact_email?: string | null
          created_at?: string
          evidence_domain?: string | null
          evidence_email?: string | null
          evidence_handle?: string | null
          evidence_url?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          proof_url?: string | null
          proposed_city?: string | null
          proposed_name?: string | null
          proposed_place_id?: string | null
          proposed_website?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          venue_id?: string
          verification_tier?: string
        }
        Relationships: []
      }
      venue_details_cache: {
        Row: {
          cache_key: string
          created_at: string
          fetched_at: string
          formatted_address: string | null
          hours_text: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string | null
          open_now: boolean | null
          phone: string | null
          place_id: string | null
          price_level: number | null
          query: string
          rating: number | null
          raw: Json | null
          review_count: number | null
          website: string | null
        }
        Insert: {
          cache_key: string
          created_at?: string
          fetched_at?: string
          formatted_address?: string | null
          hours_text?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          open_now?: boolean | null
          phone?: string | null
          place_id?: string | null
          price_level?: number | null
          query: string
          rating?: number | null
          raw?: Json | null
          review_count?: number | null
          website?: string | null
        }
        Update: {
          cache_key?: string
          created_at?: string
          fetched_at?: string
          formatted_address?: string | null
          hours_text?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          open_now?: boolean | null
          phone?: string | null
          place_id?: string | null
          price_level?: number | null
          query?: string
          rating?: number | null
          raw?: Json | null
          review_count?: number | null
          website?: string | null
        }
        Relationships: []
      }
      venue_favorites: {
        Row: {
          category: string | null
          city: string | null
          created_at: string
          id: string
          image_url: string | null
          neighborhood: string | null
          user_id: string
          venue_id: string
          venue_name: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          neighborhood?: string | null
          user_id: string
          venue_id: string
          venue_name: string
        }
        Update: {
          category?: string | null
          city?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          neighborhood?: string | null
          user_id?: string
          venue_id?: string
          venue_name?: string
        }
        Relationships: []
      }
      venue_media_refresh_runs: {
        Row: {
          created_at: string
          errors: Json
          finished_at: string | null
          id: string
          photos_added: number
          socials_found: number
          started_at: string
          trigger: string
          venues_processed: number
        }
        Insert: {
          created_at?: string
          errors?: Json
          finished_at?: string | null
          id?: string
          photos_added?: number
          socials_found?: number
          started_at?: string
          trigger?: string
          venues_processed?: number
        }
        Update: {
          created_at?: string
          errors?: Json
          finished_at?: string | null
          id?: string
          photos_added?: number
          socials_found?: number
          started_at?: string
          trigger?: string
          venues_processed?: number
        }
        Relationships: []
      }
      venue_reports: {
        Row: {
          city: string | null
          created_at: string
          id: string
          notes: string | null
          place_id: string | null
          reason: string
          status: string
          user_id: string
          venue_name: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          place_id?: string | null
          reason?: string
          status?: string
          user_id: string
          venue_name: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          place_id?: string | null
          reason?: string
          status?: string
          user_id?: string
          venue_name?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          advertiser_id: string | null
          category: string
          city: string | null
          claim_status: string | null
          claimed_by: string | null
          created_at: string
          description: string | null
          featured: boolean
          featured_until: string | null
          gallery_refreshed_at: string | null
          gallery_urls: Json
          google_images: Json
          google_maps_url: string | null
          hero_image_url: string | null
          hidden_media_urls: string[]
          id: string
          image_url: string | null
          instagram_handle: string | null
          instagram_hashtags: string[]
          instagram_location_tag: string | null
          instagram_thumbnails: string[]
          instagram_url: string | null
          is_sponsored: boolean
          name: string
          neighborhood: string | null
          official_photos: string[]
          place_id: string | null
          price_band: string | null
          price_level: number
          promotion_approved: boolean
          rating: number | null
          socials_refreshed_at: string | null
          sponsored_boost_level: number
          staff_email: string | null
          tags: string[]
          tiktok_handle: string | null
          tiktok_hashtags: string[]
          tiktok_location_tag: string | null
          tiktok_thumbnails: string[]
          tiktok_url: string | null
          verified: boolean
          website: string | null
        }
        Insert: {
          advertiser_id?: string | null
          category: string
          city?: string | null
          claim_status?: string | null
          claimed_by?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          featured_until?: string | null
          gallery_refreshed_at?: string | null
          gallery_urls?: Json
          google_images?: Json
          google_maps_url?: string | null
          hero_image_url?: string | null
          hidden_media_urls?: string[]
          id?: string
          image_url?: string | null
          instagram_handle?: string | null
          instagram_hashtags?: string[]
          instagram_location_tag?: string | null
          instagram_thumbnails?: string[]
          instagram_url?: string | null
          is_sponsored?: boolean
          name: string
          neighborhood?: string | null
          official_photos?: string[]
          place_id?: string | null
          price_band?: string | null
          price_level?: number
          promotion_approved?: boolean
          rating?: number | null
          socials_refreshed_at?: string | null
          sponsored_boost_level?: number
          staff_email?: string | null
          tags?: string[]
          tiktok_handle?: string | null
          tiktok_hashtags?: string[]
          tiktok_location_tag?: string | null
          tiktok_thumbnails?: string[]
          tiktok_url?: string | null
          verified?: boolean
          website?: string | null
        }
        Update: {
          advertiser_id?: string | null
          category?: string
          city?: string | null
          claim_status?: string | null
          claimed_by?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          featured_until?: string | null
          gallery_refreshed_at?: string | null
          gallery_urls?: Json
          google_images?: Json
          google_maps_url?: string | null
          hero_image_url?: string | null
          hidden_media_urls?: string[]
          id?: string
          image_url?: string | null
          instagram_handle?: string | null
          instagram_hashtags?: string[]
          instagram_location_tag?: string | null
          instagram_thumbnails?: string[]
          instagram_url?: string | null
          is_sponsored?: boolean
          name?: string
          neighborhood?: string | null
          official_photos?: string[]
          place_id?: string | null
          price_band?: string | null
          price_level?: number
          promotion_approved?: boolean
          rating?: number | null
          socials_refreshed_at?: string | null
          sponsored_boost_level?: number
          staff_email?: string | null
          tags?: string[]
          tiktok_handle?: string | null
          tiktok_hashtags?: string[]
          tiktok_location_tag?: string | null
          tiktok_thumbnails?: string[]
          tiktok_url?: string | null
          verified?: boolean
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      viral_discovery_runs: {
        Row: {
          candidates_found: number
          city: string | null
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          id: string
          queries_run: number
          started_at: string
          venues_upserted: number
        }
        Insert: {
          candidates_found?: number
          city?: string | null
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          queries_run?: number
          started_at?: string
          venues_upserted?: number
        }
        Update: {
          candidates_found?: number
          city?: string | null
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          queries_run?: number
          started_at?: string
          venues_upserted?: number
        }
        Relationships: []
      }
      viral_venues: {
        Row: {
          address: string | null
          city: string
          discovered_at: string
          google_place_id: string | null
          id: string
          last_mentioned_at: string
          lat: number | null
          lng: number | null
          mention_count: number
          neighborhood: string | null
          normalized_name: string
          photo_url: string | null
          rating: number | null
          refreshed_at: string
          source_urls: Json
          summary: string | null
          tags: string[]
          trend_score: number
          venue_name: string
          verified: boolean
          website: string | null
        }
        Insert: {
          address?: string | null
          city: string
          discovered_at?: string
          google_place_id?: string | null
          id?: string
          last_mentioned_at?: string
          lat?: number | null
          lng?: number | null
          mention_count?: number
          neighborhood?: string | null
          normalized_name: string
          photo_url?: string | null
          rating?: number | null
          refreshed_at?: string
          source_urls?: Json
          summary?: string | null
          tags?: string[]
          trend_score?: number
          venue_name: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string
          discovered_at?: string
          google_place_id?: string | null
          id?: string
          last_mentioned_at?: string
          lat?: number | null
          lng?: number | null
          mention_count?: number
          neighborhood?: string | null
          normalized_name?: string
          photo_url?: string | null
          rating?: number | null
          refreshed_at?: string
          source_urls?: Json
          summary?: string | null
          tags?: string[]
          trend_score?: number
          venue_name?: string
          verified?: boolean
          website?: string | null
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
      blocked_place_ids_for_city: {
        Args: { _city: string }
        Returns: {
          place_id: string
        }[]
      }
      gen_referral_code: { Args: never; Returns: string }
      get_attendee_by_token: {
        Args: { _token: string }
        Returns: {
          attendee_email: string
          attendee_id: string
          attendee_name: string
          dietary: string
          ends_at: string
          event_id: string
          event_title: string
          org_name: string
          purpose: string
          rsvp_status: string
          starts_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_rsvp_by_token: {
        Args: { _dietary: string; _status: string; _token: string }
        Returns: boolean
      }
      referral_leaderboard: {
        Args: { _limit?: number }
        Returns: {
          completed: number
          display_name: string
          earned_cents: number
          invited: number
          level: number
          signed_up: number
          tier: string
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      oauth_submission_status: "pending" | "approved" | "rejected"
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
      oauth_submission_status: ["pending", "approved", "rejected"],
    },
  },
} as const
