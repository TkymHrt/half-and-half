export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
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
      activity_logs: {
        Row: {
          actor_name: string;
          actor_profile_id: string | null;
          created_at: string;
          details: Json;
          event_type: Database["public"]["Enums"]["activity_event_type"];
          id: number;
          task_id: string | null;
          task_item_id: string | null;
        };
        Insert: {
          actor_name: string;
          actor_profile_id?: string | null;
          created_at?: string;
          details: Json;
          event_type: Database["public"]["Enums"]["activity_event_type"];
          id?: number;
          task_id?: string | null;
          task_item_id?: string | null;
        };
        Update: {
          actor_name?: string;
          actor_profile_id?: string | null;
          created_at?: string;
          details?: Json;
          event_type?: Database["public"]["Enums"]["activity_event_type"];
          id?: number;
          task_id?: string | null;
          task_item_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_logs_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_logs_task_item_id_fkey";
            columns: ["task_item_id"];
            isOneToOne: false;
            referencedRelation: "task_items";
            referencedColumns: ["id"];
          },
        ];
      };
      announcement_audience: {
        Row: {
          announcement_id: string;
          created_at: string;
          profile_id: string;
          read_at: string | null;
        };
        Insert: {
          announcement_id: string;
          created_at?: string;
          profile_id: string;
          read_at?: string | null;
        };
        Update: {
          announcement_id?: string;
          created_at?: string;
          profile_id?: string;
          read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "announcement_audience_announcement_id_fkey";
            columns: ["announcement_id"];
            isOneToOne: false;
            referencedRelation: "announcements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcement_audience_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      announcements: {
        Row: {
          body: string;
          created_at: string;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          scope: Database["public"]["Enums"]["announcement_scope"];
          task_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          scope: Database["public"]["Enums"]["announcement_scope"];
          task_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          scope?: Database["public"]["Enums"]["announcement_scope"];
          task_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcements_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      areas: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      floors: {
        Row: {
          area_id: string;
          created_at: string;
          height_px: number;
          id: string;
          image_path: string;
          name: string;
          order_index: number;
          updated_at: string;
          width_px: number;
        };
        Insert: {
          area_id: string;
          created_at?: string;
          height_px: number;
          id?: string;
          image_path: string;
          name: string;
          order_index?: number;
          updated_at?: string;
          width_px: number;
        };
        Update: {
          area_id?: string;
          created_at?: string;
          height_px?: number;
          id?: string;
          image_path?: string;
          name?: string;
          order_index?: number;
          updated_at?: string;
          width_px?: number;
        };
        Relationships: [
          {
            foreignKeyName: "floors_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "areas";
            referencedColumns: ["id"];
          },
        ];
      };
      locations: {
        Row: {
          coord_x: number;
          coord_y: number;
          created_at: string;
          floor_id: string;
          id: string;
          kind: Database["public"]["Enums"]["location_kind"];
          label: string;
          notes: string | null;
          updated_at: string;
        };
        Insert: {
          coord_x: number;
          coord_y: number;
          created_at?: string;
          floor_id: string;
          id?: string;
          kind: Database["public"]["Enums"]["location_kind"];
          label: string;
          notes?: string | null;
          updated_at?: string;
        };
        Update: {
          coord_x?: number;
          coord_y?: number;
          created_at?: string;
          floor_id?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["location_kind"];
          label?: string;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "locations_floor_id_fkey";
            columns: ["floor_id"];
            isOneToOne: false;
            referencedRelation: "floors";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          phone: string | null;
          role: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id: string;
          phone?: string | null;
          role: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      task_item_issues: {
        Row: {
          created_at: string;
          detail: string | null;
          id: string;
          kind: Database["public"]["Enums"]["item_issue_kind"];
          reported_by: string;
          resolved_at: string | null;
          resolved_by: string | null;
          status: Database["public"]["Enums"]["item_issue_status"];
          summary: string;
          task_item_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          detail?: string | null;
          id?: string;
          kind: Database["public"]["Enums"]["item_issue_kind"];
          reported_by?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["item_issue_status"];
          summary: string;
          task_item_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          detail?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["item_issue_kind"];
          reported_by?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["item_issue_status"];
          summary?: string;
          task_item_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_item_issues_reported_by_fkey";
            columns: ["reported_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_item_issues_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_item_issues_task_item_id_fkey";
            columns: ["task_item_id"];
            isOneToOne: false;
            referencedRelation: "task_items";
            referencedColumns: ["id"];
          },
        ];
      };
      task_item_photos: {
        Row: {
          caption: string | null;
          captured_at: string | null;
          content_type: string;
          created_at: string;
          file_name: string | null;
          id: string;
          kind: Database["public"]["Enums"]["item_photo_kind"];
          note: string | null;
          size_bytes: number;
          storage_path: string;
          task_item_id: string;
          updated_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          caption?: string | null;
          captured_at?: string | null;
          content_type: string;
          created_at?: string;
          file_name?: string | null;
          id?: string;
          kind: Database["public"]["Enums"]["item_photo_kind"];
          note?: string | null;
          size_bytes: number;
          storage_path: string;
          task_item_id: string;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          caption?: string | null;
          captured_at?: string | null;
          content_type?: string;
          created_at?: string;
          file_name?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["item_photo_kind"];
          note?: string | null;
          size_bytes?: number;
          storage_path?: string;
          task_item_id?: string;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "task_item_photos_task_item_id_fkey";
            columns: ["task_item_id"];
            isOneToOne: false;
            referencedRelation: "task_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_item_photos_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      task_items: {
        Row: {
          assigned_profile_id: string | null;
          created_at: string;
          dropoff_location_id: string | null;
          handler_label: string | null;
          id: string;
          last_status_change_by: string | null;
          last_status_changed_at: string;
          name: string;
          notes: string | null;
          pickup_location_id: string | null;
          quantity: number;
          status: Database["public"]["Enums"]["item_status"];
          task_id: string;
          updated_at: string;
        };
        Insert: {
          assigned_profile_id?: string | null;
          created_at?: string;
          dropoff_location_id?: string | null;
          handler_label?: string | null;
          id?: string;
          last_status_change_by?: string | null;
          last_status_changed_at?: string;
          name: string;
          notes?: string | null;
          pickup_location_id?: string | null;
          quantity: number;
          status?: Database["public"]["Enums"]["item_status"];
          task_id: string;
          updated_at?: string;
        };
        Update: {
          assigned_profile_id?: string | null;
          created_at?: string;
          dropoff_location_id?: string | null;
          handler_label?: string | null;
          id?: string;
          last_status_change_by?: string | null;
          last_status_changed_at?: string;
          name?: string;
          notes?: string | null;
          pickup_location_id?: string | null;
          quantity?: number;
          status?: Database["public"]["Enums"]["item_status"];
          task_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_items_assigned_profile_id_fkey";
            columns: ["assigned_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_items_dropoff_location_id_fkey";
            columns: ["dropoff_location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_items_last_status_change_by_fkey";
            columns: ["last_status_change_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_items_pickup_location_id_fkey";
            columns: ["pickup_location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_items_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          due_at: string | null;
          handler_label: string | null;
          id: string;
          status: Database["public"]["Enums"]["task_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_at?: string | null;
          handler_label?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["task_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_at?: string | null;
          handler_label?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["task_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      app_is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      activity_event_type:
        | "task_created"
        | "task_updated"
        | "task_status_changed"
        | "task_deleted"
        | "item_added"
        | "item_updated"
        | "item_status_changed"
        | "item_deleted"
        | "issue_reported"
        | "issue_status_changed"
        | "item_photo_uploaded";
      announcement_scope: "global" | "task";
      item_issue_kind: "loss" | "damage" | "other";
      item_issue_status: "open" | "resolved";
      item_photo_kind: "pickup" | "delivery" | "issue";
      item_status: "unplaced" | "moving" | "placed" | "issue";
      location_kind: "storage" | "destination" | "general";
      task_status: "not_started" | "in_progress" | "done";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
      activity_event_type: [
        "task_created",
        "task_updated",
        "task_status_changed",
        "task_deleted",
        "item_added",
        "item_updated",
        "item_status_changed",
        "item_deleted",
        "issue_reported",
        "issue_status_changed",
        "item_photo_uploaded",
      ],
      announcement_scope: ["global", "task"],
      item_issue_kind: ["loss", "damage", "other"],
      item_issue_status: ["open", "resolved"],
      item_photo_kind: ["pickup", "delivery", "issue"],
      item_status: ["unplaced", "moving", "placed", "issue"],
      location_kind: ["storage", "destination", "general"],
      task_status: ["not_started", "in_progress", "done"],
    },
  },
} as const;
