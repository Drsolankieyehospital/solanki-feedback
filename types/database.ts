// Hand-written DB types matching supabase/migrations.
// Once a live Supabase project exists, these can be regenerated with:
//   npx supabase gen types typescript --project-id <id> > types/database.ts

export type YesNo = "yes" | "no";
export type ConsultantInfo = "yes" | "no" | "incomplete";
export type AdminRole = "admin" | "viewer";
export type FeedbackStatus = "new" | "reviewed" | "follow_up" | "resolved";
export type Language = "en" | "kn";

export interface OpdStaff {
  id: string;
  name_en: string;
  name_kn: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Feedback {
  id: string;
  created_at: string;
  visit_date: string;

  patient_name: string;
  mrd_number: string;
  mobile: string;
  opd_staff_id: string;

  reception_rating: number;
  billing_rating: number;
  waiting_rating: number;
  consultant_info: ConsultantInfo;
  doctor_rating: number;
  exam_rating: number;
  cleanliness_rating: number;
  pharmacy_rating: number;
  staff_helpful: YesNo;
  overall_rating: number;

  employee_recognition: string | null;
  would_recommend: YesNo;
  suggestions: string | null;

  language: Language;
  source: string;
  ip_hash: string | null;

  status: FeedbackStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

/** Fields the public form submits (server fills the rest). */
export type FeedbackInsert = Omit<
  Feedback,
  | "id"
  | "created_at"
  | "ip_hash"
  | "status"
  | "admin_notes"
  | "reviewed_by"
  | "reviewed_at"
>;

export interface AdminUser {
  user_id: string;
  full_name: string;
  role: AdminRole;
  created_at: string;
}

export interface AuditLog {
  id: number;
  at: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
}

// ---- RPC return shapes -----------------------------------------------------
export interface DashboardSummary {
  total: number;
  today: number;
  avg_reception: number;
  avg_billing: number;
  avg_waiting: number;
  avg_doctor: number;
  avg_exam: number;
  avg_cleanliness: number;
  avg_pharmacy: number;
  avg_overall: number;
  pct_recommend: number;
  pct_staff_helpful: number;
  consultant_yes: number;
  consultant_no: number;
  consultant_incomplete: number;
  overall_dist: Record<"1" | "2" | "3" | "4" | "5", number>;
  reception_dist: Record<"1" | "2" | "3" | "4" | "5", number>;
  cleanliness_dist: Record<"1" | "2" | "3" | "4" | "5", number>;
}

export interface StaffSummaryRow {
  staff_id: string;
  name_en: string;
  name_kn: string;
  cnt: number;
  avg_overall: number;
  avg_reception: number;
  avg_cleanliness: number;
  pct_recommend: number;
  pct_staff_helpful: number;
  low_count: number;
  recognitions: number;
}

export interface DailySummaryRow {
  day: string;
  cnt: number;
  avg_overall: number;
  avg_reception: number;
  avg_cleanliness: number;
  pct_recommend: number;
}

// ---- Minimal Database type for the typed Supabase client -------------------
export interface Database {
  public: {
    Tables: {
      opd_staff: {
        Row: OpdStaff;
        Insert: Partial<OpdStaff> & Pick<OpdStaff, "name_en" | "name_kn">;
        Update: Partial<OpdStaff>;
      };
      feedback: {
        Row: Feedback;
        Insert: FeedbackInsert & Partial<Pick<Feedback, "ip_hash" | "source">>;
        Update: Partial<Feedback>;
      };
      admin_users: {
        Row: AdminUser;
        Insert: Partial<AdminUser> & Pick<AdminUser, "user_id" | "full_name">;
        Update: Partial<AdminUser>;
      };
      audit_log: {
        Row: AuditLog;
        Insert: Pick<AuditLog, "action"> & Partial<AuditLog>;
        Update: Partial<AuditLog>;
      };
    };
    Functions: {
      dashboard_summary: {
        Args: { from_date: string; to_date: string };
        Returns: DashboardSummary;
      };
      staff_summary: {
        Args: { from_date: string; to_date: string };
        Returns: StaffSummaryRow[];
      };
      daily_summary: {
        Args: { from_date: string; to_date: string };
        Returns: DailySummaryRow[];
      };
    };
  };
}
