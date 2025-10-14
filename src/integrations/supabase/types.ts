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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bias_colors: {
        Row: {
          cmyk: string
          created_at: string
          hex: string
          id: string
          is_active: boolean | null
          name: string
          price_per_meter: number | null
          stock_product_id: string | null
          updated_at: string
        }
        Insert: {
          cmyk: string
          created_at?: string
          hex: string
          id?: string
          is_active?: boolean | null
          name: string
          price_per_meter?: number | null
          stock_product_id?: string | null
          updated_at?: string
        }
        Update: {
          cmyk?: string
          created_at?: string
          hex?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price_per_meter?: number | null
          stock_product_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bias_colors_stock_product_id_fkey"
            columns: ["stock_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          config_json: Json | null
          created_at: string
          id: string
          preview_png_url: string | null
          price_delta: number | null
          product_id: string
          quantity: number
        }
        Insert: {
          cart_id: string
          config_json?: Json | null
          created_at?: string
          id?: string
          preview_png_url?: string | null
          price_delta?: number | null
          product_id: string
          quantity?: number
        }
        Update: {
          cart_id?: string
          config_json?: Json | null
          created_at?: string
          id?: string
          preview_png_url?: string | null
          price_delta?: number | null
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      config_presets: {
        Row: {
          config_json: Json
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          preview_png_url: string | null
          price_delta: number | null
          product_id: string
        }
        Insert: {
          config_json: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          preview_png_url?: string | null
          price_delta?: number | null
          product_id: string
        }
        Update: {
          config_json?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          preview_png_url?: string | null
          price_delta?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "config_presets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: Json | null
          birthdate: string | null
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          instagram: string | null
          name: string
          notes: string | null
          phone: string | null
          tags: string[] | null
          tiny_customer_id: string | null
          tiny_hash: string | null
          tiny_synced_at: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: Json | null
          birthdate?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          tiny_customer_id?: string | null
          tiny_hash?: string | null
          tiny_synced_at?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: Json | null
          birthdate?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          tiny_customer_id?: string | null
          tiny_hash?: string | null
          tiny_synced_at?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      fabric_colors: {
        Row: {
          cmyk: string
          created_at: string
          hex: string
          id: string
          is_active: boolean | null
          name: string
          price_per_meter: number | null
          stock_product_id: string | null
          updated_at: string
        }
        Insert: {
          cmyk: string
          created_at?: string
          hex: string
          id?: string
          is_active?: boolean | null
          name: string
          price_per_meter?: number | null
          stock_product_id?: string | null
          updated_at?: string
        }
        Update: {
          cmyk?: string
          created_at?: string
          hex?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price_per_meter?: number | null
          stock_product_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fabric_colors_stock_product_id_fkey"
            columns: ["stock_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_bom: {
        Row: {
          color_id: string | null
          color_type: string | null
          created_at: string
          id: string
          product_id: string
          quantity_per_unit: number
          supply_product_id: string
          unit: string | null
        }
        Insert: {
          color_id?: string | null
          color_type?: string | null
          created_at?: string
          id?: string
          product_id: string
          quantity_per_unit?: number
          supply_product_id: string
          unit?: string | null
        }
        Update: {
          color_id?: string | null
          color_type?: string | null
          created_at?: string
          id?: string
          product_id?: string
          quantity_per_unit?: number
          supply_product_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_bom_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_bom_supply_product_id_fkey"
            columns: ["supply_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          product_id: string | null
          quantity: number
          reason: string | null
          reference_id: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          reason?: string | null
          reference_id?: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          type?: Database["public"]["Enums"]["movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      lining_colors: {
        Row: {
          cmyk: string
          created_at: string
          hex: string
          id: string
          is_active: boolean | null
          name: string
          price_per_meter: number | null
          stock_product_id: string | null
          updated_at: string
        }
        Insert: {
          cmyk: string
          created_at?: string
          hex: string
          id?: string
          is_active?: boolean | null
          name: string
          price_per_meter?: number | null
          stock_product_id?: string | null
          updated_at?: string
        }
        Update: {
          cmyk?: string
          created_at?: string
          hex?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price_per_meter?: number | null
          stock_product_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lining_colors_stock_product_id_fkey"
            columns: ["stock_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          channel: string
          content: string
          created_at: string
          id: string
          mentions: string[] | null
          parent_id: string | null
          sender_id: string | null
        }
        Insert: {
          attachments?: string[] | null
          channel: string
          content: string
          created_at?: string
          id?: string
          mentions?: string[] | null
          parent_id?: string | null
          sender_id?: string | null
        }
        Update: {
          attachments?: string[] | null
          channel?: string
          content?: string
          created_at?: string
          id?: string
          mentions?: string[] | null
          parent_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      order_statuses: {
        Row: {
          color: string
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          label: string
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          label: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          label?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          contact_id: string | null
          created_at: string
          created_by: string | null
          discount: number | null
          fiscal: Json | null
          id: string
          items: Json
          logistics: Json | null
          metadata: Json | null
          notes: string | null
          order_number: string
          payments: Json | null
          shipping_cost: number | null
          source: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tiny_hash: string | null
          tiny_order_id: string | null
          tiny_synced_at: string | null
          total: number
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number | null
          fiscal?: Json | null
          id?: string
          items: Json
          logistics?: Json | null
          metadata?: Json | null
          notes?: string | null
          order_number: string
          payments?: Json | null
          shipping_cost?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tiny_hash?: string | null
          tiny_order_id?: string | null
          tiny_synced_at?: string | null
          total: number
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number | null
          fiscal?: Json | null
          id?: string
          items?: Json
          logistics?: Json | null
          metadata?: Json | null
          notes?: string | null
          order_number?: string
          payments?: Json | null
          shipping_cost?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          tiny_hash?: string | null
          tiny_order_id?: string | null
          tiny_synced_at?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          properties: Json | null
          sort_order: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          properties?: Json | null
          sort_order?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          properties?: Json | null
          sort_order?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_configurations: {
        Row: {
          bias_color_id: string | null
          config_json: Json | null
          created_at: string
          created_by: string | null
          customization_text: string | null
          fabric_color_id: string | null
          id: string
          lining_color_id: string | null
          preview_png_url: string | null
          product_id: string
          total_price: number
          zipper_color_id: string | null
        }
        Insert: {
          bias_color_id?: string | null
          config_json?: Json | null
          created_at?: string
          created_by?: string | null
          customization_text?: string | null
          fabric_color_id?: string | null
          id?: string
          lining_color_id?: string | null
          preview_png_url?: string | null
          product_id: string
          total_price?: number
          zipper_color_id?: string | null
        }
        Update: {
          bias_color_id?: string | null
          config_json?: Json | null
          created_at?: string
          created_by?: string | null
          customization_text?: string | null
          fabric_color_id?: string | null
          id?: string
          lining_color_id?: string | null
          preview_png_url?: string | null
          product_id?: string
          total_price?: number
          zipper_color_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_configurations_bias_color_id_fkey"
            columns: ["bias_color_id"]
            isOneToOne: false
            referencedRelation: "bias_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_configurations_fabric_color_id_fkey"
            columns: ["fabric_color_id"]
            isOneToOne: false
            referencedRelation: "fabric_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_configurations_lining_color_id_fkey"
            columns: ["lining_color_id"]
            isOneToOne: false
            referencedRelation: "lining_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_configurations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_configurations_zipper_color_id_fkey"
            columns: ["zipper_color_id"]
            isOneToOne: false
            referencedRelation: "zipper_colors"
            referencedColumns: ["id"]
          },
        ]
      }
      product_media: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          product_id: string
          sort_order: number | null
          type: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number | null
          type: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_svg_maps: {
        Row: {
          created_at: string
          id: string
          product_id: string
          svg_mapping: Json
          svg_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          svg_mapping?: Json
          svg_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          svg_mapping?: Json
          svg_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_svg_maps_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_statuses: {
        Row: {
          color: string
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          label: string
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          label: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          label?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      production_tasks: {
        Row: {
          assigned_to: string | null
          attachments: string[] | null
          completed_at: string | null
          config_json: Json | null
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          order_id: string | null
          priority: number | null
          product_name: string
          product_sku: string | null
          quantity: number
          started_at: string | null
          status: Database["public"]["Enums"]["production_status"] | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: string[] | null
          completed_at?: string | null
          config_json?: Json | null
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          priority?: number | null
          product_name: string
          product_sku?: string | null
          quantity: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["production_status"] | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: string[] | null
          completed_at?: string | null
          config_json?: Json | null
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          priority?: number | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["production_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_tasks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          cost_price: number | null
          created_at: string
          customization_options: Json | null
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          materials: Json | null
          metadata: Json | null
          min_stock_quantity: number | null
          name: string
          sku: string | null
          slug: string | null
          stock_quantity: number | null
          technical_specs: Json | null
          tiny_hash: string | null
          tiny_product_id: string | null
          tiny_synced_at: string | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          customization_options?: Json | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          materials?: Json | null
          metadata?: Json | null
          min_stock_quantity?: number | null
          name: string
          sku?: string | null
          slug?: string | null
          stock_quantity?: number | null
          technical_specs?: Json | null
          tiny_hash?: string | null
          tiny_product_id?: string | null
          tiny_synced_at?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          customization_options?: Json | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          materials?: Json | null
          metadata?: Json | null
          min_stock_quantity?: number | null
          name?: string
          sku?: string | null
          slug?: string | null
          stock_quantity?: number | null
          technical_specs?: Json | null
          tiny_hash?: string | null
          tiny_product_id?: string | null
          tiny_synced_at?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shipping_statuses: {
        Row: {
          color: string
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          label: string
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          label: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          label?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          api_calls_used: number
          created_at: string
          created_by: string | null
          entity_type: string
          error_message: string | null
          id: string
          items_created: number
          items_processed: number
          items_skipped: number
          items_updated: number
          operation: string
          status: string
          summary: Json | null
        }
        Insert: {
          api_calls_used?: number
          created_at?: string
          created_by?: string | null
          entity_type: string
          error_message?: string | null
          id?: string
          items_created?: number
          items_processed?: number
          items_skipped?: number
          items_updated?: number
          operation: string
          status: string
          summary?: Json | null
        }
        Update: {
          api_calls_used?: number
          created_at?: string
          created_by?: string | null
          entity_type?: string
          error_message?: string | null
          id?: string
          items_created?: number
          items_processed?: number
          items_skipped?: number
          items_updated?: number
          operation?: string
          status?: string
          summary?: Json | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string | null
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string | null
          updated_at?: string
          variables?: string[] | null
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
      zipper_colors: {
        Row: {
          cmyk: string
          created_at: string
          hex: string
          id: string
          is_active: boolean | null
          name: string
          price_delta: number | null
          stock_product_id: string | null
          updated_at: string
        }
        Insert: {
          cmyk: string
          created_at?: string
          hex: string
          id?: string
          is_active?: boolean | null
          name: string
          price_delta?: number | null
          stock_product_id?: string | null
          updated_at?: string
        }
        Update: {
          cmyk?: string
          created_at?: string
          hex?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price_delta?: number | null
          stock_product_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zipper_colors_stock_product_id_fkey"
            columns: ["stock_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "atendimento" | "producao"
      movement_type: "in" | "out" | "adjustment"
      order_status:
        | "pending_payment"
        | "paid"
        | "awaiting_production"
        | "in_production"
        | "awaiting_shipping"
        | "shipped"
        | "delivered"
        | "cancelled"
      production_status:
        | "pending"
        | "cutting"
        | "sewing"
        | "finishing"
        | "quality_check"
        | "completed"
        | "on_hold"
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
      app_role: ["admin", "atendimento", "producao"],
      movement_type: ["in", "out", "adjustment"],
      order_status: [
        "pending_payment",
        "paid",
        "awaiting_production",
        "in_production",
        "awaiting_shipping",
        "shipped",
        "delivered",
        "cancelled",
      ],
      production_status: [
        "pending",
        "cutting",
        "sewing",
        "finishing",
        "quality_check",
        "completed",
        "on_hold",
      ],
    },
  },
} as const
