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
      match_players: {
        Row: {
          id: string
          match_id: string
          player_id: string
          team_number: number
        }
        Insert: {
          id?: string
          match_id: string
          player_id: string
          team_number: number
        }
        Update: {
          id?: string
          match_id?: string
          player_id?: string
          team_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match_detail"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "partner_filtered_ranking"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "partner_filtered_ranking"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_opponent_stats"
            referencedColumns: ["opponent_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_opponent_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_partner_stats"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_partner_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_opponent_stats"
            referencedColumns: ["opp_player1_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_opponent_stats"
            referencedColumns: ["opp_player2_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_opponent_stats"
            referencedColumns: ["team_player1_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_opponent_stats"
            referencedColumns: ["team_player2_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_stats"
            referencedColumns: ["player1_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_stats"
            referencedColumns: ["player2_id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          played_at: string
          status: Database["public"]["Enums"]["match_status"]
          team1_score: number | null
          team2_score: number | null
          winning_team: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          played_at?: string
          status?: Database["public"]["Enums"]["match_status"]
          team1_score?: number | null
          team2_score?: number | null
          winning_team?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          played_at?: string
          status?: Database["public"]["Enums"]["match_status"]
          team1_score?: number | null
          team2_score?: number | null
          winning_team?: number | null
        }
        Relationships: []
      }
      players: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      match_detail: {
        Row: {
          match_id: string | null
          played_at: string | null
          status: Database["public"]["Enums"]["match_status"] | null
          team1_player1_id: string | null
          team1_player1_name: string | null
          team1_player2_id: string | null
          team1_player2_name: string | null
          team1_score: number | null
          team2_player1_id: string | null
          team2_player1_name: string | null
          team2_player2_id: string | null
          team2_player2_name: string | null
          team2_score: number | null
          winning_team: number | null
        }
        Relationships: []
      }
      partner_filtered_ranking: {
        Row: {
          losses_together: number | null
          matches_together: number | null
          partner_id: string | null
          partner_name: string | null
          player_id: string | null
          player_name: string | null
          win_pct_together: number | null
          wins_together: number | null
        }
        Relationships: []
      }
      player_best_worst_matches: {
        Row: {
          best_margin: number | null
          best_match_id: string | null
          best_opp_score: number | null
          best_their_score: number | null
          player_id: string | null
          worst_margin: number | null
          worst_match_id: string | null
          worst_opp_score: number | null
          worst_their_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "partner_filtered_ranking"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "partner_filtered_ranking"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_opponent_stats"
            referencedColumns: ["opponent_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_opponent_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_partner_stats"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_partner_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_opponent_stats"
            referencedColumns: ["opp_player1_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_opponent_stats"
            referencedColumns: ["opp_player2_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_opponent_stats"
            referencedColumns: ["team_player1_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_opponent_stats"
            referencedColumns: ["team_player2_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_stats"
            referencedColumns: ["player1_id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_stats"
            referencedColumns: ["player2_id"]
          },
        ]
      }
      player_opponent_stats: {
        Row: {
          losses_vs: number | null
          matches_vs: number | null
          opponent_id: string | null
          opponent_name: string | null
          player_id: string | null
          player_name: string | null
          win_pct_vs: number | null
          wins_vs: number | null
        }
        Relationships: []
      }
      player_partner_stats: {
        Row: {
          losses_together: number | null
          matches_together: number | null
          partner_id: string | null
          partner_name: string | null
          player_id: string | null
          player_name: string | null
          win_pct_together: number | null
          wins_together: number | null
        }
        Relationships: []
      }
      player_stats: {
        Row: {
          avatar_url: string | null
          avg_match_points: number | null
          matches_lost: number | null
          matches_played: number | null
          matches_won: number | null
          name: string | null
          player_id: string | null
          win_pct: number | null
        }
        Relationships: []
      }
      team_opponent_stats: {
        Row: {
          losses_vs: number | null
          matches_vs: number | null
          opp_player1_id: string | null
          opp_player1_name: string | null
          opp_player2_id: string | null
          opp_player2_name: string | null
          team_player1_id: string | null
          team_player1_name: string | null
          team_player2_id: string | null
          team_player2_name: string | null
          win_pct_vs: number | null
          wins_vs: number | null
        }
        Relationships: []
      }
      team_stats: {
        Row: {
          avg_match_points: number | null
          best_margin: number | null
          matches_lost: number | null
          matches_played: number | null
          matches_won: number | null
          player1_id: string | null
          player1_name: string | null
          player2_id: string | null
          player2_name: string | null
          win_pct: number | null
          worst_margin: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      match_status: "ongoing" | "completed"
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
      match_status: ["ongoing", "completed"],
    },
  },
} as const
