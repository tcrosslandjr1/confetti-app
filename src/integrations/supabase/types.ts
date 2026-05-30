export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string;
          description: string | null;
          id: string;
          name: string;
          progress: number;
          target: number;
          unlocked_at: string | null;
          user_id: string;
        };
        Insert: {
          code: string;
          description?: string | null;
          id?: string;
          name: string;
          progress?: number;
          target?: number;
          unlocked_at?: string | null;
          user_id: string;
        };
        Update: {
          code?: string;
          description?: string | null;
          id?: string;
          name?: string;
          progress?: number;
          target?: number;
          unlocked_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ad_campaigns: {
        Row: {
          admin_note: string | null;
          advertiser_id: string;
          blurb: string | null;
          category: string | null;
          city: string | null;
          created_at: string;
          cta_label: string | null;
          cta_url: string | null;
          headline: string;
          id: string;
          image_url: string | null;
          package_tier: string;
          placement: string;
          runs_from: string | null;
          runs_until: string | null;
          status: string;
          updated_at: string;
          venue_id: string | null;
        };
        Insert: {
          admin_note?: string | null;
          advertiser_id: string;
          blurb?: string | null;
          category?: string | null;
          city?: string | null;
          created_at?: string;
          cta_label?: string | null;
          cta_url?: string | null;
          headline: string;
          id?: string;
          image_url?: string | null;
          package_tier?: string;
          placement?: string;
          runs_from?: string | null;
          runs_until?: string | null;
          status?: string;
          updated_at?: string;
          venue_id?: string | null;
        };
        Update: {
          admin_note?: string | null;
          advertiser_id?: string;
          blurb?: string | null;
          category?: string | null;
          city?: string | null;
          created_at?: string;
          cta_label?: string | null;
          cta_url?: string | null;
          headline?: string;
          id?: string;
          image_url?: string | null;
          package_tier?: string;
          placement?: string;
          runs_from?: string | null;
          runs_until?: string | null;
          status?: string;
          updated_at?: string;
          venue_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_advertiser_id_fkey";
            columns: ["advertiser_id"];
            isOneToOne: false;
            referencedRelation: "advertisers";
            referencedColumns: ["id"];
          },
        ];
      };
      ad_events: {
        Row: {
          brand: string | null;
          campaign_id: string;
          created_at: string;
          id: string;
          kind: string;
          surface: string | null;
          user_id: string | null;
        };
        Insert: {
          brand?: string | null;
          campaign_id: string;
          created_at?: string;
          id?: string;
          kind: string;
          surface?: string | null;
          user_id?: string | null;
        };
        Update: {
          brand?: string | null;
          campaign_id?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          surface?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ad_events_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "ad_campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_activity_log: {
        Row: {
          action: string;
          actor_user_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          ip_address: unknown;
          metadata: Json;
          severity: string;
          target_user_id: string | null;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          ip_address?: unknown;
          metadata?: Json;
          severity?: string;
          target_user_id?: string | null;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          ip_address?: unknown;
          metadata?: Json;
          severity?: string;
          target_user_id?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "admin_activity_log_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_activity_log_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_alert_digests: {
        Row: {
          critical_count: number;
          generated_at: string;
          high_count: number;
          id: string;
          info_count: number;
          low_count: number;
          medium_count: number;
          new_since_last: number;
          overdue_items: Json;
          period: string;
          resolved_since_last: number;
          summary: string;
          top_items: Json;
        };
        Insert: {
          critical_count?: number;
          generated_at?: string;
          high_count?: number;
          id?: string;
          info_count?: number;
          low_count?: number;
          medium_count?: number;
          new_since_last?: number;
          overdue_items?: Json;
          period: string;
          resolved_since_last?: number;
          summary: string;
          top_items?: Json;
        };
        Update: {
          critical_count?: number;
          generated_at?: string;
          high_count?: number;
          id?: string;
          info_count?: number;
          low_count?: number;
          medium_count?: number;
          new_since_last?: number;
          overdue_items?: Json;
          period?: string;
          resolved_since_last?: number;
          summary?: string;
          top_items?: Json;
        };
        Relationships: [];
      };
      admin_alerts: {
        Row: {
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          action_data: Json | null;
          action_required: boolean;
          action_url: string | null;
          auto_resolve_at: string | null;
          bundle_count: number;
          bundle_key: string | null;
          category: string;
          created_at: string;
          deadline_at: string | null;
          description: string;
          dismiss_reason: string | null;
          id: string;
          metadata: Json;
          priority: string;
          resolved_note: string | null;
          snoozed_until: string | null;
          source: string;
          source_id: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          action_data?: Json | null;
          action_required?: boolean;
          action_url?: string | null;
          auto_resolve_at?: string | null;
          bundle_count?: number;
          bundle_key?: string | null;
          category: string;
          created_at?: string;
          deadline_at?: string | null;
          description?: string;
          dismiss_reason?: string | null;
          id?: string;
          metadata?: Json;
          priority?: string;
          resolved_note?: string | null;
          snoozed_until?: string | null;
          source: string;
          source_id?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          action_data?: Json | null;
          action_required?: boolean;
          action_url?: string | null;
          auto_resolve_at?: string | null;
          bundle_count?: number;
          bundle_key?: string | null;
          category?: string;
          created_at?: string;
          deadline_at?: string | null;
          description?: string;
          dismiss_reason?: string | null;
          id?: string;
          metadata?: Json;
          priority?: string;
          resolved_note?: string | null;
          snoozed_until?: string | null;
          source?: string;
          source_id?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_alerts_acknowledged_by_fkey";
            columns: ["acknowledged_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
        ];
      };
      admin_users: {
        Row: {
          created_at: string;
          invited_by: string | null;
          last_seen_at: string | null;
          risk_level: string;
          role: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          invited_by?: string | null;
          last_seen_at?: string | null;
          risk_level?: string;
          role?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          invited_by?: string | null;
          last_seen_at?: string | null;
          risk_level?: string;
          role?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_users_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_users_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      advertiser_subscriptions: {
        Row: {
          advertiser_id: string;
          created_at: string;
          current_period_end: string | null;
          id: string;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stub: boolean;
          tier: string;
          updated_at: string;
        };
        Insert: {
          advertiser_id: string;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stub?: boolean;
          tier?: string;
          updated_at?: string;
        };
        Update: {
          advertiser_id?: string;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stub?: boolean;
          tier?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      advertisers: {
        Row: {
          business_name: string;
          category: string | null;
          city: string | null;
          contact_email: string;
          contact_phone: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          owner_id: string;
          status: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          business_name: string;
          category?: string | null;
          city?: string | null;
          contact_email: string;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          owner_id: string;
          status?: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          business_name?: string;
          category?: string | null;
          city?: string | null;
          contact_email?: string;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          owner_id?: string;
          status?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      agent_messages: {
        Row: {
          body: string | null;
          created_at: string;
          from_agent: string;
          id: string;
          metadata: Json | null;
          msg_type: Database["public"]["Enums"]["agent_msg_type"];
          read: boolean;
          subject: string;
          to_agent: string | null;
          to_team: string | null;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          from_agent: string;
          id?: string;
          metadata?: Json | null;
          msg_type?: Database["public"]["Enums"]["agent_msg_type"];
          read?: boolean;
          subject: string;
          to_agent?: string | null;
          to_team?: string | null;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          from_agent?: string;
          id?: string;
          metadata?: Json | null;
          msg_type?: Database["public"]["Enums"]["agent_msg_type"];
          read?: boolean;
          subject?: string;
          to_agent?: string | null;
          to_team?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agent_messages_from_agent_fkey";
            columns: ["from_agent"];
            isOneToOne: false;
            referencedRelation: "agent_registry";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_messages_to_agent_fkey";
            columns: ["to_agent"];
            isOneToOne: false;
            referencedRelation: "agent_registry";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_messages_to_team_fkey";
            columns: ["to_team"];
            isOneToOne: false;
            referencedRelation: "agent_teams";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_registry: {
        Row: {
          created_at: string;
          description: string | null;
          error_count: number;
          file_path: string | null;
          id: string;
          last_active: string | null;
          last_task: string | null;
          layer: Database["public"]["Enums"]["agent_layer"];
          name: string;
          status: Database["public"]["Enums"]["agent_status"];
          tasks_completed: number;
          team_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          error_count?: number;
          file_path?: string | null;
          id: string;
          last_active?: string | null;
          last_task?: string | null;
          layer?: Database["public"]["Enums"]["agent_layer"];
          name: string;
          status?: Database["public"]["Enums"]["agent_status"];
          tasks_completed?: number;
          team_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          error_count?: number;
          file_path?: string | null;
          id?: string;
          last_active?: string | null;
          last_task?: string | null;
          layer?: Database["public"]["Enums"]["agent_layer"];
          name?: string;
          status?: Database["public"]["Enums"]["agent_status"];
          tasks_completed?: number;
          team_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_registry_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "agent_teams";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_run_log: {
        Row: {
          completed_at: string | null;
          created_at: string;
          error_message: string | null;
          id: string;
          pipeline_type: string;
          session_id: string | null;
          status: string;
          steps: Json;
          total_latency_ms: number;
          total_tokens: number;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          pipeline_type?: string;
          session_id?: string | null;
          status?: string;
          steps?: Json;
          total_latency_ms?: number;
          total_tokens?: number;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          pipeline_type?: string;
          session_id?: string | null;
          status?: string;
          steps?: Json;
          total_latency_ms?: number;
          total_tokens?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_run_log_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "agent_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_run_log_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_sessions: {
        Row: {
          agent_type: string;
          context: Json;
          created_at: string;
          id: string;
          messages: Json;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          agent_type?: string;
          context?: Json;
          created_at?: string;
          id?: string;
          messages?: Json;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          agent_type?: string;
          context?: Json;
          created_at?: string;
          id?: string;
          messages?: Json;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_tasks: {
        Row: {
          assigned_to: string | null;
          completed_at: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          due_at: string | null;
          id: string;
          metadata: Json | null;
          priority: Database["public"]["Enums"]["agent_task_priority"];
          status: Database["public"]["Enums"]["agent_task_status"];
          team_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          metadata?: Json | null;
          priority?: Database["public"]["Enums"]["agent_task_priority"];
          status?: Database["public"]["Enums"]["agent_task_status"];
          team_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          metadata?: Json | null;
          priority?: Database["public"]["Enums"]["agent_task_priority"];
          status?: Database["public"]["Enums"]["agent_task_status"];
          team_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_tasks_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "agent_registry";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "agent_registry";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_tasks_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "agent_teams";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_teams: {
        Row: {
          color: string;
          created_at: string;
          description: string | null;
          icon: string;
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          color?: string;
          created_at?: string;
          description?: string | null;
          icon?: string;
          id: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          color?: string;
          created_at?: string;
          description?: string | null;
          icon?: string;
          id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      ai_generation_log: {
        Row: {
          created_at: string;
          id: string;
          latency_ms: number | null;
          model: string | null;
          prompt: string;
          response_summary: string | null;
          token_count: number | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          latency_ms?: number | null;
          model?: string | null;
          prompt: string;
          response_summary?: string | null;
          token_count?: number | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          latency_ms?: number | null;
          model?: string | null;
          prompt?: string;
          response_summary?: string | null;
          token_count?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_generation_log_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      attribution_events: {
        Row: {
          city_code: string | null;
          confetti_referral_code: string | null;
          created_at: string;
          dwell_minutes: number | null;
          from_itinerary: boolean;
          id: string;
          itinerary_id: string | null;
          method: string;
          party_size: number | null;
          share_platform: string | null;
          shared_to_social: boolean;
          spend_tier: string | null;
          stop_id: string | null;
          user_id: string | null;
          venue_id: string;
          venue_name: string | null;
        };
        Insert: {
          city_code?: string | null;
          confetti_referral_code?: string | null;
          created_at?: string;
          dwell_minutes?: number | null;
          from_itinerary?: boolean;
          id?: string;
          itinerary_id?: string | null;
          method?: string;
          party_size?: number | null;
          share_platform?: string | null;
          shared_to_social?: boolean;
          spend_tier?: string | null;
          stop_id?: string | null;
          user_id?: string | null;
          venue_id: string;
          venue_name?: string | null;
        };
        Update: {
          city_code?: string | null;
          confetti_referral_code?: string | null;
          created_at?: string;
          dwell_minutes?: number | null;
          from_itinerary?: boolean;
          id?: string;
          itinerary_id?: string | null;
          method?: string;
          party_size?: number | null;
          share_platform?: string | null;
          shared_to_social?: boolean;
          spend_tier?: string | null;
          stop_id?: string | null;
          user_id?: string | null;
          venue_id?: string;
          venue_name?: string | null;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          booking_time: string;
          confirmation_code: string;
          created_at: string;
          id: string;
          itinerary_id: string | null;
          party_size: number;
          special_requests: string | null;
          status: string;
          user_id: string;
          venue_id: string | null;
        };
        Insert: {
          booking_time: string;
          confirmation_code: string;
          created_at?: string;
          id?: string;
          itinerary_id?: string | null;
          party_size?: number;
          special_requests?: string | null;
          status?: string;
          user_id: string;
          venue_id?: string | null;
        };
        Update: {
          booking_time?: string;
          confirmation_code?: string;
          created_at?: string;
          id?: string;
          itinerary_id?: string | null;
          party_size?: number;
          special_requests?: string | null;
          status?: string;
          user_id?: string;
          venue_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_itinerary_id_fkey";
            columns: ["itinerary_id"];
            isOneToOne: false;
            referencedRelation: "itineraries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      boost_campaigns: {
        Row: {
          boost_strength: number;
          business_id: string;
          check_ins: number;
          click_throughs: number;
          coupon_id: string | null;
          created_at: string | null;
          daily_credit_budget: number;
          end_date: string | null;
          id: string;
          impressions: number;
          name: string;
          start_date: string;
          status: string;
          target_categories: string[] | null;
          target_cities: string[] | null;
          target_occasions: string[] | null;
          target_price_range: string | null;
          target_vibes: string[] | null;
          total_credits_spent: number;
          venue_id: string;
        };
        Insert: {
          boost_strength?: number;
          business_id: string;
          check_ins?: number;
          click_throughs?: number;
          coupon_id?: string | null;
          created_at?: string | null;
          daily_credit_budget?: number;
          end_date?: string | null;
          id: string;
          impressions?: number;
          name: string;
          start_date?: string;
          status?: string;
          target_categories?: string[] | null;
          target_cities?: string[] | null;
          target_occasions?: string[] | null;
          target_price_range?: string | null;
          target_vibes?: string[] | null;
          total_credits_spent?: number;
          venue_id: string;
        };
        Update: {
          boost_strength?: number;
          business_id?: string;
          check_ins?: number;
          click_throughs?: number;
          coupon_id?: string | null;
          created_at?: string | null;
          daily_credit_budget?: number;
          end_date?: string | null;
          id?: string;
          impressions?: number;
          name?: string;
          start_date?: string;
          status?: string;
          target_categories?: string[] | null;
          target_cities?: string[] | null;
          target_occasions?: string[] | null;
          target_price_range?: string | null;
          target_vibes?: string[] | null;
          total_credits_spent?: number;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "boost_campaigns_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "business_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_boost_campaigns_coupon";
            columns: ["coupon_id"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["id"];
          },
        ];
      };
      business_accounts: {
        Row: {
          business_name: string;
          city: string;
          contact_email: string;
          contact_name: string;
          credit_balance: number;
          id: string;
          is_active: boolean | null;
          joined_at: string | null;
          logo_url: string | null;
          owner_user_id: string | null;
          phone: string | null;
          state: string | null;
          tier: string;
          total_credits_used: number;
          venue_ids: string[] | null;
          website: string | null;
        };
        Insert: {
          business_name: string;
          city: string;
          contact_email: string;
          contact_name: string;
          credit_balance?: number;
          id: string;
          is_active?: boolean | null;
          joined_at?: string | null;
          logo_url?: string | null;
          owner_user_id?: string | null;
          phone?: string | null;
          state?: string | null;
          tier?: string;
          total_credits_used?: number;
          venue_ids?: string[] | null;
          website?: string | null;
        };
        Update: {
          business_name?: string;
          city?: string;
          contact_email?: string;
          contact_name?: string;
          credit_balance?: number;
          id?: string;
          is_active?: boolean | null;
          joined_at?: string | null;
          logo_url?: string | null;
          owner_user_id?: string | null;
          phone?: string | null;
          state?: string | null;
          tier?: string;
          total_credits_used?: number;
          venue_ids?: string[] | null;
          website?: string | null;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          metadata: Json;
          role: string;
          room_type: string;
          user_id: string | null;
          venue_id: string | null;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          role: string;
          room_type?: string;
          user_id?: string | null;
          venue_id?: string | null;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          role?: string;
          room_type?: string;
          user_id?: string | null;
          venue_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      circuit_breakers: {
        Row: {
          cooldown_seconds: number;
          created_at: string;
          failure_count: number;
          failure_threshold: number;
          id: string;
          last_failure_at: string | null;
          opened_at: string | null;
          service_name: string;
          status: string;
        };
        Insert: {
          cooldown_seconds?: number;
          created_at?: string;
          failure_count?: number;
          failure_threshold?: number;
          id?: string;
          last_failure_at?: string | null;
          opened_at?: string | null;
          service_name: string;
          status?: string;
        };
        Update: {
          cooldown_seconds?: number;
          created_at?: string;
          failure_count?: number;
          failure_threshold?: number;
          id?: string;
          last_failure_at?: string | null;
          opened_at?: string | null;
          service_name?: string;
          status?: string;
        };
        Relationships: [];
      };
      city_waitlist: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          source: string | null;
          updated_at: string;
          voted_city: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          source?: string | null;
          updated_at?: string;
          voted_city?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          source?: string | null;
          updated_at?: string;
          voted_city?: string | null;
        };
        Relationships: [];
      };
      compliance_audits: {
        Row: {
          check_date: string;
          created_at: string;
          findings: Json;
          framework: string;
          id: string;
          status: string;
        };
        Insert: {
          check_date?: string;
          created_at?: string;
          findings?: Json;
          framework: string;
          id?: string;
          status?: string;
        };
        Update: {
          check_date?: string;
          created_at?: string;
          findings?: Json;
          framework?: string;
          id?: string;
          status?: string;
        };
        Relationships: [];
      };
      confetti_fund: {
        Row: {
          balance: number;
          created_at: string | null;
          id: string;
          last_deposit_at: string | null;
          total_deposited: number;
          total_disbursed: number;
          total_transactions: number;
        };
        Insert: {
          balance?: number;
          created_at?: string | null;
          id: string;
          last_deposit_at?: string | null;
          total_deposited?: number;
          total_disbursed?: number;
          total_transactions?: number;
        };
        Update: {
          balance?: number;
          created_at?: string | null;
          id?: string;
          last_deposit_at?: string | null;
          total_deposited?: number;
          total_disbursed?: number;
          total_transactions?: number;
        };
        Relationships: [];
      };
      consent_audit_log: {
        Row: {
          agent_name: string | null;
          app_version: string | null;
          category_key: string | null;
          created_at: string;
          details: Json;
          device_id: string | null;
          event_type: string;
          id: string;
          ip_hash: string | null;
          os_info: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          agent_name?: string | null;
          app_version?: string | null;
          category_key?: string | null;
          created_at?: string;
          details?: Json;
          device_id?: string | null;
          event_type: string;
          id?: string;
          ip_hash?: string | null;
          os_info?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          agent_name?: string | null;
          app_version?: string | null;
          category_key?: string | null;
          created_at?: string;
          details?: Json;
          device_id?: string | null;
          event_type?: string;
          id?: string;
          ip_hash?: string | null;
          os_info?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      consent_categories: {
        Row: {
          category_key: string;
          created_at: string;
          description: string;
          display_name: string;
          gdpr_article: string | null;
          id: string;
          is_required: boolean;
          is_special_category: boolean;
          legal_basis: string;
          max_prompts_per_session: number | null;
          sort_order: number;
          withdrawal_consequence: string | null;
        };
        Insert: {
          category_key: string;
          created_at?: string;
          description: string;
          display_name: string;
          gdpr_article?: string | null;
          id?: string;
          is_required?: boolean;
          is_special_category?: boolean;
          legal_basis: string;
          max_prompts_per_session?: number | null;
          sort_order?: number;
          withdrawal_consequence?: string | null;
        };
        Update: {
          category_key?: string;
          created_at?: string;
          description?: string;
          display_name?: string;
          gdpr_article?: string | null;
          id?: string;
          is_required?: boolean;
          is_special_category?: boolean;
          legal_basis?: string;
          max_prompts_per_session?: number | null;
          sort_order?: number;
          withdrawal_consequence?: string | null;
        };
        Relationships: [];
      };
      consent_history: {
        Row: {
          category_key: string;
          created_at: string;
          device_id: string | null;
          event_type: string;
          id: string;
          ip_hash: string | null;
          metadata: Json | null;
          method: string | null;
          new_version: string | null;
          old_version: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          category_key: string;
          created_at?: string;
          device_id?: string | null;
          event_type: string;
          id?: string;
          ip_hash?: string | null;
          metadata?: Json | null;
          method?: string | null;
          new_version?: string | null;
          old_version?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          category_key?: string;
          created_at?: string;
          device_id?: string | null;
          event_type?: string;
          id?: string;
          ip_hash?: string | null;
          metadata?: Json | null;
          method?: string | null;
          new_version?: string | null;
          old_version?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      consent_records: {
        Row: {
          category_key: string;
          device_id: string | null;
          expires_at: string | null;
          granted: boolean;
          granted_at: string | null;
          id: string;
          ip_hash: string | null;
          method: string;
          session_id: string | null;
          updated_at: string;
          user_agent: string | null;
          user_id: string;
          version: string;
          withdrawn_at: string | null;
        };
        Insert: {
          category_key: string;
          device_id?: string | null;
          expires_at?: string | null;
          granted?: boolean;
          granted_at?: string | null;
          id?: string;
          ip_hash?: string | null;
          method: string;
          session_id?: string | null;
          updated_at?: string;
          user_agent?: string | null;
          user_id: string;
          version: string;
          withdrawn_at?: string | null;
        };
        Update: {
          category_key?: string;
          device_id?: string | null;
          expires_at?: string | null;
          granted?: boolean;
          granted_at?: string | null;
          id?: string;
          ip_hash?: string | null;
          method?: string;
          session_id?: string | null;
          updated_at?: string;
          user_agent?: string | null;
          user_id?: string;
          version?: string;
          withdrawn_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "consent_records_category_key_fkey";
            columns: ["category_key"];
            isOneToOne: false;
            referencedRelation: "consent_categories";
            referencedColumns: ["category_key"];
          },
        ];
      };
      content_items: {
        Row: {
          audience: string[];
          body: string;
          created_at: string;
          created_by: string | null;
          cta_text: string | null;
          cta_url: string | null;
          id: string;
          image_url: string | null;
          metrics: Json;
          published_at: string | null;
          rich_body: Json | null;
          scheduled_at: string | null;
          status: string;
          title: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          audience?: string[];
          body?: string;
          created_at?: string;
          created_by?: string | null;
          cta_text?: string | null;
          cta_url?: string | null;
          id?: string;
          image_url?: string | null;
          metrics?: Json;
          published_at?: string | null;
          rich_body?: Json | null;
          scheduled_at?: string | null;
          status?: string;
          title: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          audience?: string[];
          body?: string;
          created_at?: string;
          created_by?: string | null;
          cta_text?: string | null;
          cta_url?: string | null;
          id?: string;
          image_url?: string | null;
          metrics?: Json;
          published_at?: string | null;
          rich_body?: Json | null;
          scheduled_at?: string | null;
          status?: string;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_items_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
        ];
      };
      content_templates: {
        Row: {
          body_template: string;
          created_at: string;
          id: string;
          name: string;
          type: string;
          variables: string[];
        };
        Insert: {
          body_template: string;
          created_at?: string;
          id?: string;
          name: string;
          type: string;
          variables?: string[];
        };
        Update: {
          body_template?: string;
          created_at?: string;
          id?: string;
          name?: string;
          type?: string;
          variables?: string[];
        };
        Relationships: [];
      };
      contract_versions: {
        Row: {
          contract_id: string;
          created_at: string;
          file_name: string;
          file_path: string;
          file_size_bytes: number | null;
          id: string;
          notes: string | null;
          uploaded_by: string | null;
          version_number: number;
        };
        Insert: {
          contract_id: string;
          created_at?: string;
          file_name: string;
          file_path: string;
          file_size_bytes?: number | null;
          id?: string;
          notes?: string | null;
          uploaded_by?: string | null;
          version_number?: number;
        };
        Update: {
          contract_id?: string;
          created_at?: string;
          file_name?: string;
          file_path?: string;
          file_size_bytes?: number | null;
          id?: string;
          notes?: string | null;
          uploaded_by?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "contract_versions_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contract_versions_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
        ];
      };
      contracts: {
        Row: {
          alert_30d_sent: boolean;
          alert_60d_sent: boolean;
          alert_90d_sent: boolean;
          auto_renew: boolean;
          business_id: string | null;
          contract_value: number | null;
          created_at: string;
          created_by: string | null;
          end_date: string | null;
          file_name: string | null;
          file_path: string | null;
          file_size_bytes: number | null;
          file_type: string | null;
          id: string;
          notes: string | null;
          partner_id: string | null;
          payment_terms: string | null;
          renewal_terms: string | null;
          signed_at: string | null;
          signed_by: string | null;
          start_date: string | null;
          status: string;
          tags: string[];
          title: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          alert_30d_sent?: boolean;
          alert_60d_sent?: boolean;
          alert_90d_sent?: boolean;
          auto_renew?: boolean;
          business_id?: string | null;
          contract_value?: number | null;
          created_at?: string;
          created_by?: string | null;
          end_date?: string | null;
          file_name?: string | null;
          file_path?: string | null;
          file_size_bytes?: number | null;
          file_type?: string | null;
          id?: string;
          notes?: string | null;
          partner_id?: string | null;
          payment_terms?: string | null;
          renewal_terms?: string | null;
          signed_at?: string | null;
          signed_by?: string | null;
          start_date?: string | null;
          status?: string;
          tags?: string[];
          title: string;
          type?: string;
          updated_at?: string;
        };
        Update: {
          alert_30d_sent?: boolean;
          alert_60d_sent?: boolean;
          alert_90d_sent?: boolean;
          auto_renew?: boolean;
          business_id?: string | null;
          contract_value?: number | null;
          created_at?: string;
          created_by?: string | null;
          end_date?: string | null;
          file_name?: string | null;
          file_path?: string | null;
          file_size_bytes?: number | null;
          file_type?: string | null;
          id?: string;
          notes?: string | null;
          partner_id?: string | null;
          payment_terms?: string | null;
          renewal_terms?: string | null;
          signed_at?: string | null;
          signed_by?: string | null;
          start_date?: string | null;
          status?: string;
          tags?: string[];
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contracts_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "business_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contracts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "contracts_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partners";
            referencedColumns: ["id"];
          },
        ];
      };
      corporate_bookings: {
        Row: {
          actual_cost: number | null;
          approved_by: string | null;
          company_id: string;
          cost_per_person: number | null;
          created_at: string;
          estimated_cost: number | null;
          id: string;
          notes: string | null;
          party_size: number;
          plan_id: string | null;
          policy_check: Json;
          receipt_url: string | null;
          rejection_reason: string | null;
          requested_by: string;
          scheduled_date: string;
          scheduled_time: string | null;
          status: string;
          team_id: string;
          updated_at: string;
          venue_id: string | null;
        };
        Insert: {
          actual_cost?: number | null;
          approved_by?: string | null;
          company_id: string;
          cost_per_person?: number | null;
          created_at?: string;
          estimated_cost?: number | null;
          id?: string;
          notes?: string | null;
          party_size?: number;
          plan_id?: string | null;
          policy_check?: Json;
          receipt_url?: string | null;
          rejection_reason?: string | null;
          requested_by: string;
          scheduled_date: string;
          scheduled_time?: string | null;
          status?: string;
          team_id: string;
          updated_at?: string;
          venue_id?: string | null;
        };
        Update: {
          actual_cost?: number | null;
          approved_by?: string | null;
          company_id?: string;
          cost_per_person?: number | null;
          created_at?: string;
          estimated_cost?: number | null;
          id?: string;
          notes?: string | null;
          party_size?: number;
          plan_id?: string | null;
          policy_check?: Json;
          receipt_url?: string | null;
          rejection_reason?: string | null;
          requested_by?: string;
          scheduled_date?: string;
          scheduled_time?: string | null;
          status?: string;
          team_id?: string;
          updated_at?: string;
          venue_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "corporate_bookings_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "corporate_bookings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "corporate_companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "corporate_bookings_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "itineraries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "corporate_bookings_requested_by_fkey";
            columns: ["requested_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "corporate_bookings_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "corporate_teams";
            referencedColumns: ["id"];
          },
        ];
      };
      corporate_companies: {
        Row: {
          billing_email: string | null;
          billing_plan: string;
          created_at: string;
          credits_used_this_month: number;
          domain: string | null;
          employee_count: number | null;
          id: string;
          industry: string | null;
          is_active: boolean;
          logo_url: string | null;
          monthly_credit_allowance: number;
          name: string;
          onboarding_completed: boolean;
          onboarding_step: number;
          owner_user_id: string | null;
          policies: Json;
          primary_city: string;
          primary_state: string | null;
          updated_at: string;
        };
        Insert: {
          billing_email?: string | null;
          billing_plan?: string;
          created_at?: string;
          credits_used_this_month?: number;
          domain?: string | null;
          employee_count?: number | null;
          id?: string;
          industry?: string | null;
          is_active?: boolean;
          logo_url?: string | null;
          monthly_credit_allowance?: number;
          name: string;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          owner_user_id?: string | null;
          policies?: Json;
          primary_city: string;
          primary_state?: string | null;
          updated_at?: string;
        };
        Update: {
          billing_email?: string | null;
          billing_plan?: string;
          created_at?: string;
          credits_used_this_month?: number;
          domain?: string | null;
          employee_count?: number | null;
          id?: string;
          industry?: string | null;
          is_active?: boolean;
          logo_url?: string | null;
          monthly_credit_allowance?: number;
          name?: string;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          owner_user_id?: string | null;
          policies?: Json;
          primary_city?: string;
          primary_state?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "corporate_companies_owner_user_id_fkey";
            columns: ["owner_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      corporate_team_members: {
        Row: {
          id: string;
          joined_at: string;
          role: string;
          team_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          joined_at?: string;
          role?: string;
          team_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          joined_at?: string;
          role?: string;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "corporate_team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "corporate_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "corporate_team_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      corporate_teams: {
        Row: {
          approval_required: boolean;
          approver_user_id: string | null;
          budget_per_person: number;
          budget_used_this_month: number;
          company_id: string;
          created_at: string;
          description: string | null;
          id: string;
          member_count: number;
          name: string;
          preferred_cuisines: string[];
          preferred_vibes: string[];
          updated_at: string;
        };
        Insert: {
          approval_required?: boolean;
          approver_user_id?: string | null;
          budget_per_person?: number;
          budget_used_this_month?: number;
          company_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          member_count?: number;
          name: string;
          preferred_cuisines?: string[];
          preferred_vibes?: string[];
          updated_at?: string;
        };
        Update: {
          approval_required?: boolean;
          approver_user_id?: string | null;
          budget_per_person?: number;
          budget_used_this_month?: number;
          company_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          member_count?: number;
          name?: string;
          preferred_cuisines?: string[];
          preferred_vibes?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "corporate_teams_approver_user_id_fkey";
            columns: ["approver_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "corporate_teams_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "corporate_companies";
            referencedColumns: ["id"];
          },
        ];
      };
      coupon_redemptions: {
        Row: {
          coupon_id: string;
          expires_at: string;
          id: string;
          redeemed_at: string | null;
          status: string;
          unlocked_at: string | null;
          user_id: string;
          venue_id: string;
        };
        Insert: {
          coupon_id: string;
          expires_at: string;
          id: string;
          redeemed_at?: string | null;
          status?: string;
          unlocked_at?: string | null;
          user_id: string;
          venue_id: string;
        };
        Update: {
          coupon_id?: string;
          expires_at?: string;
          id?: string;
          redeemed_at?: string | null;
          status?: string;
          unlocked_at?: string | null;
          user_id?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey";
            columns: ["coupon_id"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["id"];
          },
        ];
      };
      coupons: {
        Row: {
          business_id: string;
          campaign_id: string | null;
          created_at: string | null;
          current_redemptions: number;
          description: string;
          expires_at: string | null;
          free_item: string | null;
          id: string;
          is_active: boolean | null;
          max_redemptions: number | null;
          min_spend: number | null;
          title: string;
          type: string;
          value: number;
          venue_id: string;
          visits_required: number;
        };
        Insert: {
          business_id: string;
          campaign_id?: string | null;
          created_at?: string | null;
          current_redemptions?: number;
          description?: string;
          expires_at?: string | null;
          free_item?: string | null;
          id: string;
          is_active?: boolean | null;
          max_redemptions?: number | null;
          min_spend?: number | null;
          title: string;
          type: string;
          value?: number;
          venue_id: string;
          visits_required?: number;
        };
        Update: {
          business_id?: string;
          campaign_id?: string | null;
          created_at?: string | null;
          current_redemptions?: number;
          description?: string;
          expires_at?: string | null;
          free_item?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_redemptions?: number | null;
          min_spend?: number | null;
          title?: string;
          type?: string;
          value?: number;
          venue_id?: string;
          visits_required?: number;
        };
        Relationships: [
          {
            foreignKeyName: "coupons_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "business_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coupons_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "boost_campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      data_requests: {
        Row: {
          admin_notes: string | null;
          ai_draft_response: string | null;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          data_scope: string[];
          deadline: string;
          description: string;
          framework: string;
          id: string;
          processed_at: string | null;
          status: string;
          type: string;
          user_email: string;
          user_id: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          ai_draft_response?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          data_scope?: string[];
          deadline: string;
          description?: string;
          framework?: string;
          id?: string;
          processed_at?: string | null;
          status?: string;
          type: string;
          user_email: string;
          user_id?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          ai_draft_response?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          data_scope?: string[];
          deadline?: string;
          description?: string;
          framework?: string;
          id?: string;
          processed_at?: string | null;
          status?: string;
          type?: string;
          user_email?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "data_requests_completed_by_fkey";
            columns: ["completed_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "data_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      data_subject_requests: {
        Row: {
          acknowledged_at: string | null;
          completed_at: string | null;
          created_at: string;
          deadline_at: string;
          denial_reason: string | null;
          export_url: string | null;
          id: string;
          metadata: Json | null;
          notes: string | null;
          received_at: string;
          request_type: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          deadline_at: string;
          denial_reason?: string | null;
          export_url?: string | null;
          id?: string;
          metadata?: Json | null;
          notes?: string | null;
          received_at?: string;
          request_type: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          acknowledged_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          deadline_at?: string;
          denial_reason?: string | null;
          export_url?: string | null;
          id?: string;
          metadata?: Json | null;
          notes?: string | null;
          received_at?: string;
          request_type?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      discovered_events: {
        Row: {
          cached_at: string;
          city: string;
          date_key: string;
          events: Json;
          id: string;
          search_context: string | null;
          vibes_summary: string | null;
        };
        Insert: {
          cached_at?: string;
          city: string;
          date_key: string;
          events?: Json;
          id?: string;
          search_context?: string | null;
          vibes_summary?: string | null;
        };
        Update: {
          cached_at?: string;
          city?: string;
          date_key?: string;
          events?: Json;
          id?: string;
          search_context?: string | null;
          vibes_summary?: string | null;
        };
        Relationships: [];
      };
      dmca_notices: {
        Row: {
          ai_analysis: string | null;
          claimant_email: string;
          claimant_name: string;
          content_url: string;
          created_at: string;
          description: string;
          id: string;
          original_work_url: string | null;
          status: string;
        };
        Insert: {
          ai_analysis?: string | null;
          claimant_email: string;
          claimant_name: string;
          content_url: string;
          created_at?: string;
          description: string;
          id?: string;
          original_work_url?: string | null;
          status?: string;
        };
        Update: {
          ai_analysis?: string | null;
          claimant_email?: string;
          claimant_name?: string;
          content_url?: string;
          created_at?: string;
          description?: string;
          id?: string;
          original_work_url?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      dmv_neighborhoods: {
        Row: {
          created_at: string;
          id: string;
          lat_center: number | null;
          lng_center: number | null;
          metro_access: boolean | null;
          metro_area: string;
          metro_lines: string[] | null;
          name: string;
          parking_ease: number | null;
          peak_days: string[] | null;
          slug: string;
          vibe_summary: string | null;
          walkability: number | null;
          zone_label: string | null;
        };
        Insert: {
          created_at?: string;
          id: string;
          lat_center?: number | null;
          lng_center?: number | null;
          metro_access?: boolean | null;
          metro_area: string;
          metro_lines?: string[] | null;
          name: string;
          parking_ease?: number | null;
          peak_days?: string[] | null;
          slug: string;
          vibe_summary?: string | null;
          walkability?: number | null;
          zone_label?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          lat_center?: number | null;
          lng_center?: number | null;
          metro_access?: boolean | null;
          metro_area?: string;
          metro_lines?: string[] | null;
          name?: string;
          parking_ease?: number | null;
          peak_days?: string[] | null;
          slug?: string;
          vibe_summary?: string | null;
          walkability?: number | null;
          zone_label?: string | null;
        };
        Relationships: [];
      };
      document_consent_map: {
        Row: {
          category_key: string;
          created_at: string;
          document_key: string;
          id: string;
          is_primary: boolean;
        };
        Insert: {
          category_key: string;
          created_at?: string;
          document_key: string;
          id?: string;
          is_primary?: boolean;
        };
        Update: {
          category_key?: string;
          created_at?: string;
          document_key?: string;
          id?: string;
          is_primary?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "document_consent_map_category_key_fkey";
            columns: ["category_key"];
            isOneToOne: false;
            referencedRelation: "consent_categories";
            referencedColumns: ["category_key"];
          },
        ];
      };
      document_versions: {
        Row: {
          category: string;
          created_at: string;
          document_key: string;
          document_name: string;
          document_url: string | null;
          effective_date: string;
          id: string;
          is_current: boolean;
          summary: string | null;
          version: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          document_key: string;
          document_name: string;
          document_url?: string | null;
          effective_date: string;
          id?: string;
          is_current?: boolean;
          summary?: string | null;
          version: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          document_key?: string;
          document_name?: string;
          document_url?: string | null;
          effective_date?: string;
          id?: string;
          is_current?: boolean;
          summary?: string | null;
          version?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          business_id: string | null;
          category: string;
          contract_id: string | null;
          created_at: string;
          description: string | null;
          file_name: string;
          file_path: string;
          file_size_bytes: number | null;
          file_type: string | null;
          id: string;
          partner_id: string | null;
          tags: string[];
          title: string;
          uploaded_by: string | null;
        };
        Insert: {
          business_id?: string | null;
          category?: string;
          contract_id?: string | null;
          created_at?: string;
          description?: string | null;
          file_name: string;
          file_path: string;
          file_size_bytes?: number | null;
          file_type?: string | null;
          id?: string;
          partner_id?: string | null;
          tags?: string[];
          title: string;
          uploaded_by?: string | null;
        };
        Update: {
          business_id?: string | null;
          category?: string;
          contract_id?: string | null;
          created_at?: string;
          description?: string | null;
          file_name?: string;
          file_path?: string;
          file_size_bytes?: number | null;
          file_type?: string | null;
          id?: string;
          partner_id?: string | null;
          tags?: string[];
          title?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "documents_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "business_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partners";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
        ];
      };
      emergency_bans: {
        Row: {
          appeal_status: string | null;
          banned_at: string;
          banned_by: string | null;
          expires_at: string | null;
          id: string;
          is_permanent: boolean;
          reason: string;
          user_id: string;
        };
        Insert: {
          appeal_status?: string | null;
          banned_at?: string;
          banned_by?: string | null;
          expires_at?: string | null;
          id?: string;
          is_permanent?: boolean;
          reason: string;
          user_id: string;
        };
        Update: {
          appeal_status?: string | null;
          banned_at?: string;
          banned_by?: string | null;
          expires_at?: string | null;
          id?: string;
          is_permanent?: boolean;
          reason?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "emergency_bans_banned_by_fkey";
            columns: ["banned_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "emergency_bans_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      esign_records: {
        Row: {
          created_at: string;
          document_key: string;
          document_version: string;
          envelope_id: string | null;
          id: string;
          ip_address_hash: string | null;
          metadata: Json | null;
          pdf_url: string | null;
          sent_at: string | null;
          signature_hash: string | null;
          signed_at: string | null;
          signer_company: string | null;
          signer_email: string;
          signer_name: string;
          signer_type: string;
          status: string;
          updated_at: string;
          viewed_at: string | null;
        };
        Insert: {
          created_at?: string;
          document_key: string;
          document_version: string;
          envelope_id?: string | null;
          id?: string;
          ip_address_hash?: string | null;
          metadata?: Json | null;
          pdf_url?: string | null;
          sent_at?: string | null;
          signature_hash?: string | null;
          signed_at?: string | null;
          signer_company?: string | null;
          signer_email: string;
          signer_name: string;
          signer_type: string;
          status?: string;
          updated_at?: string;
          viewed_at?: string | null;
        };
        Update: {
          created_at?: string;
          document_key?: string;
          document_version?: string;
          envelope_id?: string | null;
          id?: string;
          ip_address_hash?: string | null;
          metadata?: Json | null;
          pdf_url?: string | null;
          sent_at?: string | null;
          signature_hash?: string | null;
          signed_at?: string | null;
          signer_company?: string | null;
          signer_email?: string;
          signer_name?: string;
          signer_type?: string;
          status?: string;
          updated_at?: string;
          viewed_at?: string | null;
        };
        Relationships: [];
      };
      events: {
        Row: {
          boost_campaign_id: string | null;
          capacity: number | null;
          cover_image_url: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          end_time: string | null;
          event_type: string;
          id: string;
          is_boosted: boolean;
          is_featured: boolean;
          price_max: number | null;
          price_min: number | null;
          recurring_rule: Json | null;
          rsvp_count: number;
          start_time: string;
          status: string;
          tags: string[];
          ticket_url: string | null;
          title: string;
          updated_at: string;
          venue_id: string;
          vibe_tags: string[];
        };
        Insert: {
          boost_campaign_id?: string | null;
          capacity?: number | null;
          cover_image_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          end_time?: string | null;
          event_type?: string;
          id?: string;
          is_boosted?: boolean;
          is_featured?: boolean;
          price_max?: number | null;
          price_min?: number | null;
          recurring_rule?: Json | null;
          rsvp_count?: number;
          start_time: string;
          status?: string;
          tags?: string[];
          ticket_url?: string | null;
          title: string;
          updated_at?: string;
          venue_id: string;
          vibe_tags?: string[];
        };
        Update: {
          boost_campaign_id?: string | null;
          capacity?: number | null;
          cover_image_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          end_time?: string | null;
          event_type?: string;
          id?: string;
          is_boosted?: boolean;
          is_featured?: boolean;
          price_max?: number | null;
          price_min?: number | null;
          recurring_rule?: Json | null;
          rsvp_count?: number;
          start_time?: string;
          status?: string;
          tags?: string[];
          ticket_url?: string | null;
          title?: string;
          updated_at?: string;
          venue_id?: string;
          vibe_tags?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "events_boost_campaign_id_fkey";
            columns: ["boost_campaign_id"];
            isOneToOne: false;
            referencedRelation: "boost_campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      experience_reviews: {
        Row: {
          body: string | null;
          created_at: string;
          highlight: string | null;
          id: string;
          overall_rating: number;
          photos: Json;
          plan_id: string;
          review_type: string;
          stop_ratings: Json;
          stops_visited: number | null;
          title: string | null;
          total_time_spent: number | null;
          user_avatar: string | null;
          user_id: string;
          user_name: string;
          user_tier: string;
          visited_at: string | null;
          would_recommend: boolean;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          highlight?: string | null;
          id?: string;
          overall_rating: number;
          photos?: Json;
          plan_id: string;
          review_type?: string;
          stop_ratings?: Json;
          stops_visited?: number | null;
          title?: string | null;
          total_time_spent?: number | null;
          user_avatar?: string | null;
          user_id: string;
          user_name: string;
          user_tier?: string;
          visited_at?: string | null;
          would_recommend?: boolean;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          highlight?: string | null;
          id?: string;
          overall_rating?: number;
          photos?: Json;
          plan_id?: string;
          review_type?: string;
          stop_ratings?: Json;
          stops_visited?: number | null;
          title?: string | null;
          total_time_spent?: number | null;
          user_avatar?: string | null;
          user_id?: string;
          user_name?: string;
          user_tier?: string;
          visited_at?: string | null;
          would_recommend?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "experience_reviews_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "shared_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "experience_reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      facebook_oauth_states: {
        Row: {
          consumed_at: string | null;
          created_at: string | null;
          expires_at: string;
          id: string;
          redirect_to: string | null;
          state: string;
          user_id: string;
        };
        Insert: {
          consumed_at?: string | null;
          created_at?: string | null;
          expires_at: string;
          id?: string;
          redirect_to?: string | null;
          state: string;
          user_id: string;
        };
        Update: {
          consumed_at?: string | null;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          redirect_to?: string | null;
          state?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      favorite_stops: {
        Row: {
          address: string | null;
          created_at: string;
          id: string;
          neighborhood: string | null;
          notes: string | null;
          tone: string | null;
          user_id: string;
          venue_name: string;
          vibe: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          id?: string;
          neighborhood?: string | null;
          notes?: string | null;
          tone?: string | null;
          user_id: string;
          venue_name: string;
          vibe?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          id?: string;
          neighborhood?: string | null;
          notes?: string | null;
          tone?: string | null;
          user_id?: string;
          venue_name?: string;
          vibe?: string | null;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          created_at: string;
          id: string;
          user_id: string;
          venue_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          user_id: string;
          venue_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          user_id?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      feature_flag_audit: {
        Row: {
          action: string;
          created_at: string;
          flag_id: string;
          id: string;
          new_value: Json | null;
          performed_by: string | null;
          previous_value: Json | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          flag_id: string;
          id?: string;
          new_value?: Json | null;
          performed_by?: string | null;
          previous_value?: Json | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          flag_id?: string;
          id?: string;
          new_value?: Json | null;
          performed_by?: string | null;
          previous_value?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "feature_flag_audit_flag_id_fkey";
            columns: ["flag_id"];
            isOneToOne: false;
            referencedRelation: "feature_flags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feature_flag_audit_performed_by_fkey";
            columns: ["performed_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
        ];
      };
      feature_flags: {
        Row: {
          auto_rollback: boolean;
          created_at: string;
          description: string;
          environments: string[];
          error_threshold: number | null;
          id: string;
          key: string;
          last_toggled_at: string | null;
          last_toggled_by: string | null;
          name: string;
          rollback_triggered: boolean;
          rollout_percentage: number;
          rollout_strategy: string;
          status: string;
          target_segments: string[];
          target_user_ids: string[];
          updated_at: string;
        };
        Insert: {
          auto_rollback?: boolean;
          created_at?: string;
          description?: string;
          environments?: string[];
          error_threshold?: number | null;
          id?: string;
          key: string;
          last_toggled_at?: string | null;
          last_toggled_by?: string | null;
          name: string;
          rollback_triggered?: boolean;
          rollout_percentage?: number;
          rollout_strategy?: string;
          status?: string;
          target_segments?: string[];
          target_user_ids?: string[];
          updated_at?: string;
        };
        Update: {
          auto_rollback?: boolean;
          created_at?: string;
          description?: string;
          environments?: string[];
          error_threshold?: number | null;
          id?: string;
          key?: string;
          last_toggled_at?: string | null;
          last_toggled_by?: string | null;
          name?: string;
          rollback_triggered?: boolean;
          rollout_percentage?: number;
          rollout_strategy?: string;
          status?: string;
          target_segments?: string[];
          target_user_ids?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feature_flags_last_toggled_by_fkey";
            columns: ["last_toggled_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
        ];
      };
      feedback_items: {
        Row: {
          ai_sentiment: string | null;
          ai_summary: string | null;
          app_version: string | null;
          category: string | null;
          created_at: string;
          description: string;
          device_info: string | null;
          duplicate_of_id: string | null;
          id: string;
          priority: string;
          screenshot_url: string | null;
          source: string;
          status: string;
          tags: string[];
          title: string;
          type: string;
          updated_at: string;
          user_email: string | null;
          user_id: string | null;
          vote_count: number;
        };
        Insert: {
          ai_sentiment?: string | null;
          ai_summary?: string | null;
          app_version?: string | null;
          category?: string | null;
          created_at?: string;
          description?: string;
          device_info?: string | null;
          duplicate_of_id?: string | null;
          id?: string;
          priority?: string;
          screenshot_url?: string | null;
          source?: string;
          status?: string;
          tags?: string[];
          title: string;
          type: string;
          updated_at?: string;
          user_email?: string | null;
          user_id?: string | null;
          vote_count?: number;
        };
        Update: {
          ai_sentiment?: string | null;
          ai_summary?: string | null;
          app_version?: string | null;
          category?: string | null;
          created_at?: string;
          description?: string;
          device_info?: string | null;
          duplicate_of_id?: string | null;
          id?: string;
          priority?: string;
          screenshot_url?: string | null;
          source?: string;
          status?: string;
          tags?: string[];
          title?: string;
          type?: string;
          updated_at?: string;
          user_email?: string | null;
          user_id?: string | null;
          vote_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "feedback_items_duplicate_of_id_fkey";
            columns: ["duplicate_of_id"];
            isOneToOne: false;
            referencedRelation: "feedback_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      fraud_signals: {
        Row: {
          detected_at: string;
          id: string;
          metadata: Json;
          severity: string;
          signal: string;
          user_id: string;
        };
        Insert: {
          detected_at?: string;
          id?: string;
          metadata?: Json;
          severity: string;
          signal: string;
          user_id: string;
        };
        Update: {
          detected_at?: string;
          id?: string;
          metadata?: Json;
          severity?: string;
          signal?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fraud_signals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      fund_transactions: {
        Row: {
          amount: number;
          balance_after: number;
          created_at: string | null;
          description: string;
          fund_id: string;
          id: string;
          type: string;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          balance_after: number;
          created_at?: string | null;
          description?: string;
          fund_id: string;
          id: string;
          type: string;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          balance_after?: number;
          created_at?: string | null;
          description?: string;
          fund_id?: string;
          id?: string;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fund_transactions_fund_id_fkey";
            columns: ["fund_id"];
            isOneToOne: false;
            referencedRelation: "confetti_fund";
            referencedColumns: ["id"];
          },
        ];
      };
      generated_reports: {
        Row: {
          anomalies: Json;
          config_id: string | null;
          generated_at: string;
          id: string;
          sections: Json;
          sent_at: string | null;
          status: string;
          summary: string;
          title: string;
          type: string;
        };
        Insert: {
          anomalies?: Json;
          config_id?: string | null;
          generated_at?: string;
          id?: string;
          sections?: Json;
          sent_at?: string | null;
          status?: string;
          summary?: string;
          title: string;
          type: string;
        };
        Update: {
          anomalies?: Json;
          config_id?: string | null;
          generated_at?: string;
          id?: string;
          sections?: Json;
          sent_at?: string | null;
          status?: string;
          summary?: string;
          title?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generated_reports_config_id_fkey";
            columns: ["config_id"];
            isOneToOne: false;
            referencedRelation: "report_configs";
            referencedColumns: ["id"];
          },
        ];
      };
      group_invites: {
        Row: {
          created_at: string;
          expires_at: string | null;
          id: string;
          invite_token: string;
          itinerary_id: string;
          owner_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          invite_token?: string;
          itinerary_id: string;
          owner_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          invite_token?: string;
          itinerary_id?: string;
          owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_invites_itinerary_id_fkey";
            columns: ["itinerary_id"];
            isOneToOne: false;
            referencedRelation: "itineraries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_invites_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      group_members: {
        Row: {
          categories: string[] | null;
          created_at: string | null;
          display_name: string;
          group_id: string | null;
          id: string;
          joined_at: string | null;
          role: string;
          status: string;
          user_id: string | null;
        };
        Insert: {
          categories?: string[] | null;
          created_at?: string | null;
          display_name: string;
          group_id?: string | null;
          id: string;
          joined_at?: string | null;
          role?: string;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          categories?: string[] | null;
          created_at?: string | null;
          display_name?: string;
          group_id?: string | null;
          id?: string;
          joined_at?: string | null;
          role?: string;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      group_plan_stops: {
        Row: {
          created_at: string | null;
          duration: number | null;
          id: string;
          note: string | null;
          plan_id: string | null;
          score: number | null;
          stop_order: number;
          venue_data: Json;
        };
        Insert: {
          created_at?: string | null;
          duration?: number | null;
          id: string;
          note?: string | null;
          plan_id?: string | null;
          score?: number | null;
          stop_order: number;
          venue_data: Json;
        };
        Update: {
          created_at?: string | null;
          duration?: number | null;
          id?: string;
          note?: string | null;
          plan_id?: string | null;
          score?: number | null;
          stop_order?: number;
          venue_data?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "group_plan_stops_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "group_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      group_plans: {
        Row: {
          consensus_score: number | null;
          created_at: string | null;
          emoji: string | null;
          group_id: string | null;
          id: string;
          name: string;
          plan_date: string | null;
          status: string;
          subtitle: string | null;
          total_votes: number | null;
        };
        Insert: {
          consensus_score?: number | null;
          created_at?: string | null;
          emoji?: string | null;
          group_id?: string | null;
          id: string;
          name: string;
          plan_date?: string | null;
          status?: string;
          subtitle?: string | null;
          total_votes?: number | null;
        };
        Update: {
          consensus_score?: number | null;
          created_at?: string | null;
          emoji?: string | null;
          group_id?: string | null;
          id?: string;
          name?: string;
          plan_date?: string | null;
          status?: string;
          subtitle?: string | null;
          total_votes?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "group_plans_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      group_votes: {
        Row: {
          display_name: string;
          id: string;
          stop_id: string | null;
          user_id: string | null;
          vote: string;
          voted_at: string | null;
        };
        Insert: {
          display_name: string;
          id?: string;
          stop_id?: string | null;
          user_id?: string | null;
          vote: string;
          voted_at?: string | null;
        };
        Update: {
          display_name?: string;
          id?: string;
          stop_id?: string | null;
          user_id?: string | null;
          vote?: string;
          voted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "group_votes_stop_id_fkey";
            columns: ["stop_id"];
            isOneToOne: false;
            referencedRelation: "group_plan_stops";
            referencedColumns: ["id"];
          },
        ];
      };
      groups: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          emoji: string | null;
          id: string;
          invite_code: string;
          name: string;
          settings: Json | null;
          type: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          emoji?: string | null;
          id: string;
          invite_code: string;
          name: string;
          settings?: Json | null;
          type: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          emoji?: string | null;
          id?: string;
          invite_code?: string;
          name?: string;
          settings?: Json | null;
          type?: string;
        };
        Relationships: [];
      };
      happy_hour_deals: {
        Row: {
          avg_rating: number | null;
          avg_savings_pct: number | null;
          best_for: string[] | null;
          confidence: string | null;
          created_at: string;
          crowd_level: number | null;
          data_source: string | null;
          days_active: string[];
          deal_name: string;
          deal_summary: string;
          drink_specials: Json | null;
          end_time: string;
          food_specials: Json | null;
          id: string;
          is_all_day: boolean | null;
          is_verified: boolean | null;
          last_verified: string | null;
          neighborhood_id: string | null;
          noise_level: number | null;
          popularity_score: number | null;
          price_ceiling: number | null;
          price_floor: number | null;
          restrictions: string | null;
          seasonal_notes: string | null;
          seating_type: string[] | null;
          start_time: string;
          times_clicked: number | null;
          times_redeemed: number | null;
          times_shown: number | null;
          two_person_est: number | null;
          updated_at: string;
          venue_id: string;
          vibe_tags: string[] | null;
        };
        Insert: {
          avg_rating?: number | null;
          avg_savings_pct?: number | null;
          best_for?: string[] | null;
          confidence?: string | null;
          created_at?: string;
          crowd_level?: number | null;
          data_source?: string | null;
          days_active?: string[];
          deal_name: string;
          deal_summary: string;
          drink_specials?: Json | null;
          end_time: string;
          food_specials?: Json | null;
          id?: string;
          is_all_day?: boolean | null;
          is_verified?: boolean | null;
          last_verified?: string | null;
          neighborhood_id?: string | null;
          noise_level?: number | null;
          popularity_score?: number | null;
          price_ceiling?: number | null;
          price_floor?: number | null;
          restrictions?: string | null;
          seasonal_notes?: string | null;
          seating_type?: string[] | null;
          start_time: string;
          times_clicked?: number | null;
          times_redeemed?: number | null;
          times_shown?: number | null;
          two_person_est?: number | null;
          updated_at?: string;
          venue_id: string;
          vibe_tags?: string[] | null;
        };
        Update: {
          avg_rating?: number | null;
          avg_savings_pct?: number | null;
          best_for?: string[] | null;
          confidence?: string | null;
          created_at?: string;
          crowd_level?: number | null;
          data_source?: string | null;
          days_active?: string[];
          deal_name?: string;
          deal_summary?: string;
          drink_specials?: Json | null;
          end_time?: string;
          food_specials?: Json | null;
          id?: string;
          is_all_day?: boolean | null;
          is_verified?: boolean | null;
          last_verified?: string | null;
          neighborhood_id?: string | null;
          noise_level?: number | null;
          popularity_score?: number | null;
          price_ceiling?: number | null;
          price_floor?: number | null;
          restrictions?: string | null;
          seasonal_notes?: string | null;
          seating_type?: string[] | null;
          start_time?: string;
          times_clicked?: number | null;
          times_redeemed?: number | null;
          times_shown?: number | null;
          two_person_est?: number | null;
          updated_at?: string;
          venue_id?: string;
          vibe_tags?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "happy_hour_deals_neighborhood_id_fkey";
            columns: ["neighborhood_id"];
            isOneToOne: false;
            referencedRelation: "dmv_neighborhoods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "happy_hour_deals_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      happy_hour_feedback: {
        Row: {
          action: string;
          context: Json | null;
          created_at: string;
          deal_id: string;
          id: string;
          notes: string | null;
          rating: number | null;
          user_id: string;
        };
        Insert: {
          action: string;
          context?: Json | null;
          created_at?: string;
          deal_id: string;
          id?: string;
          notes?: string | null;
          rating?: number | null;
          user_id: string;
        };
        Update: {
          action?: string;
          context?: Json | null;
          created_at?: string;
          deal_id?: string;
          id?: string;
          notes?: string | null;
          rating?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "happy_hour_feedback_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "happy_hour_deals";
            referencedColumns: ["id"];
          },
        ];
      };
      happy_hour_itinerary_templates: {
        Row: {
          best_days: string[] | null;
          budget_range: string | null;
          created_at: string;
          description: string;
          duration_hours: number | null;
          id: string;
          is_active: boolean | null;
          metro_area: string;
          mood: string | null;
          name: string;
          neighborhood_ids: string[] | null;
          occasion: string;
          pro_tip: string | null;
          slug: string;
          stop_count: number | null;
          stops: Json;
          tagline: string;
          vibe_arc: string[] | null;
        };
        Insert: {
          best_days?: string[] | null;
          budget_range?: string | null;
          created_at?: string;
          description: string;
          duration_hours?: number | null;
          id: string;
          is_active?: boolean | null;
          metro_area: string;
          mood?: string | null;
          name: string;
          neighborhood_ids?: string[] | null;
          occasion: string;
          pro_tip?: string | null;
          slug: string;
          stop_count?: number | null;
          stops?: Json;
          tagline: string;
          vibe_arc?: string[] | null;
        };
        Update: {
          best_days?: string[] | null;
          budget_range?: string | null;
          created_at?: string;
          description?: string;
          duration_hours?: number | null;
          id?: string;
          is_active?: boolean | null;
          metro_area?: string;
          mood?: string | null;
          name?: string;
          neighborhood_ids?: string[] | null;
          occasion?: string;
          pro_tip?: string | null;
          slug?: string;
          stop_count?: number | null;
          stops?: Json;
          tagline?: string;
          vibe_arc?: string[] | null;
        };
        Relationships: [];
      };
      happy_hour_vibe_tags: {
        Row: {
          category: string;
          created_at: string;
          display_label: string;
          emoji: string | null;
          sort_order: number | null;
          tag: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          display_label: string;
          emoji?: string | null;
          sort_order?: number | null;
          tag: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          display_label?: string;
          emoji?: string | null;
          sort_order?: number | null;
          tag?: string;
        };
        Relationships: [];
      };
      incident_log: {
        Row: {
          created_at: string;
          id: string;
          postmortem_url: string | null;
          resolved_at: string | null;
          root_cause: string | null;
          severity: string;
          started_at: string;
          status: string;
          timeline: Json;
          title: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          postmortem_url?: string | null;
          resolved_at?: string | null;
          root_cause?: string | null;
          severity: string;
          started_at?: string;
          status?: string;
          timeline?: Json;
          title: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          postmortem_url?: string | null;
          resolved_at?: string | null;
          root_cause?: string | null;
          severity?: string;
          started_at?: string;
          status?: string;
          timeline?: Json;
          title?: string;
        };
        Relationships: [];
      };
      itineraries: {
        Row: {
          created_at: string;
          id: string;
          occasion: string | null;
          status: string;
          title: string;
          total_duration_minutes: number | null;
          total_estimated_cost: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          occasion?: string | null;
          status?: string;
          title: string;
          total_duration_minutes?: number | null;
          total_estimated_cost?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          occasion?: string | null;
          status?: string;
          title?: string;
          total_duration_minutes?: number | null;
          total_estimated_cost?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "itineraries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      itinerary_stops: {
        Row: {
          dress_code: string | null;
          duration_minutes: number | null;
          id: string;
          itinerary_id: string;
          starts_at: string | null;
          stop_order: number;
          travel_to_next_minutes: number | null;
          venue_id: string;
          vibe_match: number;
        };
        Insert: {
          dress_code?: string | null;
          duration_minutes?: number | null;
          id?: string;
          itinerary_id: string;
          starts_at?: string | null;
          stop_order: number;
          travel_to_next_minutes?: number | null;
          venue_id: string;
          vibe_match: number;
        };
        Update: {
          dress_code?: string | null;
          duration_minutes?: number | null;
          id?: string;
          itinerary_id?: string;
          starts_at?: string | null;
          stop_order?: number;
          travel_to_next_minutes?: number | null;
          venue_id?: string;
          vibe_match?: number;
        };
        Relationships: [
          {
            foreignKeyName: "itinerary_stops_itinerary_id_fkey";
            columns: ["itinerary_id"];
            isOneToOne: false;
            referencedRelation: "itineraries";
            referencedColumns: ["id"];
          },
        ];
      };
      kill_switches: {
        Row: {
          activated_at: string | null;
          activated_by: string | null;
          affected_services: string[];
          created_at: string;
          deactivated_at: string | null;
          description: string;
          id: string;
          is_active: boolean;
          name: string;
          reason: string | null;
        };
        Insert: {
          activated_at?: string | null;
          activated_by?: string | null;
          affected_services?: string[];
          created_at?: string;
          deactivated_at?: string | null;
          description?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          reason?: string | null;
        };
        Update: {
          activated_at?: string | null;
          activated_by?: string | null;
          affected_services?: string[];
          created_at?: string;
          deactivated_at?: string | null;
          description?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "kill_switches_activated_by_fkey";
            columns: ["activated_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
        ];
      };
      linked_social_accounts: {
        Row: {
          access_token: string | null;
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          expires_at: string | null;
          id: string;
          provider: string;
          provider_user_id: string;
          raw: Json | null;
          refresh_token: string | null;
          scope: string | null;
          updated_at: string;
          user_id: string;
          username: string | null;
        };
        Insert: {
          access_token?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          expires_at?: string | null;
          id?: string;
          provider: string;
          provider_user_id: string;
          raw?: Json | null;
          refresh_token?: string | null;
          scope?: string | null;
          updated_at?: string;
          user_id: string;
          username?: string | null;
        };
        Update: {
          access_token?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          expires_at?: string | null;
          id?: string;
          provider?: string;
          provider_user_id?: string;
          raw?: Json | null;
          refresh_token?: string | null;
          scope?: string | null;
          updated_at?: string;
          user_id?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      maintenance_windows: {
        Row: {
          actual_end: string | null;
          actual_start: string | null;
          affected_services: string[];
          created_at: string;
          description: string;
          id: string;
          scheduled_end: string;
          scheduled_start: string;
          status: string;
          title: string;
        };
        Insert: {
          actual_end?: string | null;
          actual_start?: string | null;
          affected_services?: string[];
          created_at?: string;
          description?: string;
          id?: string;
          scheduled_end: string;
          scheduled_start: string;
          status?: string;
          title: string;
        };
        Update: {
          actual_end?: string | null;
          actual_start?: string | null;
          affected_services?: string[];
          created_at?: string;
          description?: string;
          id?: string;
          scheduled_end?: string;
          scheduled_start?: string;
          status?: string;
          title?: string;
        };
        Relationships: [];
      };
      outreach_templates: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          name: string;
          subject: string;
          type: string;
          variables: string[];
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          name: string;
          subject: string;
          type: string;
          variables?: string[];
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          name?: string;
          subject?: string;
          type?: string;
          variables?: string[];
        };
        Relationships: [];
      };
      partner_activities: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          partner_id: string;
          performed_by: string | null;
          type: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          partner_id: string;
          performed_by?: string | null;
          type: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          partner_id?: string;
          performed_by?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_activities_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partners";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "partner_activities_performed_by_fkey";
            columns: ["performed_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
        ];
      };
      partners: {
        Row: {
          contact_email: string;
          contact_name: string;
          contact_phone: string | null;
          contract_end_date: string | null;
          contract_start_date: string | null;
          created_at: string;
          deal_value: number | null;
          id: string;
          last_contact_at: string | null;
          name: string;
          next_follow_up_at: string | null;
          notes: Json;
          revenue_share: number | null;
          social_handle: string | null;
          stage: string;
          tags: string[];
          tier: string;
          type: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          contact_email: string;
          contact_name: string;
          contact_phone?: string | null;
          contract_end_date?: string | null;
          contract_start_date?: string | null;
          created_at?: string;
          deal_value?: number | null;
          id?: string;
          last_contact_at?: string | null;
          name: string;
          next_follow_up_at?: string | null;
          notes?: Json;
          revenue_share?: number | null;
          social_handle?: string | null;
          stage?: string;
          tags?: string[];
          tier?: string;
          type: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          contact_email?: string;
          contact_name?: string;
          contact_phone?: string | null;
          contract_end_date?: string | null;
          contract_start_date?: string | null;
          created_at?: string;
          deal_value?: number | null;
          id?: string;
          last_contact_at?: string | null;
          name?: string;
          next_follow_up_at?: string | null;
          notes?: Json;
          revenue_share?: number | null;
          social_handle?: string | null;
          stage?: string;
          tags?: string[];
          tier?: string;
          type?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      passport_stamps: {
        Row: {
          earned_at: string;
          id: string;
          stamp_type: string;
          user_id: string;
          venue_id: string;
          visit_notes: string | null;
        };
        Insert: {
          earned_at?: string;
          id?: string;
          stamp_type: string;
          user_id: string;
          venue_id: string;
          visit_notes?: string | null;
        };
        Update: {
          earned_at?: string;
          id?: string;
          stamp_type?: string;
          user_id?: string;
          venue_id?: string;
          visit_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "passport_stamps_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payout_records: {
        Row: {
          amount: number;
          approved_at: string | null;
          approved_by: string | null;
          business_id: string;
          business_name: string;
          id: string;
          period: string;
          processed_at: string | null;
          requested_at: string;
          status: string;
          transaction_count: number;
        };
        Insert: {
          amount: number;
          approved_at?: string | null;
          approved_by?: string | null;
          business_id: string;
          business_name: string;
          id?: string;
          period: string;
          processed_at?: string | null;
          requested_at?: string;
          status?: string;
          transaction_count?: number;
        };
        Update: {
          amount?: number;
          approved_at?: string | null;
          approved_by?: string | null;
          business_id?: string;
          business_name?: string;
          id?: string;
          period?: string;
          processed_at?: string | null;
          requested_at?: string;
          status?: string;
          transaction_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "payout_records_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "payout_records_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "business_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      policy_documents: {
        Row: {
          changelog: string | null;
          content: string;
          created_at: string;
          effective_date: string;
          id: string;
          previous_version_id: string | null;
          type: string;
          version: string;
        };
        Insert: {
          changelog?: string | null;
          content: string;
          created_at?: string;
          effective_date: string;
          id?: string;
          previous_version_id?: string | null;
          type: string;
          version: string;
        };
        Update: {
          changelog?: string | null;
          content?: string;
          created_at?: string;
          effective_date?: string;
          id?: string;
          previous_version_id?: string | null;
          type?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "policy_documents_previous_version_id_fkey";
            columns: ["previous_version_id"];
            isOneToOne: false;
            referencedRelation: "policy_documents";
            referencedColumns: ["id"];
          },
        ];
      };
      portal_notifications: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          is_read: boolean;
          message: string;
          title: string;
          type: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          title: string;
          type: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          title?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "portal_notifications_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "business_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      portal_sessions: {
        Row: {
          business_id: string;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          is_valid: boolean;
          last_active_at: string;
          member_id: string | null;
          role: string;
          token: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          is_valid?: boolean;
          last_active_at?: string;
          member_id?: string | null;
          role?: string;
          token: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          is_valid?: boolean;
          last_active_at?: string;
          member_id?: string | null;
          role?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "portal_sessions_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "business_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      pricing_experiments: {
        Row: {
          control_conversion: number;
          control_plan_id: string;
          control_revenue: number;
          created_at: string;
          description: string;
          end_date: string | null;
          id: string;
          name: string;
          start_date: string | null;
          status: string;
          traffic_split: number;
          variant_conversion: number;
          variant_plan_id: string;
          variant_revenue: number;
          winner: string | null;
        };
        Insert: {
          control_conversion?: number;
          control_plan_id: string;
          control_revenue?: number;
          created_at?: string;
          description?: string;
          end_date?: string | null;
          id?: string;
          name: string;
          start_date?: string | null;
          status?: string;
          traffic_split?: number;
          variant_conversion?: number;
          variant_plan_id: string;
          variant_revenue?: number;
          winner?: string | null;
        };
        Update: {
          control_conversion?: number;
          control_plan_id?: string;
          control_revenue?: number;
          created_at?: string;
          description?: string;
          end_date?: string | null;
          id?: string;
          name?: string;
          start_date?: string | null;
          status?: string;
          traffic_split?: number;
          variant_conversion?: number;
          variant_plan_id?: string;
          variant_revenue?: number;
          winner?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pricing_experiments_control_plan_id_fkey";
            columns: ["control_plan_id"];
            isOneToOne: false;
            referencedRelation: "pricing_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pricing_experiments_variant_plan_id_fkey";
            columns: ["variant_plan_id"];
            isOneToOne: false;
            referencedRelation: "pricing_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      pricing_plans: {
        Row: {
          billing_cycle: string;
          created_at: string;
          features: Json;
          id: string;
          is_active: boolean;
          limits: Json;
          model: string;
          mrr: number;
          name: string;
          price: number;
          subscriber_count: number;
          type: string;
          updated_at: string;
        };
        Insert: {
          billing_cycle?: string;
          created_at?: string;
          features?: Json;
          id?: string;
          is_active?: boolean;
          limits?: Json;
          model: string;
          mrr?: number;
          name: string;
          price?: number;
          subscriber_count?: number;
          type: string;
          updated_at?: string;
        };
        Update: {
          billing_cycle?: string;
          created_at?: string;
          features?: Json;
          id?: string;
          is_active?: boolean;
          limits?: Json;
          model?: string;
          mrr?: number;
          name?: string;
          price?: number;
          subscriber_count?: number;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      processed_trigger_events: {
        Row: {
          event_id: string;
          processed_at: string;
          trigger_name: string;
        };
        Insert: {
          event_id: string;
          processed_at?: string;
          trigger_name: string;
        };
        Update: {
          event_id?: string;
          processed_at?: string;
          trigger_name?: string;
        };
        Relationships: [];
      };
      profile_social_links: {
        Row: {
          connected_at: string;
          id: string;
          last_used_at: string | null;
          metadata: Json;
          provider: string;
          provider_email: string | null;
          provider_user_id: string | null;
          user_id: string;
        };
        Insert: {
          connected_at?: string;
          id?: string;
          last_used_at?: string | null;
          metadata?: Json;
          provider: string;
          provider_email?: string | null;
          provider_user_id?: string | null;
          user_id: string;
        };
        Update: {
          connected_at?: string;
          id?: string;
          last_used_at?: string | null;
          metadata?: Json;
          provider?: string;
          provider_email?: string | null;
          provider_user_id?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          auth_provider: string;
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          last_login_at: string | null;
          tier: string;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          auth_provider?: string;
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name: string;
          id: string;
          last_login_at?: string | null;
          tier?: string;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          auth_provider?: string;
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          last_login_at?: string | null;
          tier?: string;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      promo_codes: {
        Row: {
          applicable_plans: string[];
          code: string;
          created_at: string;
          current_redemptions: number;
          discount_type: string;
          discount_value: number;
          id: string;
          is_active: boolean;
          max_redemptions: number | null;
          valid_from: string;
          valid_until: string | null;
        };
        Insert: {
          applicable_plans?: string[];
          code: string;
          created_at?: string;
          current_redemptions?: number;
          discount_type: string;
          discount_value: number;
          id?: string;
          is_active?: boolean;
          max_redemptions?: number | null;
          valid_from?: string;
          valid_until?: string | null;
        };
        Update: {
          applicable_plans?: string[];
          code?: string;
          created_at?: string;
          current_redemptions?: number;
          discount_type?: string;
          discount_value?: number;
          id?: string;
          is_active?: boolean;
          max_redemptions?: number | null;
          valid_from?: string;
          valid_until?: string | null;
        };
        Relationships: [];
      };
      promoter_jobs: {
        Row: {
          accepted_at: string | null;
          advertiser_id: string;
          amount_cents: number;
          boarding_pass_itinerary_id: string | null;
          brief: string;
          cancelled_at: string | null;
          created_at: string;
          currency: string;
          deliverables: Json;
          delivered_at: string | null;
          due_at: string | null;
          funded_at: string | null;
          id: string;
          paid_at: string | null;
          platform_fee_bps: number;
          promoter_id: string;
          status: Database["public"]["Enums"]["promoter_job_status"];
          stripe_payment_intent_id: string | null;
          title: string;
          updated_at: string;
          venue_id: string | null;
          verified_at: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          advertiser_id: string;
          amount_cents: number;
          boarding_pass_itinerary_id?: string | null;
          brief: string;
          cancelled_at?: string | null;
          created_at?: string;
          currency?: string;
          deliverables?: Json;
          delivered_at?: string | null;
          due_at?: string | null;
          funded_at?: string | null;
          id?: string;
          paid_at?: string | null;
          platform_fee_bps?: number;
          promoter_id: string;
          status?: Database["public"]["Enums"]["promoter_job_status"];
          stripe_payment_intent_id?: string | null;
          title: string;
          updated_at?: string;
          venue_id?: string | null;
          verified_at?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          advertiser_id?: string;
          amount_cents?: number;
          boarding_pass_itinerary_id?: string | null;
          brief?: string;
          cancelled_at?: string | null;
          created_at?: string;
          currency?: string;
          deliverables?: Json;
          delivered_at?: string | null;
          due_at?: string | null;
          funded_at?: string | null;
          id?: string;
          paid_at?: string | null;
          platform_fee_bps?: number;
          promoter_id?: string;
          status?: Database["public"]["Enums"]["promoter_job_status"];
          stripe_payment_intent_id?: string | null;
          title?: string;
          updated_at?: string;
          venue_id?: string | null;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "promoter_jobs_boarding_pass_itinerary_id_fkey";
            columns: ["boarding_pass_itinerary_id"];
            isOneToOne: false;
            referencedRelation: "itineraries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promoter_jobs_promoter_id_fkey";
            columns: ["promoter_id"];
            isOneToOne: false;
            referencedRelation: "promoters";
            referencedColumns: ["id"];
          },
        ];
      };
      promoter_metrics_daily: {
        Row: {
          bookings_attributed: number;
          clicks: number;
          created_at: string;
          date: string;
          engagement: number;
          id: string;
          job_id: string | null;
          promoter_id: string;
          updated_at: string;
          views: number;
        };
        Insert: {
          bookings_attributed?: number;
          clicks?: number;
          created_at?: string;
          date: string;
          engagement?: number;
          id?: string;
          job_id?: string | null;
          promoter_id: string;
          updated_at?: string;
          views?: number;
        };
        Update: {
          bookings_attributed?: number;
          clicks?: number;
          created_at?: string;
          date?: string;
          engagement?: number;
          id?: string;
          job_id?: string | null;
          promoter_id?: string;
          updated_at?: string;
          views?: number;
        };
        Relationships: [
          {
            foreignKeyName: "promoter_metrics_daily_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "promoter_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promoter_metrics_daily_promoter_id_fkey";
            columns: ["promoter_id"];
            isOneToOne: false;
            referencedRelation: "promoters";
            referencedColumns: ["id"];
          },
        ];
      };
      promoter_payouts: {
        Row: {
          amount_cents: number;
          created_at: string;
          currency: string;
          failure_reason: string | null;
          id: string;
          job_id: string | null;
          paid_at: string | null;
          promoter_id: string;
          status: Database["public"]["Enums"]["promoter_payout_status"];
          stripe_transfer_id: string | null;
          updated_at: string;
        };
        Insert: {
          amount_cents: number;
          created_at?: string;
          currency?: string;
          failure_reason?: string | null;
          id?: string;
          job_id?: string | null;
          paid_at?: string | null;
          promoter_id: string;
          status?: Database["public"]["Enums"]["promoter_payout_status"];
          stripe_transfer_id?: string | null;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          created_at?: string;
          currency?: string;
          failure_reason?: string | null;
          id?: string;
          job_id?: string | null;
          paid_at?: string | null;
          promoter_id?: string;
          status?: Database["public"]["Enums"]["promoter_payout_status"];
          stripe_transfer_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promoter_payouts_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "promoter_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promoter_payouts_promoter_id_fkey";
            columns: ["promoter_id"];
            isOneToOne: false;
            referencedRelation: "promoters";
            referencedColumns: ["id"];
          },
        ];
      };
      promoter_submissions: {
        Row: {
          boarding_pass_visible: boolean;
          caption: string | null;
          content_url: string;
          created_at: string;
          id: string;
          job_id: string;
          metrics: Json;
          platform: string;
          posted_at: string | null;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewer_id: string | null;
          updated_at: string;
          verification_status: Database["public"]["Enums"]["promoter_submission_status"];
        };
        Insert: {
          boarding_pass_visible?: boolean;
          caption?: string | null;
          content_url: string;
          created_at?: string;
          id?: string;
          job_id: string;
          metrics?: Json;
          platform: string;
          posted_at?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["promoter_submission_status"];
        };
        Update: {
          boarding_pass_visible?: boolean;
          caption?: string | null;
          content_url?: string;
          created_at?: string;
          id?: string;
          job_id?: string;
          metrics?: Json;
          platform?: string;
          posted_at?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["promoter_submission_status"];
        };
        Relationships: [
          {
            foreignKeyName: "promoter_submissions_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "promoter_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      promoters: {
        Row: {
          admin_notes: string | null;
          audience: Json;
          avatar_url: string | null;
          bio: string | null;
          cities: string[];
          created_at: string;
          display_name: string;
          id: string;
          jobs_completed: number;
          niche: string[];
          rate_card: Json;
          rating: number | null;
          sample_links: string[];
          status: Database["public"]["Enums"]["promoter_status"];
          stripe_account_id: string | null;
          stripe_payouts_enabled: boolean;
          updated_at: string;
          user_id: string;
          verified_at: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          audience?: Json;
          avatar_url?: string | null;
          bio?: string | null;
          cities?: string[];
          created_at?: string;
          display_name: string;
          id?: string;
          jobs_completed?: number;
          niche?: string[];
          rate_card?: Json;
          rating?: number | null;
          sample_links?: string[];
          status?: Database["public"]["Enums"]["promoter_status"];
          stripe_account_id?: string | null;
          stripe_payouts_enabled?: boolean;
          updated_at?: string;
          user_id: string;
          verified_at?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          audience?: Json;
          avatar_url?: string | null;
          bio?: string | null;
          cities?: string[];
          created_at?: string;
          display_name?: string;
          id?: string;
          jobs_completed?: number;
          niche?: string[];
          rate_card?: Json;
          rating?: number | null;
          sample_links?: string[];
          status?: Database["public"]["Enums"]["promoter_status"];
          stripe_account_id?: string | null;
          stripe_payouts_enabled?: boolean;
          updated_at?: string;
          user_id?: string;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      rate_limit_buckets: {
        Row: {
          key: string;
          last_refill: string;
          tokens: number;
        };
        Insert: {
          key: string;
          last_refill?: string;
          tokens: number;
        };
        Update: {
          key?: string;
          last_refill?: string;
          tokens?: number;
        };
        Relationships: [];
      };
      reels: {
        Row: {
          boost_campaign_id: string | null;
          created_at: string;
          description: string | null;
          duration_seconds: number | null;
          id: string;
          is_boosted: boolean;
          is_featured: boolean;
          like_count: number;
          platform: string;
          status: string;
          tags: string[];
          thumbnail_url: string | null;
          title: string | null;
          uploaded_by: string | null;
          url: string;
          venue_id: string | null;
          vibe: string | null;
          view_count: number;
        };
        Insert: {
          boost_campaign_id?: string | null;
          created_at?: string;
          description?: string | null;
          duration_seconds?: number | null;
          id?: string;
          is_boosted?: boolean;
          is_featured?: boolean;
          like_count?: number;
          platform?: string;
          status?: string;
          tags?: string[];
          thumbnail_url?: string | null;
          title?: string | null;
          uploaded_by?: string | null;
          url: string;
          venue_id?: string | null;
          vibe?: string | null;
          view_count?: number;
        };
        Update: {
          boost_campaign_id?: string | null;
          created_at?: string;
          description?: string | null;
          duration_seconds?: number | null;
          id?: string;
          is_boosted?: boolean;
          is_featured?: boolean;
          like_count?: number;
          platform?: string;
          status?: string;
          tags?: string[];
          thumbnail_url?: string | null;
          title?: string | null;
          uploaded_by?: string | null;
          url?: string;
          venue_id?: string | null;
          vibe?: string | null;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "reels_boost_campaign_id_fkey";
            columns: ["boost_campaign_id"];
            isOneToOne: false;
            referencedRelation: "boost_campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reels_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      refund_requests: {
        Row: {
          amount: number;
          description: string;
          id: string;
          reason: string;
          requested_at: string;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          transaction_id: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          description?: string;
          id?: string;
          reason: string;
          requested_at?: string;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          transaction_id: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          description?: string;
          id?: string;
          reason?: string;
          requested_at?: string;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          transaction_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "refund_requests_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "refund_requests_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "refund_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      report_configs: {
        Row: {
          created_at: string;
          delivery: string[];
          id: string;
          is_active: boolean;
          last_run_at: string | null;
          metrics: string[];
          name: string;
          next_run_at: string | null;
          recipient_email: string | null;
          schedule: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          delivery?: string[];
          id?: string;
          is_active?: boolean;
          last_run_at?: string | null;
          metrics?: string[];
          name: string;
          next_run_at?: string | null;
          recipient_email?: string | null;
          schedule?: string;
          type: string;
        };
        Update: {
          created_at?: string;
          delivery?: string[];
          id?: string;
          is_active?: boolean;
          last_run_at?: string | null;
          metrics?: string[];
          name?: string;
          next_run_at?: string | null;
          recipient_email?: string | null;
          schedule?: string;
          type?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          ambiance_rating: number | null;
          body: string;
          created_at: string;
          food_rating: number | null;
          id: string;
          occasion_tag: string | null;
          photo_urls: string[];
          rating: number;
          service_rating: number | null;
          user_id: string;
          venue_id: string;
        };
        Insert: {
          ambiance_rating?: number | null;
          body: string;
          created_at?: string;
          food_rating?: number | null;
          id?: string;
          occasion_tag?: string | null;
          photo_urls?: string[];
          rating: number;
          service_rating?: number | null;
          user_id: string;
          venue_id: string;
        };
        Update: {
          ambiance_rating?: number | null;
          body?: string;
          created_at?: string;
          food_rating?: number | null;
          id?: string;
          occasion_tag?: string | null;
          photo_urls?: string[];
          rating?: number;
          service_rating?: number | null;
          user_id?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_events: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          kind: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          kind?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          kind?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      scan_runs: {
        Row: {
          city: string;
          completed_at: string | null;
          duration_ms: number | null;
          errors: string[] | null;
          id: string;
          mentions_found: number | null;
          platform: string | null;
          scan_type: string;
          started_at: string | null;
          status: string | null;
          venues_found: number | null;
        };
        Insert: {
          city: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          errors?: string[] | null;
          id?: string;
          mentions_found?: number | null;
          platform?: string | null;
          scan_type: string;
          started_at?: string | null;
          status?: string | null;
          venues_found?: number | null;
        };
        Update: {
          city?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          errors?: string[] | null;
          id?: string;
          mentions_found?: number | null;
          platform?: string | null;
          scan_type?: string;
          started_at?: string | null;
          status?: string | null;
          venues_found?: number | null;
        };
        Relationships: [];
      };
      scheduled_job_ledger: {
        Row: {
          completed_at: string | null;
          error_message: string | null;
          id: string;
          job_name: string;
          metadata: Json;
          rows_affected: number | null;
          started_at: string;
          status: string;
        };
        Insert: {
          completed_at?: string | null;
          error_message?: string | null;
          id?: string;
          job_name: string;
          metadata?: Json;
          rows_affected?: number | null;
          started_at?: string;
          status?: string;
        };
        Update: {
          completed_at?: string | null;
          error_message?: string | null;
          id?: string;
          job_name?: string;
          metadata?: Json;
          rows_affected?: number | null;
          started_at?: string;
          status?: string;
        };
        Relationships: [];
      };
      seo_pages: {
        Row: {
          h1: string | null;
          id: string;
          issues: Json;
          last_checked_at: string;
          meta_description: string | null;
          score: number;
          title: string | null;
          url: string;
        };
        Insert: {
          h1?: string | null;
          id?: string;
          issues?: Json;
          last_checked_at?: string;
          meta_description?: string | null;
          score?: number;
          title?: string | null;
          url: string;
        };
        Update: {
          h1?: string | null;
          id?: string;
          issues?: Json;
          last_checked_at?: string;
          meta_description?: string | null;
          score?: number;
          title?: string | null;
          url?: string;
        };
        Relationships: [];
      };
      shared_plans: {
        Row: {
          author_avatar: string | null;
          author_id: string;
          author_name: string;
          author_tier: string;
          avg_rating: number;
          center_lat: number | null;
          center_lng: number | null;
          city: string;
          completions: number;
          cover_image: string | null;
          created_at: string;
          description: string | null;
          estimated_cost: number | null;
          featured: boolean;
          id: string;
          occasion_tags: string[];
          origin: string;
          original_plan_id: string | null;
          region: string | null;
          remix_count: number;
          review_count: number;
          route_points: Json;
          saves: number;
          state: string | null;
          stops: Json;
          title: string;
          total_duration_hours: number | null;
          total_stops: number;
          updated_at: string;
          vibe_tags: string[];
        };
        Insert: {
          author_avatar?: string | null;
          author_id: string;
          author_name: string;
          author_tier?: string;
          avg_rating?: number;
          center_lat?: number | null;
          center_lng?: number | null;
          city: string;
          completions?: number;
          cover_image?: string | null;
          created_at?: string;
          description?: string | null;
          estimated_cost?: number | null;
          featured?: boolean;
          id?: string;
          occasion_tags?: string[];
          origin?: string;
          original_plan_id?: string | null;
          region?: string | null;
          remix_count?: number;
          review_count?: number;
          route_points?: Json;
          saves?: number;
          state?: string | null;
          stops?: Json;
          title: string;
          total_duration_hours?: number | null;
          total_stops?: number;
          updated_at?: string;
          vibe_tags?: string[];
        };
        Update: {
          author_avatar?: string | null;
          author_id?: string;
          author_name?: string;
          author_tier?: string;
          avg_rating?: number;
          center_lat?: number | null;
          center_lng?: number | null;
          city?: string;
          completions?: number;
          cover_image?: string | null;
          created_at?: string;
          description?: string | null;
          estimated_cost?: number | null;
          featured?: boolean;
          id?: string;
          occasion_tags?: string[];
          origin?: string;
          original_plan_id?: string | null;
          region?: string | null;
          remix_count?: number;
          review_count?: number;
          route_points?: Json;
          saves?: number;
          state?: string | null;
          stops?: Json;
          title?: string;
          total_duration_hours?: number | null;
          total_stops?: number;
          updated_at?: string;
          vibe_tags?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "shared_plans_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shared_plans_original_plan_id_fkey";
            columns: ["original_plan_id"];
            isOneToOne: false;
            referencedRelation: "shared_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      social_collection_log: {
        Row: {
          batch_id: string;
          city_slug: string;
          completed_at: string | null;
          created_at: string;
          duration_ms: number | null;
          error_message: string | null;
          id: string;
          model_used: string | null;
          signals_by_type: Json | null;
          signals_collected: number | null;
          status: string;
          trigger: string;
        };
        Insert: {
          batch_id: string;
          city_slug: string;
          completed_at?: string | null;
          created_at?: string;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string;
          model_used?: string | null;
          signals_by_type?: Json | null;
          signals_collected?: number | null;
          status?: string;
          trigger?: string;
        };
        Update: {
          batch_id?: string;
          city_slug?: string;
          completed_at?: string | null;
          created_at?: string;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string;
          model_used?: string | null;
          signals_by_type?: Json | null;
          signals_collected?: number | null;
          status?: string;
          trigger?: string;
        };
        Relationships: [];
      };
      social_mentions: {
        Row: {
          creator_followers: number | null;
          creator_handle: string | null;
          discovered_at: string | null;
          engagement_comments: number | null;
          engagement_likes: number | null;
          engagement_shares: number | null;
          id: string;
          platform: string;
          post_id: string | null;
          post_url: string | null;
          sentiment: number | null;
          snippet: string | null;
          trending_venue_id: string | null;
        };
        Insert: {
          creator_followers?: number | null;
          creator_handle?: string | null;
          discovered_at?: string | null;
          engagement_comments?: number | null;
          engagement_likes?: number | null;
          engagement_shares?: number | null;
          id?: string;
          platform: string;
          post_id?: string | null;
          post_url?: string | null;
          sentiment?: number | null;
          snippet?: string | null;
          trending_venue_id?: string | null;
        };
        Update: {
          creator_followers?: number | null;
          creator_handle?: string | null;
          discovered_at?: string | null;
          engagement_comments?: number | null;
          engagement_likes?: number | null;
          engagement_shares?: number | null;
          id?: string;
          platform?: string;
          post_id?: string | null;
          post_url?: string | null;
          sentiment?: number | null;
          snippet?: string | null;
          trending_venue_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_mentions_trending_venue_id_fkey";
            columns: ["trending_venue_id"];
            isOneToOne: false;
            referencedRelation: "trending_venues";
            referencedColumns: ["id"];
          },
        ];
      };
      social_posts_raw: {
        Row: {
          caption: string | null;
          creator_handle: string | null;
          hashtags: Json | null;
          id: string;
          ingested_at: string | null;
          likes: number | null;
          location_tag: string | null;
          platform: string;
          post_id: string;
          saves: number | null;
          shares: number | null;
          signal_score: number | null;
          source: string | null;
          url: string | null;
          user_id: string;
        };
        Insert: {
          caption?: string | null;
          creator_handle?: string | null;
          hashtags?: Json | null;
          id?: string;
          ingested_at?: string | null;
          likes?: number | null;
          location_tag?: string | null;
          platform: string;
          post_id: string;
          saves?: number | null;
          shares?: number | null;
          signal_score?: number | null;
          source?: string | null;
          url?: string | null;
          user_id: string;
        };
        Update: {
          caption?: string | null;
          creator_handle?: string | null;
          hashtags?: Json | null;
          id?: string;
          ingested_at?: string | null;
          likes?: number | null;
          location_tag?: string | null;
          platform?: string;
          post_id?: string;
          saves?: number | null;
          shares?: number | null;
          signal_score?: number | null;
          source?: string | null;
          url?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      social_venue_signals: {
        Row: {
          category: string | null;
          city_slug: string;
          collected_at: string;
          created_at: string;
          engagement_score: number;
          generation_batch: string | null;
          hashtags: string;
          id: string;
          is_active: boolean;
          neighborhood: string | null;
          outing_tags: string[] | null;
          platform: string;
          sentiment: string;
          signal_type: string;
          snippet: string | null;
          updated_at: string;
          venue_name: string;
          venue_slug: string;
        };
        Insert: {
          category?: string | null;
          city_slug: string;
          collected_at?: string;
          created_at?: string;
          engagement_score?: number;
          generation_batch?: string | null;
          hashtags?: string;
          id?: string;
          is_active?: boolean;
          neighborhood?: string | null;
          outing_tags?: string[] | null;
          platform: string;
          sentiment: string;
          signal_type: string;
          snippet?: string | null;
          updated_at?: string;
          venue_name: string;
          venue_slug: string;
        };
        Update: {
          category?: string | null;
          city_slug?: string;
          collected_at?: string;
          created_at?: string;
          engagement_score?: number;
          generation_batch?: string | null;
          hashtags?: string;
          id?: string;
          is_active?: boolean;
          neighborhood?: string | null;
          outing_tags?: string[] | null;
          platform?: string;
          sentiment?: string;
          signal_type?: string;
          snippet?: string | null;
          updated_at?: string;
          venue_name?: string;
          venue_slug?: string;
        };
        Relationships: [];
      };
      store_metadata: {
        Row: {
          app_name: string;
          category: string | null;
          description: string | null;
          id: string;
          keywords: string[];
          last_updated_at: string;
          platform: string;
          screenshots: Json;
          subtitle: string | null;
        };
        Insert: {
          app_name: string;
          category?: string | null;
          description?: string | null;
          id?: string;
          keywords?: string[];
          last_updated_at?: string;
          platform: string;
          screenshots?: Json;
          subtitle?: string | null;
        };
        Update: {
          app_name?: string;
          category?: string | null;
          description?: string | null;
          id?: string;
          keywords?: string[];
          last_updated_at?: string;
          platform?: string;
          screenshots?: Json;
          subtitle?: string | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null;
          created_at: string;
          current_period_end: string | null;
          environment: string;
          id: string;
          pending_price_id: string | null;
          price_id: string | null;
          product_id: string | null;
          status: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          tier: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean | null;
          created_at?: string;
          current_period_end?: string | null;
          environment?: string;
          id?: string;
          pending_price_id?: string | null;
          price_id?: string | null;
          product_id?: string | null;
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          tier?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean | null;
          created_at?: string;
          current_period_end?: string | null;
          environment?: string;
          id?: string;
          pending_price_id?: string | null;
          price_id?: string | null;
          product_id?: string | null;
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          tier?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      support_ticket_messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          role: string;
          ticket_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          role: string;
          ticket_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          role?: string;
          ticket_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "support_tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      support_tickets: {
        Row: {
          ai_response: string | null;
          assigned_to: string | null;
          category: string;
          created_at: string;
          description: string;
          escalation_reason: string | null;
          id: string;
          priority: string;
          resolved_at: string | null;
          status: string;
          subject: string;
          updated_at: string;
          user_email: string;
          user_id: string | null;
        };
        Insert: {
          ai_response?: string | null;
          assigned_to?: string | null;
          category?: string;
          created_at?: string;
          description?: string;
          escalation_reason?: string | null;
          id?: string;
          priority?: string;
          resolved_at?: string | null;
          status?: string;
          subject: string;
          updated_at?: string;
          user_email: string;
          user_id?: string | null;
        };
        Update: {
          ai_response?: string | null;
          assigned_to?: string | null;
          category?: string;
          created_at?: string;
          description?: string;
          escalation_reason?: string | null;
          id?: string;
          priority?: string;
          resolved_at?: string | null;
          status?: string;
          subject?: string;
          updated_at?: string;
          user_email?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      system_alerts: {
        Row: {
          acknowledged: boolean;
          acknowledged_by: string | null;
          created_at: string;
          description: string;
          id: string;
          metric: string | null;
          resolved_at: string | null;
          service: string;
          severity: string;
          threshold: number | null;
          title: string;
          value: number | null;
        };
        Insert: {
          acknowledged?: boolean;
          acknowledged_by?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          metric?: string | null;
          resolved_at?: string | null;
          service: string;
          severity: string;
          threshold?: number | null;
          title: string;
          value?: number | null;
        };
        Update: {
          acknowledged?: boolean;
          acknowledged_by?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          metric?: string | null;
          resolved_at?: string | null;
          service?: string;
          severity?: string;
          threshold?: number | null;
          title?: string;
          value?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "system_alerts_acknowledged_by_fkey";
            columns: ["acknowledged_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
        ];
      };
      taste_profiles: {
        Row: {
          adventure_score: number;
          cuisine_scores: Json;
          event_count: number;
          last_computed_at: string;
          last_synced_at: string | null;
          neighborhood_scores: Json;
          occasion_scores: Json;
          platforms_connected: string[] | null;
          price_preference: string;
          social_score: number;
          social_signals: Json | null;
          time_patterns: Json;
          updated_at: string;
          user_id: string;
          vibe_scores: Json;
        };
        Insert: {
          adventure_score?: number;
          cuisine_scores?: Json;
          event_count?: number;
          last_computed_at?: string;
          last_synced_at?: string | null;
          neighborhood_scores?: Json;
          occasion_scores?: Json;
          platforms_connected?: string[] | null;
          price_preference?: string;
          social_score?: number;
          social_signals?: Json | null;
          time_patterns?: Json;
          updated_at?: string;
          user_id: string;
          vibe_scores?: Json;
        };
        Update: {
          adventure_score?: number;
          cuisine_scores?: Json;
          event_count?: number;
          last_computed_at?: string;
          last_synced_at?: string | null;
          neighborhood_scores?: Json;
          occasion_scores?: Json;
          platforms_connected?: string[] | null;
          price_preference?: string;
          social_score?: number;
          social_signals?: Json | null;
          time_patterns?: Json;
          updated_at?: string;
          user_id?: string;
          vibe_scores?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "taste_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tiktok_oauth_states: {
        Row: {
          consumed_at: string | null;
          created_at: string;
          expires_at: string;
          redirect_to: string | null;
          state: string;
          user_id: string;
        };
        Insert: {
          consumed_at?: string | null;
          created_at?: string;
          expires_at?: string;
          redirect_to?: string | null;
          state: string;
          user_id: string;
        };
        Update: {
          consumed_at?: string | null;
          created_at?: string;
          expires_at?: string;
          redirect_to?: string | null;
          state?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tracked_keywords: {
        Row: {
          current_rank: number | null;
          difficulty: number | null;
          id: string;
          keyword: string;
          last_checked_at: string;
          platform: string;
          previous_rank: number | null;
          rank_change: number;
          search_volume: number | null;
          status: string;
        };
        Insert: {
          current_rank?: number | null;
          difficulty?: number | null;
          id?: string;
          keyword: string;
          last_checked_at?: string;
          platform: string;
          previous_rank?: number | null;
          rank_change?: number;
          search_volume?: number | null;
          status?: string;
        };
        Update: {
          current_rank?: number | null;
          difficulty?: number | null;
          id?: string;
          keyword?: string;
          last_checked_at?: string;
          platform?: string;
          previous_rank?: number | null;
          rank_change?: number;
          search_volume?: number | null;
          status?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          business_id: string | null;
          created_at: string;
          currency: string;
          description: string;
          id: string;
          metadata: Json;
          status: string;
          stripe_payment_id: string | null;
          type: string;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          business_id?: string | null;
          created_at?: string;
          currency?: string;
          description?: string;
          id?: string;
          metadata?: Json;
          status?: string;
          stripe_payment_id?: string | null;
          type: string;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          business_id?: string | null;
          created_at?: string;
          currency?: string;
          description?: string;
          id?: string;
          metadata?: Json;
          status?: string;
          stripe_payment_id?: string | null;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "business_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trending_venues: {
        Row: {
          address: string | null;
          approved_at: string | null;
          approved_by: string | null;
          buzz_score: number | null;
          category: string | null;
          city: string;
          computed_at: string;
          confetti_venue_id: string | null;
          country: string | null;
          expires_at: string;
          first_seen: string | null;
          google_place_id: string | null;
          id: string;
          image_url: string | null;
          last_updated: string | null;
          lat: number | null;
          lng: number | null;
          mention_count: number | null;
          platforms: string[] | null;
          rank_in_city: number | null;
          snippet: string | null;
          source_migration: string | null;
          status: string | null;
          trend: string | null;
          trend_factors: Json;
          trend_score: number;
          venue_id: string;
          vibe_tags: string[] | null;
        };
        Insert: {
          address?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          buzz_score?: number | null;
          category?: string | null;
          city: string;
          computed_at?: string;
          confetti_venue_id?: string | null;
          country?: string | null;
          expires_at?: string;
          first_seen?: string | null;
          google_place_id?: string | null;
          id?: string;
          image_url?: string | null;
          last_updated?: string | null;
          lat?: number | null;
          lng?: number | null;
          mention_count?: number | null;
          platforms?: string[] | null;
          rank_in_city?: number | null;
          snippet?: string | null;
          source_migration?: string | null;
          status?: string | null;
          trend?: string | null;
          trend_factors?: Json;
          trend_score?: number;
          venue_id: string;
          vibe_tags?: string[] | null;
        };
        Update: {
          address?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          buzz_score?: number | null;
          category?: string | null;
          city?: string;
          computed_at?: string;
          confetti_venue_id?: string | null;
          country?: string | null;
          expires_at?: string;
          first_seen?: string | null;
          google_place_id?: string | null;
          id?: string;
          image_url?: string | null;
          last_updated?: string | null;
          lat?: number | null;
          lng?: number | null;
          mention_count?: number | null;
          platforms?: string[] | null;
          rank_in_city?: number | null;
          snippet?: string | null;
          source_migration?: string | null;
          status?: string | null;
          trend?: string | null;
          trend_factors?: Json;
          trend_score?: number;
          venue_id?: string;
          vibe_tags?: string[] | null;
        };
        Relationships: [];
      };
      trip_plans: {
        Row: {
          created_at: string;
          departs_at: string | null;
          destination_city: string;
          destination_lat: number | null;
          destination_lng: number | null;
          destination_state: string | null;
          id: string;
          origin_city: string;
          origin_lat: number | null;
          origin_lng: number | null;
          origin_state: string | null;
          status: string;
          title: string;
          total_distance_miles: number | null;
          total_duration_hours: number | null;
          travel_mode: string;
          updated_at: string;
          user_id: string;
          waypoints: Json;
        };
        Insert: {
          created_at?: string;
          departs_at?: string | null;
          destination_city: string;
          destination_lat?: number | null;
          destination_lng?: number | null;
          destination_state?: string | null;
          id?: string;
          origin_city: string;
          origin_lat?: number | null;
          origin_lng?: number | null;
          origin_state?: string | null;
          status?: string;
          title: string;
          total_distance_miles?: number | null;
          total_duration_hours?: number | null;
          travel_mode?: string;
          updated_at?: string;
          user_id: string;
          waypoints?: Json;
        };
        Update: {
          created_at?: string;
          departs_at?: string | null;
          destination_city?: string;
          destination_lat?: number | null;
          destination_lng?: number | null;
          destination_state?: string | null;
          id?: string;
          origin_city?: string;
          origin_lat?: number | null;
          origin_lng?: number | null;
          origin_state?: string | null;
          status?: string;
          title?: string;
          total_distance_miles?: number | null;
          total_duration_hours?: number | null;
          travel_mode?: string;
          updated_at?: string;
          user_id?: string;
          waypoints?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "trip_plans_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_stops: {
        Row: {
          arrives_at: string | null;
          city: string | null;
          distance_from_prev_miles: number | null;
          drive_time_from_prev_minutes: number | null;
          duration_minutes: number | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          name: string;
          notes: string | null;
          state: string | null;
          status: string;
          stop_order: number;
          stop_type: string;
          trip_id: string;
          venue_cache_id: string | null;
        };
        Insert: {
          arrives_at?: string | null;
          city?: string | null;
          distance_from_prev_miles?: number | null;
          drive_time_from_prev_minutes?: number | null;
          duration_minutes?: number | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          notes?: string | null;
          state?: string | null;
          status?: string;
          stop_order: number;
          stop_type?: string;
          trip_id: string;
          venue_cache_id?: string | null;
        };
        Update: {
          arrives_at?: string | null;
          city?: string | null;
          distance_from_prev_miles?: number | null;
          drive_time_from_prev_minutes?: number | null;
          duration_minutes?: number | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          notes?: string | null;
          state?: string | null;
          status?: string;
          stop_order?: number;
          stop_type?: string;
          trip_id?: string;
          venue_cache_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trip_stops_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trip_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_stops_venue_cache_id_fkey";
            columns: ["venue_cache_id"];
            isOneToOne: false;
            referencedRelation: "venue_cache";
            referencedColumns: ["id"];
          },
        ];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          id: string;
          unlocked_at: string;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          id?: string;
          unlocked_at?: string;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          id?: string;
          unlocked_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievements";
            referencedColumns: ["id"];
          },
        ];
      };
      user_behavior_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          itinerary_id: string | null;
          metadata: Json;
          user_id: string;
          venue_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          itinerary_id?: string | null;
          metadata?: Json;
          user_id: string;
          venue_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          itinerary_id?: string | null;
          metadata?: Json;
          user_id?: string;
          venue_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_behavior_events_itinerary_id_fkey";
            columns: ["itinerary_id"];
            isOneToOne: false;
            referencedRelation: "itineraries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_behavior_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_checkins: {
        Row: {
          campaign_id: string | null;
          confetti_earned: number;
          coupon_unlocked: string | null;
          id: string;
          lat: number;
          lng: number;
          method: string;
          user_id: string;
          venue_id: string;
          verified_at: string | null;
        };
        Insert: {
          campaign_id?: string | null;
          confetti_earned?: number;
          coupon_unlocked?: string | null;
          id: string;
          lat: number;
          lng: number;
          method?: string;
          user_id: string;
          venue_id: string;
          verified_at?: string | null;
        };
        Update: {
          campaign_id?: string | null;
          confetti_earned?: number;
          coupon_unlocked?: string | null;
          id?: string;
          lat?: number;
          lng?: number;
          method?: string;
          user_id?: string;
          venue_id?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_checkins_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "boost_campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_checkins_coupon_unlocked_fkey";
            columns: ["coupon_unlocked"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          activities: string[];
          budget_max: number;
          budget_min: number;
          cuisines: string[];
          updated_at: string;
          user_id: string;
          vibe_tags: string[];
        };
        Insert: {
          activities?: string[];
          budget_max?: number;
          budget_min?: number;
          cuisines?: string[];
          updated_at?: string;
          user_id: string;
          vibe_tags?: string[];
        };
        Update: {
          activities?: string[];
          budget_max?: number;
          budget_min?: number;
          cuisines?: string[];
          updated_at?: string;
          user_id?: string;
          vibe_tags?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_reputation: {
        Row: {
          badges: Json;
          confetti_earned: number;
          current_streak: number;
          helpful_votes: number;
          joined_at: string;
          plans_completed: number;
          plans_shared: number;
          reviews_written: number;
          tier: string;
          total_points: number;
          user_id: string;
        };
        Insert: {
          badges?: Json;
          confetti_earned?: number;
          current_streak?: number;
          helpful_votes?: number;
          joined_at?: string;
          plans_completed?: number;
          plans_shared?: number;
          reviews_written?: number;
          tier?: string;
          total_points?: number;
          user_id: string;
        };
        Update: {
          badges?: Json;
          confetti_earned?: number;
          current_streak?: number;
          helpful_votes?: number;
          joined_at?: string;
          plans_completed?: number;
          plans_shared?: number;
          reviews_written?: number;
          tier?: string;
          total_points?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_reputation_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          confetti_balance: number;
          created_at: string | null;
          outing_credit_balance: number;
          outing_credit_used_this_month: number;
          plan_limit: number;
          plans_used_this_month: number;
          prime_reservations: number;
          prime_reservations_used_this_month: number;
          renews_at: string | null;
          subscribed_at: string | null;
          tier: string;
          total_check_ins: number;
          total_confetti_earned: number;
          total_coupons_redeemed: number;
          user_id: string;
        };
        Insert: {
          confetti_balance?: number;
          created_at?: string | null;
          outing_credit_balance?: number;
          outing_credit_used_this_month?: number;
          plan_limit?: number;
          plans_used_this_month?: number;
          prime_reservations?: number;
          prime_reservations_used_this_month?: number;
          renews_at?: string | null;
          subscribed_at?: string | null;
          tier?: string;
          total_check_ins?: number;
          total_confetti_earned?: number;
          total_coupons_redeemed?: number;
          user_id: string;
        };
        Update: {
          confetti_balance?: number;
          created_at?: string | null;
          outing_credit_balance?: number;
          outing_credit_used_this_month?: number;
          plan_limit?: number;
          plans_used_this_month?: number;
          prime_reservations?: number;
          prime_reservations_used_this_month?: number;
          renews_at?: string | null;
          subscribed_at?: string | null;
          tier?: string;
          total_check_ins?: number;
          total_confetti_earned?: number;
          total_coupons_redeemed?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      venue_cache: {
        Row: {
          address: string | null;
          category: string;
          city: string;
          country: string;
          cuisine_tags: string[];
          expires_at: string;
          fetched_at: string;
          foursquare_id: string | null;
          google_place_id: string | null;
          hours: Json | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          name: string;
          occasion_tags: string[];
          phone: string | null;
          photo_urls: string[];
          price_level: string | null;
          rating: number | null;
          rating_count: number | null;
          raw_data: Json;
          source: string;
          state: string | null;
          subcategory: string | null;
          vibe_tags: string[];
          website: string | null;
        };
        Insert: {
          address?: string | null;
          category: string;
          city: string;
          country?: string;
          cuisine_tags?: string[];
          expires_at?: string;
          fetched_at?: string;
          foursquare_id?: string | null;
          google_place_id?: string | null;
          hours?: Json | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          occasion_tags?: string[];
          phone?: string | null;
          photo_urls?: string[];
          price_level?: string | null;
          rating?: number | null;
          rating_count?: number | null;
          raw_data?: Json;
          source?: string;
          state?: string | null;
          subcategory?: string | null;
          vibe_tags?: string[];
          website?: string | null;
        };
        Update: {
          address?: string | null;
          category?: string;
          city?: string;
          country?: string;
          cuisine_tags?: string[];
          expires_at?: string;
          fetched_at?: string;
          foursquare_id?: string | null;
          google_place_id?: string | null;
          hours?: Json | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          occasion_tags?: string[];
          phone?: string | null;
          photo_urls?: string[];
          price_level?: string | null;
          rating?: number | null;
          rating_count?: number | null;
          raw_data?: Json;
          source?: string;
          state?: string | null;
          subcategory?: string | null;
          vibe_tags?: string[];
          website?: string | null;
        };
        Relationships: [];
      };
      venue_claims: {
        Row: {
          admin_note: string | null;
          advertiser_id: string;
          contact_email: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          proof_url: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          updated_at: string;
          venue_id: string;
          verification_tier: string;
        };
        Insert: {
          admin_note?: string | null;
          advertiser_id: string;
          contact_email?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          proof_url?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string;
          venue_id: string;
          verification_tier?: string;
        };
        Update: {
          admin_note?: string | null;
          advertiser_id?: string;
          contact_email?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          proof_url?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string;
          venue_id?: string;
          verification_tier?: string;
        };
        Relationships: [];
      };
      venue_feedback: {
        Row: {
          action: string;
          context: Json | null;
          created_at: string;
          id: string;
          rating: number | null;
          user_id: string;
          venue_id: string;
        };
        Insert: {
          action: string;
          context?: Json | null;
          created_at?: string;
          id?: string;
          rating?: number | null;
          user_id: string;
          venue_id: string;
        };
        Update: {
          action?: string;
          context?: Json | null;
          created_at?: string;
          id?: string;
          rating?: number | null;
          user_id?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "venue_feedback_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      venue_intel: {
        Row: {
          address: string | null;
          category: string | null;
          city: string | null;
          created_at: string;
          curator_notes: string | null;
          data_sources: string[];
          description: string | null;
          google_rating: number | null;
          google_review_count: number;
          google_types: string[];
          hours: Json | null;
          image_url: string | null;
          is_featured: boolean;
          is_trending: boolean;
          last_fetched_at: string | null;
          latitude: number | null;
          longitude: number | null;
          manually_added: boolean;
          name: string;
          neighborhood: string | null;
          phone: string | null;
          place_id: string;
          price_range: string | null;
          subcategory: string | null;
          tags: string[];
          tiktok_hashtags: string[];
          tiktok_last_viral_at: string | null;
          tiktok_mention_count: number;
          tiktok_video_urls: Json | null;
          trending_score: number;
          updated_at: string;
          web_snippet: string | null;
          website: string | null;
          yelp_id: string | null;
          yelp_rating: number | null;
          yelp_review_count: number;
          yelp_url: string | null;
        };
        Insert: {
          address?: string | null;
          category?: string | null;
          city?: string | null;
          created_at?: string;
          curator_notes?: string | null;
          data_sources?: string[];
          description?: string | null;
          google_rating?: number | null;
          google_review_count?: number;
          google_types?: string[];
          hours?: Json | null;
          image_url?: string | null;
          is_featured?: boolean;
          is_trending?: boolean;
          last_fetched_at?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          manually_added?: boolean;
          name: string;
          neighborhood?: string | null;
          phone?: string | null;
          place_id: string;
          price_range?: string | null;
          subcategory?: string | null;
          tags?: string[];
          tiktok_hashtags?: string[];
          tiktok_last_viral_at?: string | null;
          tiktok_mention_count?: number;
          tiktok_video_urls?: Json | null;
          trending_score?: number;
          updated_at?: string;
          web_snippet?: string | null;
          website?: string | null;
          yelp_id?: string | null;
          yelp_rating?: number | null;
          yelp_review_count?: number;
          yelp_url?: string | null;
        };
        Update: {
          address?: string | null;
          category?: string | null;
          city?: string | null;
          created_at?: string;
          curator_notes?: string | null;
          data_sources?: string[];
          description?: string | null;
          google_rating?: number | null;
          google_review_count?: number;
          google_types?: string[];
          hours?: Json | null;
          image_url?: string | null;
          is_featured?: boolean;
          is_trending?: boolean;
          last_fetched_at?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          manually_added?: boolean;
          name?: string;
          neighborhood?: string | null;
          phone?: string | null;
          place_id?: string;
          price_range?: string | null;
          subcategory?: string | null;
          tags?: string[];
          tiktok_hashtags?: string[];
          tiktok_last_viral_at?: string | null;
          tiktok_mention_count?: number;
          tiktok_video_urls?: Json | null;
          trending_score?: number;
          updated_at?: string;
          web_snippet?: string | null;
          website?: string | null;
          yelp_id?: string | null;
          yelp_rating?: number | null;
          yelp_review_count?: number;
          yelp_url?: string | null;
        };
        Relationships: [];
      };
      venue_menu_highlights: {
        Row: {
          dietary_tags: string[];
          id: string;
          item_name: string;
          price: number | null;
          spice_level: number;
          venue_id: string;
        };
        Insert: {
          dietary_tags?: string[];
          id?: string;
          item_name: string;
          price?: number | null;
          spice_level?: number;
          venue_id: string;
        };
        Update: {
          dietary_tags?: string[];
          id?: string;
          item_name?: string;
          price?: number | null;
          spice_level?: number;
          venue_id?: string;
        };
        Relationships: [];
      };
      venue_parking: {
        Row: {
          distance_minutes: number;
          estimated_cost: number | null;
          id: string;
          label: string;
          notes: string | null;
          venue_id: string;
        };
        Insert: {
          distance_minutes: number;
          estimated_cost?: number | null;
          id?: string;
          label: string;
          notes?: string | null;
          venue_id: string;
        };
        Update: {
          distance_minutes?: number;
          estimated_cost?: number | null;
          id?: string;
          label?: string;
          notes?: string | null;
          venue_id?: string;
        };
        Relationships: [];
      };
      venue_quality_scores: {
        Row: {
          avg_dwell_minutes: number | null;
          avg_rating: number;
          city_code: string | null;
          completion_rate: number;
          computed_at: string;
          confidence: number;
          dwell_score: number;
          quality_score: number;
          return_rate: number;
          sample_size: number;
          social_amplifications: number;
          social_share_rate: number;
          total_party_size_30d: number;
          venue_id: string;
          venue_name: string | null;
          verified_visits_30d: number;
          visit_velocity: number;
        };
        Insert: {
          avg_dwell_minutes?: number | null;
          avg_rating?: number;
          city_code?: string | null;
          completion_rate?: number;
          computed_at?: string;
          confidence?: number;
          dwell_score?: number;
          quality_score?: number;
          return_rate?: number;
          sample_size?: number;
          social_amplifications?: number;
          social_share_rate?: number;
          total_party_size_30d?: number;
          venue_id: string;
          venue_name?: string | null;
          verified_visits_30d?: number;
          visit_velocity?: number;
        };
        Update: {
          avg_dwell_minutes?: number | null;
          avg_rating?: number;
          city_code?: string | null;
          completion_rate?: number;
          computed_at?: string;
          confidence?: number;
          dwell_score?: number;
          quality_score?: number;
          return_rate?: number;
          sample_size?: number;
          social_amplifications?: number;
          social_share_rate?: number;
          total_party_size_30d?: number;
          venue_id?: string;
          venue_name?: string | null;
          verified_visits_30d?: number;
          visit_velocity?: number;
        };
        Relationships: [];
      };
      venues: {
        Row: {
          address: string | null;
          avg_user_rating: number | null;
          city: string;
          created_at: string;
          cuisine: string | null;
          cuisine_tags: string[] | null;
          hours: Json | null;
          id: string;
          is_active: boolean | null;
          is_verified: boolean | null;
          last_recommended: string | null;
          lat: number | null;
          lng: number | null;
          metro_accessible: boolean | null;
          name: string;
          neighborhood: string | null;
          occasion_tags: string[] | null;
          phone: string | null;
          photo_url: string | null;
          popularity_score: number | null;
          price: string | null;
          price_level: number | null;
          rating: number | null;
          rating_count: number | null;
          slug: string;
          source_credit: string | null;
          state: string | null;
          times_accepted: number | null;
          times_recommended: number | null;
          times_rejected: number | null;
          updated_at: string;
          vibe_notes: string | null;
          vibe_tags: string[] | null;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          avg_user_rating?: number | null;
          city: string;
          created_at?: string;
          cuisine?: string | null;
          cuisine_tags?: string[] | null;
          hours?: Json | null;
          id: string;
          is_active?: boolean | null;
          is_verified?: boolean | null;
          last_recommended?: string | null;
          lat?: number | null;
          lng?: number | null;
          metro_accessible?: boolean | null;
          name: string;
          neighborhood?: string | null;
          occasion_tags?: string[] | null;
          phone?: string | null;
          photo_url?: string | null;
          popularity_score?: number | null;
          price?: string | null;
          price_level?: number | null;
          rating?: number | null;
          rating_count?: number | null;
          slug: string;
          source_credit?: string | null;
          state?: string | null;
          times_accepted?: number | null;
          times_recommended?: number | null;
          times_rejected?: number | null;
          updated_at?: string;
          vibe_notes?: string | null;
          vibe_tags?: string[] | null;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          avg_user_rating?: number | null;
          city?: string;
          created_at?: string;
          cuisine?: string | null;
          cuisine_tags?: string[] | null;
          hours?: Json | null;
          id?: string;
          is_active?: boolean | null;
          is_verified?: boolean | null;
          last_recommended?: string | null;
          lat?: number | null;
          lng?: number | null;
          metro_accessible?: boolean | null;
          name?: string;
          neighborhood?: string | null;
          occasion_tags?: string[] | null;
          phone?: string | null;
          photo_url?: string | null;
          popularity_score?: number | null;
          price?: string | null;
          price_level?: number | null;
          rating?: number | null;
          rating_count?: number | null;
          slug?: string;
          source_credit?: string | null;
          state?: string | null;
          times_accepted?: number | null;
          times_recommended?: number | null;
          times_rejected?: number | null;
          updated_at?: string;
          vibe_notes?: string | null;
          vibe_tags?: string[] | null;
          website?: string | null;
        };
        Relationships: [];
      };
      verification_requests: {
        Row: {
          admin_notes: string | null;
          ai_flags: string[];
          ai_recommendation: string | null;
          ai_score: number | null;
          documents: Json;
          entity_address: string | null;
          entity_name: string;
          entity_phone: string | null;
          entity_website: string | null;
          expires_at: string | null;
          id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          risk_level: string;
          status: string;
          submitted_at: string;
          type: string;
          user_email: string;
          user_id: string;
        };
        Insert: {
          admin_notes?: string | null;
          ai_flags?: string[];
          ai_recommendation?: string | null;
          ai_score?: number | null;
          documents?: Json;
          entity_address?: string | null;
          entity_name: string;
          entity_phone?: string | null;
          entity_website?: string | null;
          expires_at?: string | null;
          id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          risk_level?: string;
          status?: string;
          submitted_at?: string;
          type: string;
          user_email: string;
          user_id: string;
        };
        Update: {
          admin_notes?: string | null;
          ai_flags?: string[];
          ai_recommendation?: string | null;
          ai_score?: number | null;
          documents?: Json;
          entity_address?: string | null;
          entity_name?: string;
          entity_phone?: string | null;
          entity_website?: string | null;
          expires_at?: string | null;
          id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          risk_level?: string;
          status?: string;
          submitted_at?: string;
          type?: string;
          user_email?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "verification_requests_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "verification_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      viral_discovery_runs: {
        Row: {
          candidates_found: number;
          city: string | null;
          duration_ms: number | null;
          error: string | null;
          finished_at: string | null;
          id: string;
          queries_run: number;
          started_at: string;
          venues_upserted: number;
        };
        Insert: {
          candidates_found?: number;
          city?: string | null;
          duration_ms?: number | null;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          queries_run?: number;
          started_at?: string;
          venues_upserted?: number;
        };
        Update: {
          candidates_found?: number;
          city?: string | null;
          duration_ms?: number | null;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          queries_run?: number;
          started_at?: string;
          venues_upserted?: number;
        };
        Relationships: [];
      };
      viral_venues: {
        Row: {
          address: string | null;
          city: string;
          discovered_at: string;
          google_place_id: string | null;
          id: string;
          last_mentioned_at: string;
          lat: number | null;
          lng: number | null;
          mention_count: number;
          neighborhood: string | null;
          normalized_name: string;
          photo_url: string | null;
          rating: number | null;
          refreshed_at: string;
          source_urls: Json;
          summary: string | null;
          tags: string[];
          trend_score: number;
          venue_name: string;
          verified: boolean;
        };
        Insert: {
          address?: string | null;
          city: string;
          discovered_at?: string;
          google_place_id?: string | null;
          id?: string;
          last_mentioned_at?: string;
          lat?: number | null;
          lng?: number | null;
          mention_count?: number;
          neighborhood?: string | null;
          normalized_name: string;
          photo_url?: string | null;
          rating?: number | null;
          refreshed_at?: string;
          source_urls?: Json;
          summary?: string | null;
          tags?: string[];
          trend_score?: number;
          venue_name: string;
          verified?: boolean;
        };
        Update: {
          address?: string | null;
          city?: string;
          discovered_at?: string;
          google_place_id?: string | null;
          id?: string;
          last_mentioned_at?: string;
          lat?: number | null;
          lng?: number | null;
          mention_count?: number;
          neighborhood?: string | null;
          normalized_name?: string;
          photo_url?: string | null;
          rating?: number | null;
          refreshed_at?: string;
          source_urls?: Json;
          summary?: string | null;
          tags?: string[];
          trend_score?: number;
          venue_name?: string;
          verified?: boolean;
        };
        Relationships: [];
      };
      wallet_passes: {
        Row: {
          barcode: string;
          barcode_format: string;
          created_at: string | null;
          credit_balance: number;
          id: string;
          last_updated: string | null;
          pass_url: string;
          platform: string;
          serial_number: string;
          status: string;
          tier: string;
          user_id: string;
        };
        Insert: {
          barcode: string;
          barcode_format?: string;
          created_at?: string | null;
          credit_balance?: number;
          id: string;
          last_updated?: string | null;
          pass_url: string;
          platform: string;
          serial_number: string;
          status?: string;
          tier?: string;
          user_id: string;
        };
        Update: {
          barcode?: string;
          barcode_format?: string;
          created_at?: string | null;
          credit_balance?: number;
          id?: string;
          last_updated?: string | null;
          pass_url?: string;
          platform?: string;
          serial_number?: string;
          status?: string;
          tier?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      venue_business_metrics: {
        Row: {
          avg_dwell_minutes: number | null;
          city_code: string | null;
          last_visit_at: string | null;
          quality_score: number | null;
          returning_visitors: number | null;
          social_shares: number | null;
          total_attributed_visits: number | null;
          total_guests_attributed: number | null;
          unique_visitors: number | null;
          venue_id: string | null;
          venue_name: string | null;
          verified_checkins: number | null;
          visit_velocity: number | null;
          visits_last_30d: number | null;
          visits_last_7d: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      auto_approve_venues: { Args: { target_city?: string }; Returns: number };
      check_corporate_booking_policy: {
        Args: {
          p_company_id: string;
          p_estimated_cost: number;
          p_party_size: number;
          p_scheduled_date: string;
          p_team_id: string;
        };
        Returns: Json;
      };
      check_reconsent_needed: {
        Args: { p_user_id: string };
        Returns: {
          category_key: string;
          current_version: string;
          document_key: string;
          latest_version: string;
        }[];
      };
      consume_rate_limit: {
        Args: { p_burst: number; p_key: string; p_refill_per_sec: number };
        Returns: boolean;
      };
      deduct_boost_budget: {
        Args: { p_amount: number; p_campaign_id: string };
        Returns: Json;
      };
      gc_processed_trigger_events: { Args: never; Returns: undefined };
      gc_rate_limit_buckets: { Args: never; Returns: undefined };
      get_consent_status: { Args: { p_user_id: string }; Returns: Json };
      get_expiring_contracts: {
        Args: { days_ahead?: number };
        Returns: {
          alert_level: string;
          business_id: string;
          contract_id: string;
          days_until_expiry: number;
          end_date: string;
          partner_id: string;
          title: string;
        }[];
      };
      grant_consent: {
        Args: {
          p_category_key: string;
          p_device_id?: string;
          p_ip_hash?: string;
          p_method: string;
          p_session_id?: string;
          p_user_agent?: string;
          p_user_id: string;
          p_version: string;
        };
        Returns: undefined;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_admin: { Args: never; Returns: boolean };
      recalculate_business_boosts: { Args: never; Returns: undefined };
      recalculate_buzz_score: { Args: { venue_id: string }; Returns: number };
      refresh_trending_venues: { Args: never; Returns: undefined };
      reset_monthly_plans: { Args: never; Returns: undefined };
      resolve_login_identifier: {
        Args: { login_identifier: string };
        Returns: string;
      };
      venue_category_to_outing_tags: {
        Args: { cat: string };
        Returns: string[];
      };
      withdraw_consent: {
        Args: {
          p_category_key: string;
          p_device_id?: string;
          p_ip_hash?: string;
          p_method?: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      agent_layer: "frontend" | "backend";
      agent_msg_type:
        | "task_handoff"
        | "status_update"
        | "alert"
        | "request"
        | "response"
        | "broadcast";
      agent_status: "active" | "idle" | "error" | "disabled";
      agent_task_priority: "critical" | "high" | "medium" | "low";
      agent_task_status: "backlog" | "in_progress" | "review" | "done";
      app_role: "admin" | "customer";
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
        | "disputed";
      promoter_payout_status: "pending" | "processing" | "paid" | "failed" | "reversed";
      promoter_status: "pending" | "approved" | "suspended" | "rejected";
      promoter_submission_status: "pending" | "approved" | "rejected" | "needs_revision";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      agent_layer: ["frontend", "backend"],
      agent_msg_type: [
        "task_handoff",
        "status_update",
        "alert",
        "request",
        "response",
        "broadcast",
      ],
      agent_status: ["active", "idle", "error", "disabled"],
      agent_task_priority: ["critical", "high", "medium", "low"],
      agent_task_status: ["backlog", "in_progress", "review", "done"],
      app_role: ["admin", "customer"],
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
      promoter_payout_status: ["pending", "processing", "paid", "failed", "reversed"],
      promoter_status: ["pending", "approved", "suspended", "rejected"],
      promoter_submission_status: ["pending", "approved", "rejected", "needs_revision"],
    },
  },
} as const;
