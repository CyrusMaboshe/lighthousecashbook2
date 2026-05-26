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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          details: Json | null
          id: string
          performed_by: string
          performed_by_user_id: string | null
          timestamp: string
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          performed_by: string
          performed_by_user_id?: string | null
          timestamp?: string
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          performed_by?: string
          performed_by_user_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_performed_by_user_id_fkey"
            columns: ["performed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      automatic_reports: {
        Row: {
          category_breakdown: Json | null
          generated_at: string | null
          id: string
          month: number
          net_balance: number | null
          report_data: Json | null
          total_cash_in: number | null
          total_cash_out: number | null
          transaction_count: number | null
          year: number
        }
        Insert: {
          category_breakdown?: Json | null
          generated_at?: string | null
          id?: string
          month: number
          net_balance?: number | null
          report_data?: Json | null
          total_cash_in?: number | null
          total_cash_out?: number | null
          transaction_count?: number | null
          year: number
        }
        Update: {
          category_breakdown?: Json | null
          generated_at?: string | null
          id?: string
          month?: number
          net_balance?: number | null
          report_data?: Json | null
          total_cash_in?: number | null
          total_cash_out?: number | null
          transaction_count?: number | null
          year?: number
        }
        Relationships: []
      }
      campaign_admin_logs: {
        Row: {
          action: string
          campaign_id: string
          details: Json | null
          id: string
          timestamp: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          action: string
          campaign_id: string
          details?: Json | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          action?: string
          campaign_id?: string
          details?: Json | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_admin_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_categories: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_categories_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_transactions: {
        Row: {
          added_by: string
          added_by_user_id: string | null
          amount: number
          campaign_id: string
          category_name: string
          created_at: string | null
          customer_name: string
          date: string
          details: string | null
          id: string
          number_of_pictures: number | null
          time: string | null
          type: string
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          added_by: string
          added_by_user_id?: string | null
          amount: number
          campaign_id: string
          category_name: string
          created_at?: string | null
          customer_name: string
          date?: string
          details?: string | null
          id?: string
          number_of_pictures?: number | null
          time?: string | null
          type: string
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          added_by?: string
          added_by_user_id?: string | null
          amount?: number
          campaign_id?: string
          category_name?: string
          created_at?: string | null
          customer_name?: string
          date?: string
          details?: string | null
          id?: string
          number_of_pictures?: number | null
          time?: string | null
          type?: string
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_users: {
        Row: {
          campaign_id: string
          created_at: string | null
          created_by_user_id: string | null
          created_by_username: string
          email: string
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          last_login: string | null
          password_hash: string
          role: string
          updated_at: string | null
          username: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          created_by_user_id?: string | null
          created_by_username: string
          email: string
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          last_login?: string | null
          password_hash: string
          role: string
          updated_at?: string | null
          username: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          created_by_user_id?: string | null
          created_by_username?: string
          email?: string
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          last_login?: string | null
          password_hash?: string
          role?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_users_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          created_by_username: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          created_by_username: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          created_by_username?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cash_reserve_balance: {
        Row: {
          current_balance: number
          id: string
          last_updated: string
          updated_by: string
          updated_by_user_id: string | null
        }
        Insert: {
          current_balance?: number
          id?: string
          last_updated?: string
          updated_by: string
          updated_by_user_id?: string | null
        }
        Update: {
          current_balance?: number
          id?: string
          last_updated?: string
          updated_by?: string
          updated_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_reserve_balance_updated_by_user_id_fkey"
            columns: ["updated_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_reserve_transactions: {
        Row: {
          action_type: string
          amount: number
          created_at: string
          date: string
          id: string
          initiating_user: string
          initiating_user_id: string | null
          note: string | null
          time: string | null
          updated_at: string
        }
        Insert: {
          action_type: string
          amount: number
          created_at?: string
          date?: string
          id?: string
          initiating_user: string
          initiating_user_id?: string | null
          note?: string | null
          time?: string | null
          updated_at?: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string
          date?: string
          id?: string
          initiating_user?: string
          initiating_user_id?: string | null
          note?: string | null
          time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_reserve_transactions_initiating_user_id_fkey"
            columns: ["initiating_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cashvault_balance: {
        Row: {
          current_balance: number
          id: string
          last_updated: string
          updated_by: string
          updated_by_user_id: string | null
        }
        Insert: {
          current_balance?: number
          id?: string
          last_updated?: string
          updated_by: string
          updated_by_user_id?: string | null
        }
        Update: {
          current_balance?: number
          id?: string
          last_updated?: string
          updated_by?: string
          updated_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashvault_balance_updated_by_user_id_fkey"
            columns: ["updated_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cashvault_transactions: {
        Row: {
          action_type: string
          amount: number
          created_at: string
          date: string
          id: string
          initiating_user: string
          initiating_user_id: string | null
          note: string | null
          time: string | null
          updated_at: string
        }
        Insert: {
          action_type: string
          amount: number
          created_at?: string
          date?: string
          id?: string
          initiating_user: string
          initiating_user_id?: string | null
          note?: string | null
          time?: string | null
          updated_at?: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string
          date?: string
          id?: string
          initiating_user?: string
          initiating_user_id?: string | null
          note?: string | null
          time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashvault_transactions_initiating_user_id_fkey"
            columns: ["initiating_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          admin_email: string | null
          created_at: string | null
          id: string
          name: string
          owner_clerk_user_id: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          admin_email?: string | null
          created_at?: string | null
          id?: string
          name: string
          owner_clerk_user_id?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          admin_email?: string | null
          created_at?: string | null
          id?: string
          name?: string
          owner_clerk_user_id?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string | null
          id: string
          joined_at: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          title: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      core_plan: {
        Row: {
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      emergency_fund_balance: {
        Row: {
          current_balance: number
          id: string
          last_updated: string | null
          updated_by: string
          updated_by_user_id: string | null
        }
        Insert: {
          current_balance?: number
          id?: string
          last_updated?: string | null
          updated_by?: string
          updated_by_user_id?: string | null
        }
        Update: {
          current_balance?: number
          id?: string
          last_updated?: string | null
          updated_by?: string
          updated_by_user_id?: string | null
        }
        Relationships: []
      }
      emergency_fund_transactions: {
        Row: {
          action_type: string
          amount: number
          created_at: string | null
          date: string
          id: string
          initiating_user: string
          initiating_user_id: string | null
          note: string | null
          time: string
          updated_at: string | null
        }
        Insert: {
          action_type: string
          amount: number
          created_at?: string | null
          date?: string
          id?: string
          initiating_user: string
          initiating_user_id?: string | null
          note?: string | null
          time?: string
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string | null
          date?: string
          id?: string
          initiating_user?: string
          initiating_user_id?: string | null
          note?: string | null
          time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gallery_bookings: {
        Row: {
          additional_notes: string | null
          booking_date: string
          booking_time: string | null
          category_id: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          event_location: string | null
          event_type: string
          id: string
          image_id: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          additional_notes?: string | null
          booking_date: string
          booking_time?: string | null
          category_id?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          event_location?: string | null
          event_type: string
          id?: string
          image_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          additional_notes?: string | null
          booking_date?: string
          booking_time?: string | null
          category_id?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          event_location?: string | null
          event_type?: string
          id?: string
          image_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_bookings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gallery_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_bookings_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "gallery_images"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          category_id: string | null
          created_at: string | null
          created_by_user_id: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          is_featured: boolean | null
          price: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          is_featured?: boolean | null
          price?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          price?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gallery_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          booking_type: string
          created_at: string
          created_by: string
          created_by_user_id: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          date: string
          discount: number
          discount_amount: number
          id: string
          invoice_id: string
          items: Json
          notes: string | null
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          booking_type: string
          created_at?: string
          created_by: string
          created_by_user_id?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          date: string
          discount?: number
          discount_amount?: number
          id?: string
          invoice_id: string
          items?: Json
          notes?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          booking_type?: string
          created_at?: string
          created_by?: string
          created_by_user_id?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          date?: string
          discount?: number
          discount_amount?: number
          id?: string
          invoice_id?: string
          items?: Json
          notes?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          message_type: string | null
          priority: string | null
          read_by: Json | null
          sender: string
          sender_role: string
          sender_user_id: string | null
          title: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          message_type?: string | null
          priority?: string | null
          read_by?: Json | null
          sender: string
          sender_role: string
          sender_user_id?: string | null
          title?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          message_type?: string | null
          priority?: string | null
          read_by?: Json | null
          sender?: string
          sender_role?: string
          sender_user_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_reports: {
        Row: {
          generated_at: string
          id: string
          month: number
          net_balance: number | null
          report_data: Json | null
          top_categories: Json | null
          total_cash_in: number | null
          total_cash_out: number | null
          transaction_count: number | null
          year: number
        }
        Insert: {
          generated_at?: string
          id?: string
          month: number
          net_balance?: number | null
          report_data?: Json | null
          top_categories?: Json | null
          total_cash_in?: number | null
          total_cash_out?: number | null
          transaction_count?: number | null
          year: number
        }
        Update: {
          generated_at?: string
          id?: string
          month?: number
          net_balance?: number | null
          report_data?: Json | null
          top_categories?: Json | null
          total_cash_in?: number | null
          total_cash_out?: number | null
          transaction_count?: number | null
          year?: number
        }
        Relationships: []
      }
      mt_companies: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mt_company_admins: {
        Row: {
          access_expires_at: string | null
          access_restored_at: string | null
          access_revoked: boolean | null
          access_revoked_at: string | null
          access_revoked_reason: string | null
          company_id: string
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          password_hash: string
          role: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          access_expires_at?: string | null
          access_restored_at?: string | null
          access_revoked?: boolean | null
          access_revoked_at?: string | null
          access_revoked_reason?: string | null
          company_id: string
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          password_hash: string
          role?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          access_expires_at?: string | null
          access_restored_at?: string | null
          access_revoked?: boolean | null
          access_revoked_at?: string | null
          access_revoked_reason?: string | null
          company_id?: string
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          password_hash?: string
          role?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_company_admins_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mt_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_company_categories: {
        Row: {
          company_id: string
          created_at: string | null
          created_by_user_id: string | null
          created_by_username: string
          id: string
          name: string
          type: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by_user_id?: string | null
          created_by_username: string
          id?: string
          name: string
          type?: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by_user_id?: string | null
          created_by_username?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_company_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mt_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_company_messages: {
        Row: {
          company_id: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          message_type: string | null
          sender: string
          sender_role: string
        }
        Insert: {
          company_id: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          message_type?: string | null
          sender: string
          sender_role: string
        }
        Update: {
          company_id?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          message_type?: string | null
          sender?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_company_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mt_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_company_notifications: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          id: string
          is_read: boolean | null
          message: string
          priority: string
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          id?: string
          is_read?: boolean | null
          message: string
          priority?: string
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_read?: boolean | null
          message?: string
          priority?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_company_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mt_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_company_reserve_balances: {
        Row: {
          company_id: string
          created_at: string
          current_balance: number
          id: string
          last_updated: string
          reserve_kind: string
          updated_by: string
          updated_by_user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          current_balance?: number
          id?: string
          last_updated?: string
          reserve_kind: string
          updated_by?: string
          updated_by_user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          current_balance?: number
          id?: string
          last_updated?: string
          reserve_kind?: string
          updated_by?: string
          updated_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mt_company_reserve_balances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mt_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_company_reserve_transactions: {
        Row: {
          action_type: string
          amount: number
          balance_after: number
          balance_before: number
          company_id: string
          created_at: string
          date: string
          description: string | null
          id: string
          initiating_user: string
          initiating_user_id: string | null
          reserve_kind: string
          time: string | null
          updated_at: string
        }
        Insert: {
          action_type: string
          amount: number
          balance_after?: number
          balance_before?: number
          company_id: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          initiating_user: string
          initiating_user_id?: string | null
          reserve_kind: string
          time?: string | null
          updated_at?: string
        }
        Update: {
          action_type?: string
          amount?: number
          balance_after?: number
          balance_before?: number
          company_id?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          initiating_user?: string
          initiating_user_id?: string | null
          reserve_kind?: string
          time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_company_reserve_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mt_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_company_targets: {
        Row: {
          category: string
          company_id: string
          created_at: string | null
          created_by_username: string
          current_amount: number | null
          description: string | null
          id: string
          status: string | null
          target_amount: number
          target_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string | null
          created_by_username: string
          current_amount?: number | null
          description?: string | null
          id?: string
          status?: string | null
          target_amount: number
          target_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string | null
          created_by_username?: string
          current_amount?: number | null
          description?: string | null
          id?: string
          status?: string | null
          target_amount?: number
          target_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mt_company_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mt_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_company_todos: {
        Row: {
          assigned_to: string | null
          company_id: string
          completed_at: string | null
          created_at: string | null
          created_by_username: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by_username: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by_username?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mt_company_todos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mt_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_company_transactions: {
        Row: {
          added_by: string
          added_by_user_id: string
          amount: number
          category_name: string
          company_id: string
          created_at: string | null
          customer_name: string | null
          date: string
          details: string | null
          id: string
          number_of_pictures: number | null
          time: string | null
          type: string
          updated_at: string | null
          whatsapp_number: string | null
          withdrawn_by: string | null
          withdrawn_by_user_id: string | null
        }
        Insert: {
          added_by: string
          added_by_user_id: string
          amount: number
          category_name: string
          company_id: string
          created_at?: string | null
          customer_name?: string | null
          date?: string
          details?: string | null
          id?: string
          number_of_pictures?: number | null
          time?: string | null
          type: string
          updated_at?: string | null
          whatsapp_number?: string | null
          withdrawn_by?: string | null
          withdrawn_by_user_id?: string | null
        }
        Update: {
          added_by?: string
          added_by_user_id?: string
          amount?: number
          category_name?: string
          company_id?: string
          created_at?: string | null
          customer_name?: string | null
          date?: string
          details?: string | null
          id?: string
          number_of_pictures?: number | null
          time?: string | null
          type?: string
          updated_at?: string | null
          whatsapp_number?: string | null
          withdrawn_by?: string | null
          withdrawn_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mt_company_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mt_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_company_users: {
        Row: {
          access_expires_at: string | null
          access_restored_at: string | null
          access_revoked: boolean | null
          access_revoked_at: string | null
          access_revoked_reason: string | null
          company_id: string
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          password_hash: string
          role: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          access_expires_at?: string | null
          access_restored_at?: string | null
          access_revoked?: boolean | null
          access_revoked_at?: string | null
          access_revoked_reason?: string | null
          company_id: string
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          password_hash: string
          role?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          access_expires_at?: string | null
          access_restored_at?: string | null
          access_revoked?: boolean | null
          access_revoked_at?: string | null
          access_revoked_reason?: string | null
          company_id?: string
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          password_hash?: string
          role?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mt_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_super_admins: {
        Row: {
          created_at: string | null
          email: string
          id: string
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mt_user_preferences: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          selected_period: string | null
          selected_period_display: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          selected_period?: string | null
          selected_period_display?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          selected_period?: string | null
          selected_period_display?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_user_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mt_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      rebuilt_profiles: {
        Row: {
          clerk_user_id: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          clerk_user_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          clerk_user_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rebuilt_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      reserve_investment_allocations: {
        Row: {
          allocated_amount: number | null
          allocation_percent: number
          company_id: string | null
          created_at: string
          created_by: string
          created_by_user_id: string | null
          id: string
          is_active: boolean
          maturity_date: string | null
          max_allocation: number | null
          notes: string | null
          total_withdrawn: number
          updated_at: string
          user_display_name: string
          user_id: string
        }
        Insert: {
          allocated_amount?: number | null
          allocation_percent: number
          company_id?: string | null
          created_at?: string
          created_by?: string
          created_by_user_id?: string | null
          id?: string
          is_active?: boolean
          maturity_date?: string | null
          max_allocation?: number | null
          notes?: string | null
          total_withdrawn?: number
          updated_at?: string
          user_display_name: string
          user_id: string
        }
        Update: {
          allocated_amount?: number | null
          allocation_percent?: number
          company_id?: string | null
          created_at?: string
          created_by?: string
          created_by_user_id?: string | null
          id?: string
          is_active?: boolean
          maturity_date?: string | null
          max_allocation?: number | null
          notes?: string | null
          total_withdrawn?: number
          updated_at?: string
          user_display_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reserve_investment_allocations_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reserve_investment_config: {
        Row: {
          created_at: string
          id: string
          manual_studio_amount: number | null
          notes: string | null
          savings_percent: number
          total_reserve: number
          updated_at: string
          updated_by: string
          updated_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          manual_studio_amount?: number | null
          notes?: string | null
          savings_percent?: number
          total_reserve?: number
          updated_at?: string
          updated_by?: string
          updated_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          manual_studio_amount?: number | null
          notes?: string | null
          savings_percent?: number
          total_reserve?: number
          updated_at?: string
          updated_by?: string
          updated_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reserve_investment_config_updated_by_user_id_fkey"
            columns: ["updated_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reserve_investment_withdrawals: {
        Row: {
          allocation_id: string | null
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          date: string
          description: string | null
          id: string
          time: string | null
          updated_at: string
          user_display_name: string
          user_id: string
        }
        Insert: {
          allocation_id?: string | null
          amount: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          time?: string | null
          updated_at?: string
          user_display_name: string
          user_id: string
        }
        Update: {
          allocation_id?: string | null
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          time?: string | null
          updated_at?: string
          user_display_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reserve_investment_withdrawals_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "reserve_investment_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_balance: {
        Row: {
          current_balance: number
          id: string
          last_updated: string
          tenant_id: string | null
          updated_by: string
          updated_by_user_id: string | null
          user_id: string | null
        }
        Insert: {
          current_balance?: number
          id?: string
          last_updated?: string
          tenant_id?: string | null
          updated_by: string
          updated_by_user_id?: string | null
          user_id?: string | null
        }
        Update: {
          current_balance?: number
          id?: string
          last_updated?: string
          tenant_id?: string | null
          updated_by?: string
          updated_by_user_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_balance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_balance_updated_by_user_id_fkey"
            columns: ["updated_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_balance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_transactions: {
        Row: {
          action_type: string
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          date: string
          description: string | null
          id: string
          initiating_user: string
          initiating_user_id: string | null
          tenant_id: string | null
          time: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          initiating_user: string
          initiating_user_id?: string | null
          tenant_id?: string | null
          time?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          initiating_user?: string
          initiating_user_id?: string | null
          tenant_id?: string | null
          time?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_transactions_initiating_user_id_fkey"
            columns: ["initiating_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_documents: {
        Row: {
          author_id: string | null
          content: Json | null
          created_at: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content?: Json | null
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: Json | null
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_documents_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          added_by: string
          added_by_user_id: string | null
          amount: number
          category_id: string | null
          category_name: string
          created_at: string
          customer_name: string
          date: string
          details: string | null
          id: string
          number_of_pictures: number | null
          tenant_id: string | null
          time: string | null
          type: string
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          added_by: string
          added_by_user_id?: string | null
          amount: number
          category_id?: string | null
          category_name: string
          created_at?: string
          customer_name: string
          date: string
          details?: string | null
          id?: string
          number_of_pictures?: number | null
          tenant_id?: string | null
          time?: string | null
          type: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          added_by?: string
          added_by_user_id?: string | null
          amount?: number
          category_id?: string | null
          category_name?: string
          created_at?: string
          customer_name?: string
          date?: string
          details?: string | null
          id?: string
          number_of_pictures?: number | null
          tenant_id?: string | null
          time?: string | null
          type?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_added_by_user_id_fkey"
            columns: ["added_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_balance_overrides: {
        Row: {
          created_at: string
          effective_balance: number
          id: string
          is_active: boolean
          original_balance: number
          override_reason: string
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          created_at?: string
          effective_balance?: number
          id?: string
          is_active?: boolean
          original_balance?: number
          override_reason: string
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          created_at?: string
          effective_balance?: number
          id?: string
          is_active?: boolean
          original_balance?: number
          override_reason?: string
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_balance_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_logs: {
        Row: {
          action_description: string
          action_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          action_description: string
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          action_description?: string
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          hide_homepage_balance: boolean | null
          id: string
          push_notifications_enabled: boolean | null
          show_balances: boolean | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          hide_homepage_balance?: boolean | null
          id?: string
          push_notifications_enabled?: boolean | null
          show_balances?: boolean | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          hide_homepage_balance?: boolean | null
          id?: string
          push_notifications_enabled?: boolean | null
          show_balances?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_targets: {
        Row: {
          category: string
          created_at: string | null
          current_amount: number
          description: string | null
          id: string
          status: string
          target_amount: number
          target_date: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          current_amount?: number
          description?: string | null
          id?: string
          status?: string
          target_amount?: number
          target_date?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          current_amount?: number
          description?: string | null
          id?: string
          status?: string
          target_amount?: number
          target_date?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_todos: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_user_id: string | null
          clerk_user_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          is_super_admin: boolean | null
          password_hash: string
          profile_picture_url: string | null
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          auth_user_id?: string | null
          clerk_user_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          password_hash: string
          profile_picture_url?: string | null
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          auth_user_id?: string | null
          clerk_user_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          password_hash?: string
          profile_picture_url?: string | null
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_all_savings: { Args: never; Returns: Json }
      cash_out_from_cash_reserve: {
        Args: { amount_param: number; note_param?: string; user_name?: string }
        Returns: Json
      }
      cash_out_from_cashvault:
        | {
            Args: {
              amount_param: number
              note_param?: string
              user_name?: string
            }
            Returns: Json
          }
        | {
            Args: {
              amount_param: number
              note_param?: string
              transaction_date?: string
              user_name?: string
            }
            Returns: Json
          }
      cash_out_to_cash_reserve: {
        Args: { amount_param: number; note_param?: string; user_name?: string }
        Returns: Json
      }
      cash_out_to_cashvault:
        | {
            Args: {
              amount_param: number
              note_param?: string
              user_name?: string
            }
            Returns: Json
          }
        | {
            Args: {
              amount_param: number
              note_param?: string
              transaction_date?: string
              user_name?: string
            }
            Returns: Json
          }
      create_default_campaign_categories: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      create_default_mt_categories: {
        Args: { p_company_id: string; p_username: string }
        Returns: undefined
      }
      create_default_mt_company_categories: {
        Args: { p_company_id: string; p_created_by_username: string }
        Returns: undefined
      }
      create_direct_conversation: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      create_group_conversation: {
        Args: { creator_id: string; participant_ids: string[]; title: string }
        Returns: string
      }
      deposit_to_emergency_fund: {
        Args: {
          amount_param: number
          note_param?: string
          transaction_date?: string
          user_username?: string
        }
        Returns: Json
      }
      deposit_to_savings:
        | {
            Args: {
              amount_param: number
              description_param?: string
              user_name?: string
            }
            Returns: Json
          }
        | {
            Args: {
              amount_param: number
              description_param?: string
              transaction_date?: string
              user_name?: string
            }
            Returns: Json
          }
      generate_automatic_monthly_report: {
        Args: { target_month: number; target_year: number }
        Returns: string
      }
      generate_monthly_report: {
        Args: { report_month: number; report_year: number }
        Returns: string
      }
      get_current_savings_balance: { Args: never; Returns: Json }
      get_mt_company_stats: {
        Args: { p_company_id: string }
        Returns: {
          net_balance: number
          total_cash_in: number
          total_cash_out: number
          total_pictures: number
          total_transactions: number
        }[]
      }
      get_mt_company_transaction_stats: {
        Args: { p_company_id: string }
        Returns: {
          net_balance: number
          total_cash_in: number
          total_cash_out: number
          total_pictures: number
          total_transactions: number
        }[]
      }
      get_system_balance_status: { Args: never; Returns: Json }
      get_user_savings_balance: { Args: { p_user_id: string }; Returns: Json }
      log_user_action: {
        Args: {
          p_action_description: string
          p_action_type: string
          p_details?: Json
          p_ip_address?: string
          p_user_agent?: string
          p_user_id: string
          p_username: string
        }
        Returns: string
      }
      mt_reserve_apply: {
        Args: {
          p_action_type: string
          p_amount: number
          p_company_id: string
          p_description?: string
          p_initiating_user: string
          p_initiating_user_id?: string
          p_reserve_kind: string
        }
        Returns: number
      }
      test_cashvault_deposit: { Args: { amount_param: number }; Returns: Json }
      user_deposit_to_savings: {
        Args: {
          amount_param: number
          description_param?: string
          p_user_id: string
          transaction_date?: string
          user_name?: string
        }
        Returns: Json
      }
      user_withdraw_from_savings: {
        Args: {
          amount_param: number
          description_param?: string
          p_user_id: string
          transaction_date?: string
          user_name?: string
        }
        Returns: Json
      }
      withdraw_cash_from_emergency_fund: {
        Args: {
          amount_param: number
          note_param?: string
          transaction_date?: string
          user_username?: string
        }
        Returns: Json
      }
      withdraw_cash_from_vault: {
        Args: { amount_param: number; note_param?: string; user_name?: string }
        Returns: Json
      }
      withdraw_from_emergency_fund: {
        Args: {
          amount_param: number
          note_param?: string
          transaction_date?: string
          user_username?: string
        }
        Returns: Json
      }
      withdraw_from_savings:
        | {
            Args: {
              amount_param: number
              description_param?: string
              user_name?: string
            }
            Returns: Json
          }
        | {
            Args: {
              amount_param: number
              description_param?: string
              transaction_date?: string
              user_name?: string
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
    Enums: {},
  },
} as const
