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
      employees: {
        Row: {
          account_iban: string | null
          address_current: string | null
          address_permanent: string | null
          ai_literacy: string | null
          allowances: number | null
          bank_name: string | null
          basic_salary: number | null
          cnic: string | null
          contact_emergency: string | null
          contact_personal: string | null
          core_skills: string | null
          created_at: string
          deductions: number | null
          department: string | null
          designation: string | null
          dob: string | null
          email_official: string | null
          email_personal: string | null
          employee_id: string | null
          employment_status: string | null
          father_name: string | null
          full_name: string
          gender: string | null
          gross_salary: number | null
          id: string
          job_status: string | null
          joining_date: string | null
          last_training: string | null
          net_payable: number | null
          performance_rating: string | null
          reporting_to: string | null
          skill_level: string | null
          soft_skills: string | null
          source: string | null
          training_required: string | null
          updated_at: string
        }
        Insert: {
          account_iban?: string | null
          address_current?: string | null
          address_permanent?: string | null
          ai_literacy?: string | null
          allowances?: number | null
          bank_name?: string | null
          basic_salary?: number | null
          cnic?: string | null
          contact_emergency?: string | null
          contact_personal?: string | null
          core_skills?: string | null
          created_at?: string
          deductions?: number | null
          department?: string | null
          designation?: string | null
          dob?: string | null
          email_official?: string | null
          email_personal?: string | null
          employee_id?: string | null
          employment_status?: string | null
          father_name?: string | null
          full_name: string
          gender?: string | null
          gross_salary?: number | null
          id?: string
          job_status?: string | null
          joining_date?: string | null
          last_training?: string | null
          net_payable?: number | null
          performance_rating?: string | null
          reporting_to?: string | null
          skill_level?: string | null
          soft_skills?: string | null
          source?: string | null
          training_required?: string | null
          updated_at?: string
        }
        Update: {
          account_iban?: string | null
          address_current?: string | null
          address_permanent?: string | null
          ai_literacy?: string | null
          allowances?: number | null
          bank_name?: string | null
          basic_salary?: number | null
          cnic?: string | null
          contact_emergency?: string | null
          contact_personal?: string | null
          core_skills?: string | null
          created_at?: string
          deductions?: number | null
          department?: string | null
          designation?: string | null
          dob?: string | null
          email_official?: string | null
          email_personal?: string | null
          employee_id?: string | null
          employment_status?: string | null
          father_name?: string | null
          full_name?: string
          gender?: string | null
          gross_salary?: number | null
          id?: string
          job_status?: string | null
          joining_date?: string | null
          last_training?: string | null
          net_payable?: number | null
          performance_rating?: string | null
          reporting_to?: string | null
          skill_level?: string | null
          soft_skills?: string | null
          source?: string | null
          training_required?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          cabinet_number: string
          created_at: string
          current_status: string
          department: string
          document_title: string
          file_code: string
          full_location_code: string
          history: Json
          id: string
          issued_to: string
          row: string
          side: string
          updated_at: string
          year: string
        }
        Insert: {
          cabinet_number?: string
          created_at?: string
          current_status?: string
          department?: string
          document_title?: string
          file_code?: string
          full_location_code?: string
          history?: Json
          id?: string
          issued_to?: string
          row?: string
          side?: string
          updated_at?: string
          year?: string
        }
        Update: {
          cabinet_number?: string
          created_at?: string
          current_status?: string
          department?: string
          document_title?: string
          file_code?: string
          full_location_code?: string
          history?: Json
          id?: string
          issued_to?: string
          row?: string
          side?: string
          updated_at?: string
          year?: string
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
