

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          role: "Docente" | "Admin" | "Auxiliar"
          dni: string | null
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          role: "Docente" | "Admin" | "Auxiliar"
          dni?: string | null
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: "Docente" | "Admin" | "Auxiliar"
          dni?: string | null
          email?: string | null
          created_at?: string
        }
        Relationships: []
      },
      categories: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      },
      resources: {
        Row: {
          id: string
          name: string
          brand: string | null
          model: string | null
          status: string
          stock: number
          damage_notes: string | null
          category_id: string | null
          attributes: Json | null
          notes: string | null
          related_accessories: string[] | null
          is_accessory: boolean | null
          compatible_with: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          brand?: string | null
          model?: string | null
          status?: string
          stock?: number
          damage_notes?: string | null
          category_id?: string | null
          attributes?: Json | null
          notes?: string | null
          related_accessories?: string[] | null
          is_accessory?: boolean | null
          compatible_with?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          brand?: string | null
          model?: string | null
          status?: string
          stock?: number
          damage_notes?: string | null
          category_id?: string | null
          attributes?: Json | null
          notes?: string | null
          related_accessories?: string[] | null
          is_accessory?: boolean | null
          compatible_with?: string[] | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      },
      loans: {
        Row: {
            id: string;
            user_id: string;
            purpose: string;
            purpose_details: Json | null;
            loan_date: string;
            return_date: string | null;
            status: string;
            resources: Json | null;
            damage_reports: Json | null;
            suggestion_reports: Json | null;
            missing_resources: Json | null;
        };
        Insert: {
            id?: string;
            user_id: string;
            purpose: string;
            purpose_details?: Json | null;
            loan_date?: string;
            return_date?: string | null;
            status?: string;
            resources?: Json | null;
            damage_reports?: Json | null;
            suggestion_reports?: Json | null;
            missing_resources?: Json | null;
        };
        Update: {
            id?: string;
            user_id?: string;
            purpose?: string;
            purpose_details?: Json | null;
            loan_date?: string;
            return_date?: string | null;
            status?: string;
            resources?: Json | null;
            damage_reports?: Json | null;
            suggestion_reports?: Json | null;
            missing_resources?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "loans_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      },
      reservations: {
        Row: {
            id: string;
            user_id: string;
            purpose: string;
            purpose_details: Json | null;
            start_time: string;
            end_time: string;
            status: string;
            created_at: string;
        };
        Insert: {
            id?: string;
            user_id: string;
            purpose: string;
            purpose_details?: Json | null;
            start_time: string;
            end_time: string;
            status?: string;
            created_at?: string;
        };
        Update: {
            id?: string;
            user_id?: string;
            purpose?: string;
            purpose_details?: Json | null;
            start_time?: string;
            end_time?: string;
            status?: string;
            created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      },
      meetings: {
        Row: {
            id: string;
            title: string;
            date: string;
            participants: Json | null;
            generic_participants: string[] | null;
            colegiado_areas: string[] | null;
            other_participants: string | null;
            tasks: Json | null;
            created_at: string;
        };
        Insert: {
            id?: string;
            title: string;
            date?: string;
            participants?: Json | null;
            generic_participants?: string[] | null;
            colegiado_areas?: string[] | null;
            other_participants?: string | null;
            tasks?: Json | null;
            created_at?: string;
        };
        Update: {
            id?: string;
            title?: string;
            date?: string;
            participants?: Json | null;
            generic_participants?: string[] | null;
            colegiado_areas?: string[] | null;
            other_participants?: string | null;
            tasks?: Json | null;
            created_at?: string;
        };
        Relationships: [];
      },
      areas: {
        Row: {
            id: string;
            name: string;
            created_at: string;
        };
        Insert: {
            id?: string;
            name: string;
            created_at?: string;
        };
        Update: {
            id?: string;
            name?: string;
            created_at?: string;
        };
        Relationships: [];
      },
      grades: {
        Row: {
            id: string;
            name: string;
            created_at: string;
        };
        Insert: {
            id?: string;
            name: string;
            created_at?: string;
        };
        Update: {
            id?: string;
            name?: string;
            created_at?: string;
        };
        Relationships: [];
      },
      sections: {
        Row: {
            id: string;
            grade_id: string;
            name: string;
            alias: string | null;
            created_at: string;
        };
        Insert: {
            id?: string;
            grade_id: string;
            name: string;
            alias?: string | null;
            created_at?: string;
        };
        Update: {
            id?: string;
            grade_id?: string;
            name?: string;
            alias?: string | null;
            created_at?: string;
        };
        Relationships: [
            {
                foreignKeyName: "sections_grade_id_fkey";
                columns: ["grade_id"];
                referencedRelation: "grades";
                referencedColumns: ["id"];
            }
        ];
      },
      pedagogical_hours: {
        Row: {
            id: string;
            name: string;
            created_at: string;
        };
        Insert: {
            id?: string;
            name: string;
            created_at?: string;
        };
        Update: {
            id?: string;
            name?: string;
            created_at?: string;
        };
        Relationships: [];
      },
      app_settings: {
        Row: {
          id: number;
          app_name: string;
          school_name: string;
          logo_url: string | null;
          primary_color: string;
          is_public_registration_enabled: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          app_name?: string;
          school_name?: string;
          logo_url?: string | null;
          primary_color?: string;
          is_public_registration_enabled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          app_name?: string;
          school_name?: string;
          logo_url?: string | null;
          primary_color?: string;
          is_public_registration_enabled?: boolean;
          created_at?: string;
        };
        Relationships: [];
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
