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
      admin_audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_label: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json
          note: string | null
          reviewer_email: string | null
          reviewer_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          note?: string | null
          reviewer_email?: string | null
          reviewer_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          note?: string | null
          reviewer_email?: string | null
          reviewer_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_pins: {
        Row: {
          created_at: string
          failed_attempts: number
          locked_until: string | null
          pin_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          failed_attempts?: number
          locked_until?: string | null
          pin_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          failed_attempts?: number
          locked_until?: string | null
          pin_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string
          id: boolean
          pin_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: boolean
          pin_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: boolean
          pin_hash?: string
          updated_at?: string
        }
        Relationships: []
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
          onboarding_step: number
          owner_id: string
          owner_name: string | null
          package_selected: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: string
          status: string
          submitted_at: string
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
          onboarding_step?: number
          owner_id: string
          owner_name?: string | null
          package_selected?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          submitted_at?: string
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
          onboarding_step?: number
          owner_id?: string
          owner_name?: string | null
          package_selected?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          submitted_at?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      agent_messages: {
        Row: {
          body: string | null
          created_at: string
          from_agent: string
          id: string
          metadata: Json
          msg_type: string
          read: boolean
          subject: string
          to_agent: string | null
          to_team: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          from_agent: string
          id?: string
          metadata?: Json
          msg_type: string
          read?: boolean
          subject: string
          to_agent?: string | null
          to_team?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          from_agent?: string
          id?: string
          metadata?: Json
          msg_type?: string
          read?: boolean
          subject?: string
          to_agent?: string | null
          to_team?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_from_agent_fkey"
            columns: ["from_agent"]
            isOneToOne: false
            referencedRelation: "agent_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_messages_to_agent_fkey"
            columns: ["to_agent"]
            isOneToOne: false
            referencedRelation: "agent_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_messages_to_team_fkey"
            columns: ["to_team"]
            isOneToOne: false
            referencedRelation: "agent_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_registry: {
        Row: {
          created_at: string
          description: string
          error_count: number
          file_path: string
          id: string
          last_active: string | null
          last_task: string | null
          layer: string
          name: string
          status: string
          tasks_completed: number
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          error_count?: number
          file_path?: string
          id: string
          last_active?: string | null
          last_task?: string | null
          layer?: string
          name: string
          status?: string
          tasks_completed?: number
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          error_count?: number
          file_path?: string
          id?: string
          last_active?: string | null
          last_task?: string | null
          layer?: string
          name?: string
          status?: string
          tasks_completed?: number
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_registry_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "agent_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_at: string | null
          id: string
          priority: string
          status: string
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          status?: string
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          status?: string
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "agent_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agent_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "agent_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_teams: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
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
      boarding_pass_crew: {
        Row: {
          created_at: string
          eta: string
          id: string
          name: string
          rsvp: string
          share_token: string
          status: string
          travel: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          eta?: string
          id?: string
          name: string
          rsvp?: string
          share_token: string
          status?: string
          travel?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          eta?: string
          id?: string
          name?: string
          rsvp?: string
          share_token?: string
          status?: string
          travel?: string
          updated_at?: string
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
      booking_status_changes: {
        Row: {
          actor_email: string | null
          actor_role: string
          booking_id: string
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          note: string | null
          old_status: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_role?: string
          booking_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_role?: string
          booking_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_changes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          admin_notes: string | null
          cancelled_at: string | null
          confirmation_code: string | null
          created_at: string
          id: string
          notes: string | null
          partner_tier: number
          party_size: number
          pre_order_drinks: Json
          seating_preference: string | null
          source: string
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
          confirmation_code?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          partner_tier?: number
          party_size?: number
          pre_order_drinks?: Json
          seating_preference?: string | null
          source?: string
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
          confirmation_code?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          partner_tier?: number
          party_size?: number
          pre_order_drinks?: Json
          seating_preference?: string | null
          source?: string
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
      business_purchases: {
        Row: {
          activated_at: string
          amount_cents: number
          created_at: string
          currency: string
          environment: string
          expires_at: string | null
          id: string
          metadata: Json
          mode: string
          sku: string
          status: string
          stripe_customer_id: string | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          target_id: string | null
          target_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          amount_cents?: number
          created_at?: string
          currency?: string
          environment?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          mode: string
          sku: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          target_id?: string | null
          target_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string
          amount_cents?: number
          created_at?: string
          currency?: string
          environment?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          mode?: string
          sku?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          target_id?: string | null
          target_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      city_ideas: {
        Row: {
          best_time: string | null
          category: string
          city: string
          country: string | null
          created_at: string
          description: string
          id: string
          neighborhood: string | null
          price_tier: number | null
          published: boolean | null
          source: string | null
          source_refs: Json | null
          title: string
          trending_score: number | null
          updated_at: string
          venue_hint: string | null
          vibe_tags: string[] | null
        }
        Insert: {
          best_time?: string | null
          category: string
          city: string
          country?: string | null
          created_at?: string
          description: string
          id?: string
          neighborhood?: string | null
          price_tier?: number | null
          published?: boolean | null
          source?: string | null
          source_refs?: Json | null
          title: string
          trending_score?: number | null
          updated_at?: string
          venue_hint?: string | null
          vibe_tags?: string[] | null
        }
        Update: {
          best_time?: string | null
          category?: string
          city?: string
          country?: string | null
          created_at?: string
          description?: string
          id?: string
          neighborhood?: string | null
          price_tier?: number | null
          published?: boolean | null
          source?: string | null
          source_refs?: Json | null
          title?: string
          trending_score?: number | null
          updated_at?: string
          venue_hint?: string | null
          vibe_tags?: string[] | null
        }
        Relationships: []
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
      confetti_ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          reference_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          reference_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          reference_id?: string | null
          user_id?: string
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
      corporate_companies: {
        Row: {
          billing_email: string | null
          created_at: string
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          plan_tier: string
          settings: Json
          slug: string | null
          updated_at: string
        }
        Insert: {
          billing_email?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          plan_tier?: string
          settings?: Json
          slug?: string | null
          updated_at?: string
        }
        Update: {
          billing_email?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          plan_tier?: string
          settings?: Json
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      corporate_company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          invited_email: string | null
          joined_at: string
          role: Database["public"]["Enums"]["corporate_member_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          invited_email?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["corporate_member_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          invited_email?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["corporate_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "corporate_companies"
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
      corporate_outings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          budget_per_person_cents: number
          city: string | null
          company_id: string
          corporate_event_id: string | null
          created_at: string
          created_by: string
          ends_at: string | null
          headcount: number
          id: string
          itinerary_id: string | null
          notes: string | null
          policy_id: string | null
          purpose: string
          starts_at: string | null
          status: Database["public"]["Enums"]["corporate_outing_status"]
          team_id: string | null
          title: string
          total_budget_cents: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          budget_per_person_cents?: number
          city?: string | null
          company_id: string
          corporate_event_id?: string | null
          created_at?: string
          created_by: string
          ends_at?: string | null
          headcount?: number
          id?: string
          itinerary_id?: string | null
          notes?: string | null
          policy_id?: string | null
          purpose?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["corporate_outing_status"]
          team_id?: string | null
          title: string
          total_budget_cents?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          budget_per_person_cents?: number
          city?: string | null
          company_id?: string
          corporate_event_id?: string | null
          created_at?: string
          created_by?: string
          ends_at?: string | null
          headcount?: number
          id?: string
          itinerary_id?: string | null
          notes?: string | null
          policy_id?: string | null
          purpose?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["corporate_outing_status"]
          team_id?: string | null
          title?: string
          total_budget_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_outings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "corporate_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_outings_corporate_event_id_fkey"
            columns: ["corporate_event_id"]
            isOneToOne: false
            referencedRelation: "corporate_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_outings_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "corporate_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_outings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "corporate_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_policies: {
        Row: {
          alcohol_allowed: boolean
          allowed_categories: string[]
          allowed_cities: string[]
          approval_threshold_cents: number
          blocked_categories: string[]
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean
          max_headcount: number | null
          name: string
          per_person_budget_cents: number
          team_id: string | null
          updated_at: string
        }
        Insert: {
          alcohol_allowed?: boolean
          allowed_categories?: string[]
          allowed_cities?: string[]
          approval_threshold_cents?: number
          blocked_categories?: string[]
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          max_headcount?: number | null
          name: string
          per_person_budget_cents?: number
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          alcohol_allowed?: boolean
          allowed_categories?: string[]
          allowed_cities?: string[]
          approval_threshold_cents?: number
          blocked_categories?: string[]
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          max_headcount?: number | null
          name?: string
          per_person_budget_cents?: number
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "corporate_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_policies_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "corporate_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_team_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["corporate_member_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["corporate_member_role"]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["corporate_member_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "corporate_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_teams: {
        Row: {
          city: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          manager_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_teams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "corporate_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      error_reports: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          metadata: Json
          resolved: boolean
          route: string | null
          session_id: string | null
          stack: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          message: string
          metadata?: Json
          resolved?: boolean
          route?: string | null
          session_id?: string | null
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          metadata?: Json
          resolved?: boolean
          route?: string | null
          session_id?: string | null
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      event_tickets: {
        Row: {
          amount_cents: number
          confetti_awarded: number
          created_at: string
          currency: string
          environment: string
          event_id: string
          id: string
          metadata: Json
          qr_token: string | null
          quantity: number
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          confetti_awarded?: number
          created_at?: string
          currency?: string
          environment?: string
          event_id: string
          id?: string
          metadata?: Json
          qr_token?: string | null
          quantity?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          confetti_awarded?: number
          created_at?: string
          currency?: string
          environment?: string
          event_id?: string
          id?: string
          metadata?: Json
          qr_token?: string | null
          quantity?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          boost_sku: string | null
          boost_tier: string | null
          boost_until: string | null
          boost_weight: number
          category: string | null
          city: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          lat: number | null
          lng: number | null
          neighborhood: string | null
          price_cents: number | null
          source: string
          source_ref: string | null
          starts_at: string
          status: string
          tags: string[]
          ticket_url: string | null
          tickets_enabled: boolean
          title: string
          updated_at: string
          venue_id: string | null
          venue_name: string | null
        }
        Insert: {
          address?: string | null
          boost_sku?: string | null
          boost_tier?: string | null
          boost_until?: string | null
          boost_weight?: number
          category?: string | null
          city: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          neighborhood?: string | null
          price_cents?: number | null
          source?: string
          source_ref?: string | null
          starts_at: string
          status?: string
          tags?: string[]
          ticket_url?: string | null
          tickets_enabled?: boolean
          title: string
          updated_at?: string
          venue_id?: string | null
          venue_name?: string | null
        }
        Update: {
          address?: string | null
          boost_sku?: string | null
          boost_tier?: string | null
          boost_until?: string | null
          boost_weight?: number
          category?: string | null
          city?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          neighborhood?: string | null
          price_cents?: number | null
          source?: string
          source_ref?: string | null
          starts_at?: string
          status?: string
          tags?: string[]
          ticket_url?: string | null
          tickets_enabled?: boolean
          title?: string
          updated_at?: string
          venue_id?: string | null
          venue_name?: string | null
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
      partner_deals: {
        Row: {
          active: boolean
          adult_only: boolean
          budget_tier_max: number | null
          budget_tier_min: number | null
          category_tags: string[]
          city: string | null
          created_at: string
          deal_type: string
          description: string | null
          family_safe: boolean
          group_size_max: number | null
          group_size_min: number | null
          id: string
          title: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          venue_id: string | null
          venue_name: string | null
          vibe_tags: string[]
        }
        Insert: {
          active?: boolean
          adult_only?: boolean
          budget_tier_max?: number | null
          budget_tier_min?: number | null
          category_tags?: string[]
          city?: string | null
          created_at?: string
          deal_type?: string
          description?: string | null
          family_safe?: boolean
          group_size_max?: number | null
          group_size_min?: number | null
          id?: string
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          venue_id?: string | null
          venue_name?: string | null
          vibe_tags?: string[]
        }
        Update: {
          active?: boolean
          adult_only?: boolean
          budget_tier_max?: number | null
          budget_tier_min?: number | null
          category_tags?: string[]
          city?: string | null
          created_at?: string
          deal_type?: string
          description?: string | null
          family_safe?: boolean
          group_size_max?: number | null
          group_size_min?: number | null
          id?: string
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          venue_id?: string | null
          venue_name?: string | null
          vibe_tags?: string[]
        }
        Relationships: []
      }
      pending_admin_actions: {
        Row: {
          action_type: string
          approved_by: string | null
          created_at: string
          error: string | null
          executed_at: string | null
          id: string
          params: Json
          proposed_by: string | null
          result: Json | null
          status: string
          summary: string
          updated_at: string
        }
        Insert: {
          action_type: string
          approved_by?: string | null
          created_at?: string
          error?: string | null
          executed_at?: string | null
          id?: string
          params?: Json
          proposed_by?: string | null
          result?: Json | null
          status?: string
          summary: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          approved_by?: string | null
          created_at?: string
          error?: string | null
          executed_at?: string | null
          id?: string
          params?: Json
          proposed_by?: string | null
          result?: Json | null
          status?: string
          summary?: string
          updated_at?: string
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
          confetti_pts: number
          created_at: string
          display_name: string | null
          ev_owner: boolean
          id: string
          level: number
          onboarding_complete: boolean
          preferred_ride: string
          preferred_vehicle: string | null
          updated_at: string
          vip_until: string | null
          xp: number
        }
        Insert: {
          confetti_pts?: number
          created_at?: string
          display_name?: string | null
          ev_owner?: boolean
          id: string
          level?: number
          onboarding_complete?: boolean
          preferred_ride?: string
          preferred_vehicle?: string | null
          updated_at?: string
          vip_until?: string | null
          xp?: number
        }
        Update: {
          confetti_pts?: number
          created_at?: string
          display_name?: string | null
          ev_owner?: boolean
          id?: string
          level?: number
          onboarding_complete?: boolean
          preferred_ride?: string
          preferred_vehicle?: string | null
          updated_at?: string
          vip_until?: string | null
          xp?: number
        }
        Relationships: []
      }
      promoter_jobs: {
        Row: {
          accepted_at: string | null
          advertiser_id: string
          amount_cents: number
          boarding_pass_itinerary_id: string | null
          brief: string
          cancelled_at: string | null
          created_at: string
          currency: string
          deliverables: Json
          delivered_at: string | null
          due_at: string | null
          funded_at: string | null
          id: string
          paid_at: string | null
          platform_fee_bps: number
          promoter_id: string
          status: Database["public"]["Enums"]["promoter_job_status"]
          stripe_payment_intent_id: string | null
          title: string
          updated_at: string
          venue_id: string | null
          verified_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          advertiser_id: string
          amount_cents: number
          boarding_pass_itinerary_id?: string | null
          brief: string
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          deliverables?: Json
          delivered_at?: string | null
          due_at?: string | null
          funded_at?: string | null
          id?: string
          paid_at?: string | null
          platform_fee_bps?: number
          promoter_id: string
          status?: Database["public"]["Enums"]["promoter_job_status"]
          stripe_payment_intent_id?: string | null
          title: string
          updated_at?: string
          venue_id?: string | null
          verified_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          advertiser_id?: string
          amount_cents?: number
          boarding_pass_itinerary_id?: string | null
          brief?: string
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          deliverables?: Json
          delivered_at?: string | null
          due_at?: string | null
          funded_at?: string | null
          id?: string
          paid_at?: string | null
          platform_fee_bps?: number
          promoter_id?: string
          status?: Database["public"]["Enums"]["promoter_job_status"]
          stripe_payment_intent_id?: string | null
          title?: string
          updated_at?: string
          venue_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoter_jobs_boarding_pass_itinerary_id_fkey"
            columns: ["boarding_pass_itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_jobs_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_metrics_daily: {
        Row: {
          bookings_attributed: number
          clicks: number
          created_at: string
          date: string
          engagement: number
          id: string
          job_id: string | null
          promoter_id: string
          updated_at: string
          views: number
        }
        Insert: {
          bookings_attributed?: number
          clicks?: number
          created_at?: string
          date: string
          engagement?: number
          id?: string
          job_id?: string | null
          promoter_id: string
          updated_at?: string
          views?: number
        }
        Update: {
          bookings_attributed?: number
          clicks?: number
          created_at?: string
          date?: string
          engagement?: number
          id?: string
          job_id?: string | null
          promoter_id?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "promoter_metrics_daily_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "promoter_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_metrics_daily_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_payouts: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          job_id: string | null
          paid_at: string | null
          promoter_id: string
          status: Database["public"]["Enums"]["promoter_payout_status"]
          stripe_transfer_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          job_id?: string | null
          paid_at?: string | null
          promoter_id: string
          status?: Database["public"]["Enums"]["promoter_payout_status"]
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          job_id?: string | null
          paid_at?: string | null
          promoter_id?: string
          status?: Database["public"]["Enums"]["promoter_payout_status"]
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoter_payouts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "promoter_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_payouts_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promoter_submissions: {
        Row: {
          boarding_pass_visible: boolean
          caption: string | null
          content_url: string
          created_at: string
          id: string
          job_id: string
          metrics: Json
          platform: string
          posted_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["promoter_submission_status"]
        }
        Insert: {
          boarding_pass_visible?: boolean
          caption?: string | null
          content_url: string
          created_at?: string
          id?: string
          job_id: string
          metrics?: Json
          platform: string
          posted_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["promoter_submission_status"]
        }
        Update: {
          boarding_pass_visible?: boolean
          caption?: string | null
          content_url?: string
          created_at?: string
          id?: string
          job_id?: string
          metrics?: Json
          platform?: string
          posted_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["promoter_submission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "promoter_submissions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "promoter_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      promoters: {
        Row: {
          admin_notes: string | null
          audience: Json
          avatar_url: string | null
          bio: string | null
          cities: string[]
          created_at: string
          display_name: string
          id: string
          jobs_completed: number
          niche: string[]
          rate_card: Json
          rating: number | null
          sample_links: string[]
          status: Database["public"]["Enums"]["promoter_status"]
          stripe_account_id: string | null
          stripe_payouts_enabled: boolean
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          audience?: Json
          avatar_url?: string | null
          bio?: string | null
          cities?: string[]
          created_at?: string
          display_name: string
          id?: string
          jobs_completed?: number
          niche?: string[]
          rate_card?: Json
          rating?: number | null
          sample_links?: string[]
          status?: Database["public"]["Enums"]["promoter_status"]
          stripe_account_id?: string | null
          stripe_payouts_enabled?: boolean
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          audience?: Json
          avatar_url?: string | null
          bio?: string | null
          cities?: string[]
          created_at?: string
          display_name?: string
          id?: string
          jobs_completed?: number
          niche?: string[]
          rate_card?: Json
          rating?: number | null
          sample_links?: string[]
          status?: Database["public"]["Enums"]["promoter_status"]
          stripe_account_id?: string | null
          stripe_payouts_enabled?: boolean
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      reel_engagements: {
        Row: {
          created_at: string
          id: string
          kind: string
          reel_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          reel_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          reel_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reel_engagements_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          author_id: string | null
          boost_sku: string | null
          boost_tier: string | null
          boost_until: string | null
          caption: string | null
          city: string | null
          created_at: string
          duration_seconds: number | null
          featured: boolean
          id: string
          like_count: number
          promoter_id: string | null
          share_count: number
          source: string
          source_url: string | null
          status: string
          tags: string[]
          thumbnail_url: string | null
          title: string | null
          trending_score: number
          updated_at: string
          venue_id: string | null
          video_url: string
          view_count: number
        }
        Insert: {
          author_id?: string | null
          boost_sku?: string | null
          boost_tier?: string | null
          boost_until?: string | null
          caption?: string | null
          city?: string | null
          created_at?: string
          duration_seconds?: number | null
          featured?: boolean
          id?: string
          like_count?: number
          promoter_id?: string | null
          share_count?: number
          source?: string
          source_url?: string | null
          status?: string
          tags?: string[]
          thumbnail_url?: string | null
          title?: string | null
          trending_score?: number
          updated_at?: string
          venue_id?: string | null
          video_url: string
          view_count?: number
        }
        Update: {
          author_id?: string | null
          boost_sku?: string | null
          boost_tier?: string | null
          boost_until?: string | null
          caption?: string | null
          city?: string | null
          created_at?: string
          duration_seconds?: number | null
          featured?: boolean
          id?: string
          like_count?: number
          promoter_id?: string | null
          share_count?: number
          source?: string
          source_url?: string | null
          status?: string
          tags?: string[]
          thumbnail_url?: string | null
          title?: string | null
          trending_score?: number
          updated_at?: string
          venue_id?: string | null
          video_url?: string
          view_count?: number
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
      stripe_webhook_events: {
        Row: {
          attempts: number
          environment: string
          error: string | null
          event_type: string
          id: string
          last_error_at: string | null
          payload: Json
          processed_at: string | null
          received_at: string
          status: string
          stripe_event_id: string
        }
        Insert: {
          attempts?: number
          environment?: string
          error?: string | null
          event_type: string
          id?: string
          last_error_at?: string | null
          payload: Json
          processed_at?: string | null
          received_at?: string
          status?: string
          stripe_event_id: string
        }
        Update: {
          attempts?: number
          environment?: string
          error?: string | null
          event_type?: string
          id?: string
          last_error_at?: string | null
          payload?: Json
          processed_at?: string | null
          received_at?: string
          status?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          account_type: string
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          pending_price_id: string | null
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_type?: string
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          pending_price_id?: string | null
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_type?: string
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          pending_price_id?: string | null
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          details: string | null
          due_date: string | null
          id: string
          kind: string
          opened_by: string | null
          severity: string
          status: string
          summary: string
          target_email: string | null
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          due_date?: string | null
          id?: string
          kind: string
          opened_by?: string | null
          severity?: string
          status?: string
          summary: string
          target_email?: string | null
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          due_date?: string | null
          id?: string
          kind?: string
          opened_by?: string | null
          severity?: string
          status?: string
          summary?: string
          target_email?: string | null
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
      trip_days: {
        Row: {
          created_at: string
          day_index: number
          day_name: string | null
          day_theme: string | null
          estimated_cost: number | null
          id: string
          itinerary: Json | null
          rest_blocks: Json
          transportation_notes: string | null
          trip_id: string
          weather_fallback: string | null
        }
        Insert: {
          created_at?: string
          day_index: number
          day_name?: string | null
          day_theme?: string | null
          estimated_cost?: number | null
          id?: string
          itinerary?: Json | null
          rest_blocks?: Json
          transportation_notes?: string | null
          trip_id: string
          weather_fallback?: string | null
        }
        Update: {
          created_at?: string
          day_index?: number
          day_name?: string | null
          day_theme?: string | null
          estimated_cost?: number | null
          id?: string
          itinerary?: Json | null
          rest_blocks?: Json
          transportation_notes?: string | null
          trip_id?: string
          weather_fallback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_days_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          arrival_time: string | null
          avoid_categories: string[]
          budget_per_day: number | null
          budget_total: number | null
          created_at: string
          departure_time: string | null
          destination_city: string
          energy_curve: string
          group_size: number
          group_type: string | null
          home_base_area: string | null
          id: string
          must_do_categories: string[]
          status: string
          transportation_mode: string | null
          trip_length_days: number
          trip_name: string
          trip_name_options: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          arrival_time?: string | null
          avoid_categories?: string[]
          budget_per_day?: number | null
          budget_total?: number | null
          created_at?: string
          departure_time?: string | null
          destination_city: string
          energy_curve?: string
          group_size?: number
          group_type?: string | null
          home_base_area?: string | null
          id?: string
          must_do_categories?: string[]
          status?: string
          transportation_mode?: string | null
          trip_length_days: number
          trip_name: string
          trip_name_options?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          arrival_time?: string | null
          avoid_categories?: string[]
          budget_per_day?: number | null
          budget_total?: number | null
          created_at?: string
          departure_time?: string | null
          destination_city?: string
          energy_curve?: string
          group_size?: number
          group_type?: string | null
          home_base_area?: string | null
          id?: string
          must_do_categories?: string[]
          status?: string
          transportation_mode?: string | null
          trip_length_days?: number
          trip_name?: string
          trip_name_options?: Json
          updated_at?: string
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
          adult_opt_in: boolean
          budget_max: number
          budget_min: number
          comfort_level: string
          cuisines: string[]
          disliked_business_types: string[]
          disliked_categories: string[]
          favorite_city_features: string[]
          manual_overrides: Json
          nightlife_intensity: string
          personalized_name_style: string
          preferred_business_types: string[]
          preferred_categories: string[]
          preferred_neighborhoods: string[]
          preferred_price_tier: number | null
          preferred_time_slots: string[]
          preferred_vibes: string[]
          promo_sensitivity: string
          risk_tolerance: string
          social_handles: Json
          social_signals: string | null
          taste_profile: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          about_me?: string | null
          activities?: string[]
          adult_opt_in?: boolean
          budget_max?: number
          budget_min?: number
          comfort_level?: string
          cuisines?: string[]
          disliked_business_types?: string[]
          disliked_categories?: string[]
          favorite_city_features?: string[]
          manual_overrides?: Json
          nightlife_intensity?: string
          personalized_name_style?: string
          preferred_business_types?: string[]
          preferred_categories?: string[]
          preferred_neighborhoods?: string[]
          preferred_price_tier?: number | null
          preferred_time_slots?: string[]
          preferred_vibes?: string[]
          promo_sensitivity?: string
          risk_tolerance?: string
          social_handles?: Json
          social_signals?: string | null
          taste_profile?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          about_me?: string | null
          activities?: string[]
          adult_opt_in?: boolean
          budget_max?: number
          budget_min?: number
          comfort_level?: string
          cuisines?: string[]
          disliked_business_types?: string[]
          disliked_categories?: string[]
          favorite_city_features?: string[]
          manual_overrides?: Json
          nightlife_intensity?: string
          personalized_name_style?: string
          preferred_business_types?: string[]
          preferred_categories?: string[]
          preferred_neighborhoods?: string[]
          preferred_price_tier?: number | null
          preferred_time_slots?: string[]
          preferred_vibes?: string[]
          promo_sensitivity?: string
          risk_tolerance?: string
          social_handles?: Json
          social_signals?: string | null
          taste_profile?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string
          environment: string
          id: string
          metadata: Json | null
          price_id: string | null
          product_id: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string
          environment?: string
          id?: string
          metadata?: Json | null
          price_id?: string | null
          product_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string
          environment?: string
          id?: string
          metadata?: Json | null
          price_id?: string | null
          product_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
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
      user_signals: {
        Row: {
          city: string | null
          created_at: string
          id: string
          payload: Json
          signal_type: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          payload?: Json
          signal_type: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          payload?: Json
          signal_type?: string
          user_id?: string
        }
        Relationships: []
      }
      vendor_payouts: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string
          environment: string
          id: string
          metadata: Json | null
          related_purchase_id: string | null
          status: string
          stripe_payout_id: string | null
          stripe_transfer_id: string | null
          updated_at: string | null
          vendor_account_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string
          environment?: string
          id?: string
          metadata?: Json | null
          related_purchase_id?: string | null
          status?: string
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string | null
          vendor_account_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string
          environment?: string
          id?: string
          metadata?: Json | null
          related_purchase_id?: string | null
          status?: string
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string | null
          vendor_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payouts_related_purchase_id_fkey"
            columns: ["related_purchase_id"]
            isOneToOne: false
            referencedRelation: "user_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payouts_vendor_account_id_fkey"
            columns: ["vendor_account_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_profiles: {
        Row: {
          accent_color: string | null
          address: Json | null
          banner_url: string | null
          brand_color: string | null
          business_name: string
          category: string | null
          created_at: string
          description: string | null
          display_name: string | null
          id: string
          is_published: boolean
          legal_name: string | null
          logo_url: string | null
          settings: Json
          social_links: Json
          support_email: string | null
          support_phone: string | null
          tagline: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          vendor_id: string | null
          website_url: string | null
        }
        Insert: {
          accent_color?: string | null
          address?: Json | null
          banner_url?: string | null
          brand_color?: string | null
          business_name: string
          category?: string | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          is_published?: boolean
          legal_name?: string | null
          logo_url?: string | null
          settings?: Json
          social_links?: Json
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          vendor_id?: string | null
          website_url?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: Json | null
          banner_url?: string | null
          brand_color?: string | null
          business_name?: string
          category?: string | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          is_published?: boolean
          legal_name?: string | null
          logo_url?: string | null
          settings?: Json
          social_links?: Json
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_profiles_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          charges_enabled: boolean | null
          created_at: string | null
          details_submitted: boolean | null
          environment: string
          id: string
          payout_schedule: string | null
          payouts_enabled: boolean | null
          stripe_account_id: string
          updated_at: string | null
          user_id: string
          vendor_type: string
        }
        Insert: {
          charges_enabled?: boolean | null
          created_at?: string | null
          details_submitted?: boolean | null
          environment?: string
          id?: string
          payout_schedule?: string | null
          payouts_enabled?: boolean | null
          stripe_account_id: string
          updated_at?: string | null
          user_id: string
          vendor_type: string
        }
        Update: {
          charges_enabled?: boolean | null
          created_at?: string | null
          details_submitted?: boolean | null
          environment?: string
          id?: string
          payout_schedule?: string | null
          payouts_enabled?: boolean | null
          stripe_account_id?: string
          updated_at?: string | null
          user_id?: string
          vendor_type?: string
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
          venue_id: string | null
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
          venue_id?: string | null
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
          venue_id?: string | null
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
          active: boolean
          advertiser_id: string | null
          booking_url: string | null
          boost_sku: string | null
          boost_tier: string | null
          boost_until: string | null
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
          maps_url: string | null
          max_party_size: number | null
          menu_url: string | null
          name: string
          neighborhood: string | null
          official_photos: string[]
          order_ahead_url: string | null
          partner_tier: number
          phone: string | null
          place_id: string | null
          price_band: string | null
          price_level: number
          promotion_approved: boolean
          published: boolean
          rating: number | null
          socials_refreshed_at: string | null
          specials: string | null
          sponsored_boost_level: number
          staff_email: string | null
          state: string | null
          supports_group_booking: boolean
          supports_in_app_booking: boolean
          supports_in_app_order_ahead: boolean
          supports_instant_confirm: boolean
          supports_live_inventory: boolean
          supports_pos_sync: boolean
          tags: string[]
          tiktok_handle: string | null
          tiktok_hashtags: string[]
          tiktok_location_tag: string | null
          tiktok_thumbnails: string[]
          tiktok_url: string | null
          trending_refreshed_at: string | null
          trending_score: number
          verified: boolean
          website: string | null
        }
        Insert: {
          active?: boolean
          advertiser_id?: string | null
          booking_url?: string | null
          boost_sku?: string | null
          boost_tier?: string | null
          boost_until?: string | null
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
          maps_url?: string | null
          max_party_size?: number | null
          menu_url?: string | null
          name: string
          neighborhood?: string | null
          official_photos?: string[]
          order_ahead_url?: string | null
          partner_tier?: number
          phone?: string | null
          place_id?: string | null
          price_band?: string | null
          price_level?: number
          promotion_approved?: boolean
          published?: boolean
          rating?: number | null
          socials_refreshed_at?: string | null
          specials?: string | null
          sponsored_boost_level?: number
          staff_email?: string | null
          state?: string | null
          supports_group_booking?: boolean
          supports_in_app_booking?: boolean
          supports_in_app_order_ahead?: boolean
          supports_instant_confirm?: boolean
          supports_live_inventory?: boolean
          supports_pos_sync?: boolean
          tags?: string[]
          tiktok_handle?: string | null
          tiktok_hashtags?: string[]
          tiktok_location_tag?: string | null
          tiktok_thumbnails?: string[]
          tiktok_url?: string | null
          trending_refreshed_at?: string | null
          trending_score?: number
          verified?: boolean
          website?: string | null
        }
        Update: {
          active?: boolean
          advertiser_id?: string | null
          booking_url?: string | null
          boost_sku?: string | null
          boost_tier?: string | null
          boost_until?: string | null
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
          maps_url?: string | null
          max_party_size?: number | null
          menu_url?: string | null
          name?: string
          neighborhood?: string | null
          official_photos?: string[]
          order_ahead_url?: string | null
          partner_tier?: number
          phone?: string | null
          place_id?: string | null
          price_band?: string | null
          price_level?: number
          promotion_approved?: boolean
          published?: boolean
          rating?: number | null
          socials_refreshed_at?: string | null
          specials?: string | null
          sponsored_boost_level?: number
          staff_email?: string | null
          state?: string | null
          supports_group_booking?: boolean
          supports_in_app_booking?: boolean
          supports_in_app_order_ahead?: boolean
          supports_instant_confirm?: boolean
          supports_live_inventory?: boolean
          supports_pos_sync?: boolean
          tags?: string[]
          tiktok_handle?: string | null
          tiktok_hashtags?: string[]
          tiktok_location_tag?: string | null
          tiktok_thumbnails?: string[]
          tiktok_url?: string | null
          trending_refreshed_at?: string | null
          trending_score?: number
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
      activate_boost: {
        Args: {
          _duration: string
          _sku: string
          _target_id: string
          _target_type: string
          _tier: string
        }
        Returns: undefined
      }
      admin_pin_status: {
        Args: never
        Returns: {
          has_pin: boolean
          locked: boolean
          locked_until: string
        }[]
      }
      award_confetti_pts: {
        Args: { _amount: number; _reason: string; _ref?: string; _user: string }
        Returns: undefined
      }
      blocked_place_ids_for_city: {
        Args: { _city: string }
        Returns: {
          place_id: string
        }[]
      }
      cities_served_summary: {
        Args: never
        Returns: {
          cities_served: number
          last_updated: string
          top_cities: Json
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
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_agent_errors: { Args: { agent_id: string }; Returns: undefined }
      increment_agent_tasks: { Args: { agent_id: string }; Returns: undefined }
      is_corp_admin: {
        Args: { _company: string; _user: string }
        Returns: boolean
      }
      is_corp_member: {
        Args: { _company: string; _user: string }
        Returns: boolean
      }
      is_corp_team_manager: {
        Args: { _team: string; _user: string }
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
      set_admin_pin: { Args: { _new_pin: string }; Returns: boolean }
      verify_admin_pin: { Args: { _pin: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "customer" | "business_owner"
      corporate_member_role: "owner" | "admin" | "manager" | "member"
      corporate_outing_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "booked"
        | "completed"
        | "cancelled"
      oauth_submission_status: "pending" | "approved" | "rejected"
      promoter_job_status:
        | "draft"
        | "offered"
        | "accepted"
        | "funded"
        | "in_progress"
        | "delivered"
        | "verified"
        | "paid"
        | "cancelled"
        | "refunded"
        | "disputed"
      promoter_payout_status:
        | "pending"
        | "processing"
        | "paid"
        | "failed"
        | "reversed"
      promoter_status: "pending" | "approved" | "suspended" | "rejected"
      promoter_submission_status:
        | "pending"
        | "approved"
        | "rejected"
        | "needs_revision"
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
      app_role: ["admin", "customer", "business_owner"],
      corporate_member_role: ["owner", "admin", "manager", "member"],
      corporate_outing_status: [
        "draft",
        "pending_approval",
        "approved",
        "booked",
        "completed",
        "cancelled",
      ],
      oauth_submission_status: ["pending", "approved", "rejected"],
      promoter_job_status: [
        "draft",
        "offered",
        "accepted",
        "funded",
        "in_progress",
        "delivered",
        "verified",
        "paid",
        "cancelled",
        "refunded",
        "disputed",
      ],
      promoter_payout_status: [
        "pending",
        "processing",
        "paid",
        "failed",
        "reversed",
      ],
      promoter_status: ["pending", "approved", "suspended", "rejected"],
      promoter_submission_status: [
        "pending",
        "approved",
        "rejected",
        "needs_revision",
      ],
    },
  },
} as const
