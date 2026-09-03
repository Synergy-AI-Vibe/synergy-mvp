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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      bookmark: {
        Row: {
          created_at: string
          id: number
          servings: number
          source_type: Database["public"]["Enums"]["bookmark_source"]
          source_url: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          servings?: number
          source_type: Database["public"]["Enums"]["bookmark_source"]
          source_url?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          servings?: number
          source_type?: Database["public"]["Enums"]["bookmark_source"]
          source_url?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmark_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_alias: {
        Row: {
          alias: string
          canonical_name: string
          confidence: number
          created_at: string
          hit_count: number
          id: number
          reason: string | null
          source: string
          updated_at: string
        }
        Insert: {
          alias: string
          canonical_name: string
          confidence?: number
          created_at?: string
          hit_count?: number
          id?: never
          reason?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          alias?: string
          canonical_name?: string
          confidence?: number
          created_at?: string
          hit_count?: number
          id?: never
          reason?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          kakao_id: string | null
          nickname: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          kakao_id?: string | null
          nickname?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kakao_id?: string | null
          nickname?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_price: {
        Row: {
          aliases: string[]
          created_at: string
          delivery_fee: number
          id: number
          is_verified: boolean
          menu_key: string
          menu_name: string
          price_avg: number | null
          price_max: number | null
          price_min: number | null
          sample_size: number
          servings: number
          surveyed_on: string | null
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          delivery_fee?: number
          id?: never
          is_verified?: boolean
          menu_key: string
          menu_name: string
          price_avg?: number | null
          price_max?: number | null
          price_min?: number | null
          sample_size?: number
          servings?: number
          surveyed_on?: string | null
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          created_at?: string
          delivery_fee?: number
          id?: never
          is_verified?: boolean
          menu_key?: string
          menu_name?: string
          price_avg?: number | null
          price_max?: number | null
          price_min?: number | null
          sample_size?: number
          servings?: number
          surveyed_on?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          name: string
          part: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          part: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          part?: string
        }
        Relationships: []
      }
      unmatched_ingredient: {
        Row: {
          confidence: number | null
          created_at: string
          hit_count: number
          id: number
          last_seen_at: string
          raw_name: string
          reason: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          hit_count?: number
          id?: never
          last_seen_at?: string
          raw_name: string
          reason?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          hit_count?: number
          id?: never
          last_seen_at?: string
          raw_name?: string
          reason?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cache_alias: {
        Args: {
          p_alias: string
          p_canonical_name: string
          p_confidence?: number
          p_reason?: string
        }
        Returns: undefined
      }
      lookup_alias: { Args: { p_alias: string }; Returns: string }
      match_store_price: {
        Args: { recipe_title: string }
        Returns: {
          aliases: string[]
          created_at: string
          delivery_fee: number
          id: number
          is_verified: boolean
          menu_key: string
          menu_name: string
          price_avg: number | null
          price_max: number | null
          price_min: number | null
          sample_size: number
          servings: number
          surveyed_on: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "store_price"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      record_unmatched: {
        Args: { p_confidence?: number; p_raw_name: string; p_reason?: string }
        Returns: undefined
      }
    }
    Enums: {
      alias_source: "rule" | "llm" | "manual"
      base_unit: "g" | "ml" | "ea"
      bookmark_source: "youtube" | "manual"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      alias_source: ["rule", "llm", "manual"],
      base_unit: ["g", "ml", "ea"],
      bookmark_source: ["youtube", "manual"],
    },
  },
} as const
