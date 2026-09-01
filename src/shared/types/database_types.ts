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
      bet_participants: {
        Row: {
          bet_id: string
          confirmed: boolean
          id: string
          odds: number
          role: string
          stake_amount: number
          user_id: string
        }
        Insert: {
          bet_id: string
          confirmed?: boolean
          id?: string
          odds?: number
          role?: string
          stake_amount?: number
          user_id: string
        }
        Update: {
          bet_id?: string
          confirmed?: boolean
          id?: string
          odds?: number
          role?: string
          stake_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bet_participants_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bet_results: {
        Row: {
          bet_id: string
          confirmed: boolean
          confirmed_by: string | null
          created_at: string | null
          id: string
          match_number: number | null
          recorded_by: string
          scores: Json | null
          winner_id: string
        }
        Insert: {
          bet_id: string
          confirmed?: boolean
          confirmed_by?: string | null
          created_at?: string | null
          id?: string
          match_number?: number | null
          recorded_by: string
          scores?: Json | null
          winner_id: string
        }
        Update: {
          bet_id?: string
          confirmed?: boolean
          confirmed_by?: string | null
          created_at?: string | null
          id?: string
          match_number?: number | null
          recorded_by?: string
          scores?: Json | null
          winner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bet_results_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_results_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_results_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_results_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bets: {
        Row: {
          created_at: string | null
          creator_id: string
          format: string
          game_template: string
          id: string
          rejected_at: string | null
          stake_mode: string
          stake_per_match: number | null
          status: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          format: string
          game_template: string
          id?: string
          rejected_at?: string | null
          stake_mode: string
          stake_per_match?: number | null
          status?: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          format?: string
          game_template?: string
          id?: string
          rejected_at?: string | null
          stake_mode?: string
          stake_per_match?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string | null
          id: string
          status: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: string
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          payload: Json | null
          read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          read?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          read?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          deleted_at: string | null
          from_user: string
          id: string
          status: string
          to_user: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          deleted_at?: string | null
          from_user: string
          id?: string
          status?: string
          to_user: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          from_user?: string
          id?: string
          status?: string
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          amount: number
          bet_id: string
          creditor_id: string
          debtor_id: string
          id: string
        }
        Insert: {
          amount: number
          bet_id: string
          creditor_id: string
          debtor_id: string
          id?: string
        }
        Update: {
          amount?: number
          bet_id?: string
          creditor_id?: string
          debtor_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_creditor_id_fkey"
            columns: ["creditor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_debtor_id_fkey"
            columns: ["debtor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          invite_code: string | null
          nick: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id: string
          invite_code?: string | null
          nick: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          invite_code?: string | null
          nick?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_see_user: { Args: { p_target: string }; Returns: boolean }
      create_bet_with_participants: {
        Args: {
          p_creator_id: string
          p_format: string
          p_game_template: string
          p_participants: Json
          p_stake_mode: string
          p_stake_per_match?: number
        }
        Returns: string
      }
      delete_my_account: { Args: never; Returns: undefined }
      delete_payment: { Args: { p_payment_id: string }; Returns: undefined }
      get_balances_screen_data: {
        Args: { p_viewer: string }
        Returns: {
          avatar_url: string
          balance: number
          deleted_at: string
          is_friend: boolean
          match_count: number
          nick: string
          other_id: string
        }[]
      }
      get_balances_with_friends: {
        Args: { p_viewer: string }
        Returns: {
          balance: number
          other_id: string
        }[]
      }
      get_match_counts_with_friends: {
        Args: { p_viewer: string }
        Returns: {
          match_count: number
          other_id: string
        }[]
      }
      get_pair_balance: {
        Args: { p_other: string; p_viewer: string }
        Returns: number
      }
      get_pair_stats: {
        Args: { p_other: string; p_viewer: string }
        Returns: {
          game_template: string
          losses: number
          wins: number
        }[]
      }
      get_pending_actions: {
        Args: { p_viewer: string }
        Returns: {
          bet_id: string
          created_at: string
          game_template: string
          kind: string
          other_id: string
          payment_id: string
          stake: number
        }[]
      }
      is_bet_participant: {
        Args: { p_bet_id: string; p_user_id: string }
        Returns: boolean
      }
      lookup_user_by_invite_code: {
        Args: { p_code: string }
        Returns: {
          user_id: string
          user_nick: string
        }[]
      }
      submit_bet_result: {
        Args: {
          p_bet_id: string
          p_recorded_by: string
          p_score: string
          p_winner_id: string
        }
        Returns: string
      }
      user_exists_for_friend_invite: {
        Args: { p_id: string }
        Returns: boolean
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

// God tablew chuj trzeba rozbić