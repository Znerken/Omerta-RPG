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
      achievement_progress: {
        Row: {
          achievement_id: number
          claimed: boolean
          id: number
          progress: number
          user_id: number
          viewed: boolean
        }
        Insert: {
          achievement_id: number
          claimed?: boolean
          id?: number
          progress?: number
          user_id: number
          viewed?: boolean
        }
        Update: {
          achievement_id?: number
          claimed?: boolean
          id?: number
          progress?: number
          user_id?: number
          viewed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "achievement_progress_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      achievements: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          hidden: boolean
          icon: string | null
          id: number
          max_progress: number
          name: string
          reward_amount: number
          reward_type: string
          series: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          hidden?: boolean
          icon?: string | null
          id?: number
          max_progress?: number
          name: string
          reward_amount?: number
          reward_type?: string
          series?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          hidden?: boolean
          icon?: string | null
          id?: number
          max_progress?: number
          name?: string
          reward_amount?: number
          reward_type?: string
          series?: string | null
        }
        Relationships: []
      }
      casino_bets: {
        Row: {
          amount: number
          created_at: string | null
          game_id: number
          id: number
          outcome: string
          payout: number
          user_id: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          game_id: number
          id?: number
          outcome: string
          payout: number
          user_id: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          game_id?: number
          id?: number
          outcome?: string
          payout?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "casino_bets_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "casino_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casino_bets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      casino_games: {
        Row: {
          created_at: string | null
          description: string | null
          house_edge: number
          id: number
          image: string | null
          max_bet: number
          min_bet: number
          name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          house_edge: number
          id?: number
          image?: string | null
          max_bet: number
          min_bet: number
          name: string
          type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          house_edge?: number
          id?: number
          image?: string | null
          max_bet?: number
          min_bet?: number
          name?: string
          type?: string
        }
        Relationships: []
      }
      challenge_progress: {
        Row: {
          challenge_id: number
          completed: boolean
          created_at: string | null
          id: number
          progress: number
          user_id: number
        }
        Insert: {
          challenge_id: number
          completed?: boolean
          created_at?: string | null
          id?: number
          progress?: number
          user_id: number
        }
        Update: {
          challenge_id?: number
          completed?: boolean
          created_at?: string | null
          id?: number
          progress?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      challenges: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: string | null
          end_date: string | null
          id: number
          max_progress: number
          name: string
          reward_amount: number
          reward_type: string
          start_date: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          end_date?: string | null
          id?: number
          max_progress?: number
          name: string
          reward_amount?: number
          reward_type?: string
          start_date?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          end_date?: string | null
          id?: number
          max_progress?: number
          name?: string
          reward_amount?: number
          reward_type?: string
          start_date?: string | null
        }
        Relationships: []
      }
      crime_history: {
        Row: {
          crime_id: number
          created_at: string | null
          id: number
          outcome: string
          reward: number
          user_id: number
        }
        Insert: {
          crime_id: number
          created_at?: string | null
          id?: number
          outcome: string
          reward?: number
          user_id: number
        }
        Update: {
          crime_id?: number
          created_at?: string | null
          id?: number
          outcome?: string
          reward?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "crime_history_crime_id_fkey"
            columns: ["crime_id"]
            isOneToOne: false
            referencedRelation: "crimes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crime_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      crimes: {
        Row: {
          cash_reward: number
          cooldown: number
          created_at: string | null
          description: string | null
          difficulty: number
          energy_cost: number
          exp_reward: number
          id: number
          jail_time: number
          min_level: number
          name: string
          respect_reward: number
          success_chance: number
        }
        Insert: {
          cash_reward?: number
          cooldown?: number
          created_at?: string | null
          description?: string | null
          difficulty?: number
          energy_cost?: number
          exp_reward?: number
          id?: number
          jail_time?: number
          min_level?: number
          name: string
          respect_reward?: number
          success_chance?: number
        }
        Update: {
          cash_reward?: number
          cooldown?: number
          created_at?: string | null
          description?: string | null
          difficulty?: number
          energy_cost?: number
          exp_reward?: number
          id?: number
          jail_time?: number
          min_level?: number
          name?: string
          respect_reward?: number
          success_chance?: number
        }
        Relationships: []
      }
      drug_ingredients: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          price: number
          rarity: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          price?: number
          rarity?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          price?: number
          rarity?: string
        }
        Relationships: []
      }
      drug_labs: {
        Row: {
          capacity: number
          created_at: string | null
          id: number
          level: number
          location: string | null
          name: string | null
          quality: number
          user_id: number
        }
        Insert: {
          capacity?: number
          created_at?: string | null
          id?: number
          level?: number
          location?: string | null
          name?: string | null
          quality?: number
          user_id: number
        }
        Update: {
          capacity?: number
          created_at?: string | null
          id?: number
          level?: number
          location?: string | null
          name?: string | null
          quality?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "drug_labs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      drugs: {
        Row: {
          addiction_chance: number
          created_at: string | null
          description: string | null
          id: number
          market_price: number
          name: string
          potency: number
          quality: number
          side_effects: string | null
          withdrawal_effects: string | null
        }
        Insert: {
          addiction_chance?: number
          created_at?: string | null
          description?: string | null
          id?: number
          market_price?: number
          name: string
          potency?: number
          quality?: number
          side_effects?: string | null
          withdrawal_effects?: string | null
        }
        Update: {
          addiction_chance?: number
          created_at?: string | null
          description?: string | null
          id?: number
          market_price?: number
          name?: string
          potency?: number
          quality?: number
          side_effects?: string | null
          withdrawal_effects?: string | null
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string | null
          id: number
          status: string
          user_id_1: number
          user_id_2: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          status?: string
          user_id_1: number
          user_id_2: number
        }
        Update: {
          created_at?: string | null
          id?: number
          status?: string
          user_id_1?: number
          user_id_2?: number
        }
        Relationships: [
          {
            foreignKeyName: "friendships_user_id_1_fkey"
            columns: ["user_id_1"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_2_fkey"
            columns: ["user_id_2"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gang_members: {
        Row: {
          contribution: number
          gang_id: number
          id: number
          joined_at: string | null
          rank: string
          user_id: number
        }
        Insert: {
          contribution?: number
          gang_id: number
          id?: number
          joined_at?: string | null
          rank?: string
          user_id: number
        }
        Update: {
          contribution?: number
          gang_id?: number
          id?: number
          joined_at?: string | null
          rank?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "gang_members_gang_id_fkey"
            columns: ["gang_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gang_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      gangs: {
        Row: {
          bank_balance: number
          created_at: string | null
          defense: number
          description: string | null
          experience: number
          id: number
          level: number
          logo: string | null
          name: string
          owner_id: number
          respect: number
          strength: number
          tag: string
        }
        Insert: {
          bank_balance?: number
          created_at?: string | null
          defense?: number
          description?: string | null
          experience?: number
          id?: number
          level?: number
          logo?: string | null
          name: string
          owner_id: number
          respect?: number
          strength?: number
          tag: string
        }
        Update: {
          bank_balance?: number
          created_at?: string | null
          defense?: number
          description?: string | null
          experience?: number
          id?: number
          level?: number
          logo?: string | null
          name?: string
          owner_id?: number
          respect?: number
          strength?: number
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "gangs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          content: string
          gang_id: number | null
          id: number
          read: boolean
          receiver_id: number | null
          sender_id: number
          timestamp: string | null
          type: string
        }
        Insert: {
          content: string
          gang_id?: number | null
          id?: number
          read?: boolean
          receiver_id?: number | null
          sender_id: number
          timestamp?: string | null
          type?: string
        }
        Update: {
          content?: string
          gang_id?: number | null
          id?: number
          read?: boolean
          receiver_id?: number | null
          sender_id?: number
          timestamp?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_gang_id_fkey"
            columns: ["gang_id"]
            isOneToOne: false
            referencedRelation: "gangs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      training_history: {
        Row: {
          attribute: string
          created_at: string | null
          gain: number
          id: number
          user_id: number
        }
        Insert: {
          attribute: string
          created_at?: string | null
          gain: number
          id?: number
          user_id: number
        }
        Update: {
          attribute?: string
          created_at?: string | null
          gain?: number
          id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_addictions: {
        Row: {
          created_at: string | null
          drug_id: number
          id: number
          level: number
          last_dose: string | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          drug_id: number
          id?: number
          level?: number
          last_dose?: string | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          drug_id?: number
          id?: number
          level?: number
          last_dose?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_addictions_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "drugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_addictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_bank_accounts: {
        Row: {
          balance: number
          created_at: string | null
          id: number
          interest_rate: number
          last_interest: string | null
          name: string
          type: string
          user_id: number
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: number
          interest_rate?: number
          last_interest?: string | null
          name: string
          type?: string
          user_id: number
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: number
          interest_rate?: number
          last_interest?: string | null
          name?: string
          type?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_bank_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_customizations: {
        Row: {
          avatar_frame: string | null
          created_at: string | null
          id: number
          name_effect: string | null
          profile_theme: string | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          avatar_frame?: string | null
          created_at?: string | null
          id?: number
          name_effect?: string | null
          profile_theme?: string | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          avatar_frame?: string | null
          created_at?: string | null
          id?: number
          name_effect?: string | null
          profile_theme?: string | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_customizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          avatar: string | null
          banner: string | null
          bio: string | null
          created_at: string | null
          id: number
          location: string | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          avatar?: string | null
          banner?: string | null
          bio?: string | null
          created_at?: string | null
          id?: number
          location?: string | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          avatar?: string | null
          banner?: string | null
          bio?: string | null
          created_at?: string | null
          id?: number
          location?: string | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_stats: {
        Row: {
          charisma: number
          created_at: string | null
          defense: number
          dexterity: number
          id: number
          intelligence: number
          stamina: number
          strength: number
          updated_at: string | null
          user_id: number
        }
        Insert: {
          charisma?: number
          created_at?: string | null
          defense?: number
          dexterity?: number
          id?: number
          intelligence?: number
          stamina?: number
          strength?: number
          updated_at?: string | null
          user_id: number
        }
        Update: {
          charisma?: number
          created_at?: string | null
          defense?: number
          dexterity?: number
          id?: number
          intelligence?: number
          stamina?: number
          strength?: number
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_statuses: {
        Row: {
          id: number
          last_active: string | null
          last_location: string | null
          status: string
          user_id: number
        }
        Insert: {
          id?: number
          last_active?: string | null
          last_location?: string | null
          status?: string
          user_id: number
        }
        Update: {
          id?: number
          last_active?: string | null
          last_location?: string | null
          status?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_statuses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          bank: number
          banned: boolean
          ban_reason: string | null
          cash: number
          created_at: string | null
          email: string
          energy: number
          experience: number
          health: number
          id: number
          is_admin: boolean
          jailed: boolean
          jail_reason: string | null
          jail_until: string | null
          last_active: string | null
          level: number
          max_energy: number
          max_health: number
          password: string
          respect: number
          supabase_id: string | null
          username: string
        }
        Insert: {
          bank?: number
          banned?: boolean
          ban_reason?: string | null
          cash?: number
          created_at?: string | null
          email: string
          energy?: number
          experience?: number
          health?: number
          id?: number
          is_admin?: boolean
          jailed?: boolean
          jail_reason?: string | null
          jail_until?: string | null
          last_active?: string | null
          level?: number
          max_energy?: number
          max_health?: number
          password: string
          respect?: number
          supabase_id?: string | null
          username: string
        }
        Update: {
          bank?: number
          banned?: boolean
          ban_reason?: string | null
          cash?: number
          created_at?: string | null
          email?: string
          energy?: number
          experience?: number
          health?: number
          id?: number
          is_admin?: boolean
          jailed?: boolean
          jail_reason?: string | null
          jail_until?: string | null
          last_active?: string | null
          level?: number
          max_energy?: number
          max_health?: number
          password?: string
          respect?: number
          supabase_id?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}