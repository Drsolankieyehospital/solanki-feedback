import type { StringKey } from "./i18n/en";
import type { Feedback } from "@/types/database";

// Columns on `feedback` that hold an answer.
export type StarField =
  | "reception_rating"
  | "billing_rating"
  | "waiting_rating"
  | "doctor_rating"
  | "exam_rating"
  | "cleanliness_rating"
  | "pharmacy_rating"
  | "overall_rating";

export type ChoiceField = "consultant_info" | "staff_helpful" | "would_recommend";

export type StarQuestion = {
  n: number;
  field: StarField;
  labelKey: StringKey;
  type: "star";
};
export type ChoiceQuestion = {
  n: number;
  field: ChoiceField;
  labelKey: StringKey;
  type: "choice";
  options: Array<"yes" | "no" | "incomplete">;
};
export type TextQuestion = {
  n: number;
  field: "employee_recognition";
  labelKey: StringKey;
  type: "text";
  max: number;
};

export type Question = StarQuestion | ChoiceQuestion | TextQuestion;

// The patient-journey order shown on the form (Q1..Q12).
export const QUESTIONS: Question[] = [
  { n: 1, field: "reception_rating", labelKey: "q1", type: "star" },
  { n: 2, field: "billing_rating", labelKey: "q8", type: "star" },
  { n: 3, field: "waiting_rating", labelKey: "q9", type: "star" },
  {
    n: 4,
    field: "consultant_info",
    labelKey: "q2",
    type: "choice",
    options: ["yes", "no", "incomplete"],
  },
  { n: 5, field: "doctor_rating", labelKey: "q10", type: "star" },
  { n: 6, field: "exam_rating", labelKey: "q11", type: "star" },
  { n: 7, field: "cleanliness_rating", labelKey: "q3", type: "star" },
  { n: 8, field: "pharmacy_rating", labelKey: "q12", type: "star" },
  {
    n: 9,
    field: "staff_helpful",
    labelKey: "q4",
    type: "choice",
    options: ["yes", "no"],
  },
  { n: 10, field: "overall_rating", labelKey: "q7", type: "star" },
  {
    n: 11,
    field: "employee_recognition",
    labelKey: "q5",
    type: "text",
    max: 300,
  },
  {
    n: 12,
    field: "would_recommend",
    labelKey: "q6",
    type: "choice",
    options: ["yes", "no"],
  },
];

export const STAR_FIELDS = QUESTIONS.filter(
  (q): q is StarQuestion => q.type === "star",
).map((q) => q.field);

// Compile-time guard: every answer field is a real column on `feedback`.
type _AnswerFieldsExist = Exclude<
  StarField | ChoiceField | "employee_recognition",
  keyof Feedback
>;
const _check: _AnswerFieldsExist extends never ? true : never = true;
void _check;
