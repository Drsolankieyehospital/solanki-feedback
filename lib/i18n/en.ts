// English strings (default). kn.ts must mirror these keys exactly — TypeScript
// enforces it via `satisfies typeof en`.
export const en = {
  // header
  hospital: "Dr. Solanki Eye Hospital",
  location: "Malleshwaram, Bengaluru",
  nabh: "NABH Accredited",
  title: "Out-Patient Feedback Form",
  intro:
    "Tell us how we are caring. Please share your feedback so we can serve you better.",

  // sections / details
  yourDetails: "Your details",
  patientName: "Patient's Name",
  mrd: "MRD Number",
  mobile: "Mobile Number",
  date: "Date",
  opdStaff: "Who assisted you at the OPD?",
  select: "Select",
  phName: "Enter full name",
  phMrd: "e.g. EH-24823",
  phMobile: "10-digit number",
  phSugg: "Share anything that would help us improve…",
  recoPh: "Name of the employee (optional)",

  // questions
  q1: "How was your experience at Reception?",
  q2: "Did our consultant give you detailed information about the ailment / procedure?",
  q3: "How do you rate the cleanliness in our hospital?",
  q4: "Were the security and other staff helpful?",
  q5: "Would you like to recognise any of our employees for delighting you during your visit?",
  q6: "Would you recommend our service to your friends / family?",
  q7: "How would you rate your overall experience at our hospital?",
  q8: "How easy was registration & billing?",
  q9: "How was the waiting time before your consultation?",
  q10: "How would you rate the doctor's consultation and care?",
  q11: "How was your eye examination / diagnostic testing?",
  q12: "How was your experience at the pharmacy / optical counter?",
  suggestions: "What would you like to tell us to improve our service?",

  // choices + star labels
  yes: "Yes",
  no: "No",
  incomplete: "Incomplete",
  optional: "(optional)",
  tapStar: "Tap a star to rate",
  starWords: ["Poor", "Fair", "Good", "Very good", "Excellent"],

  // actions / errors
  submit: "Submit Feedback",
  sending: "Sending…",
  errRequired: "This field is required",
  errName: "Please enter the patient's name",
  errMobile: "Enter a valid 10-digit mobile number",
  errRating: "Please choose a star rating",
  errChoice: "Please choose an option",
  errStaff: "Please select who assisted you",
  errDate: "Please choose a valid date",

  // consent + thanks
  consent:
    "Your details are used only to improve our service and to contact you about this feedback.",
  thanksTitle: "Thank you for your feedback!",
  thanksBody: "Your response helps us care for you better.",
  google: "Rate us on Google",
  charsLeft: "characters left",
} as const;

// Widen literal types so the Kannada dictionary can hold different strings while
// keeping the same keys (and starWords stays an indexable string array).
type Widen<T> = T extends readonly string[]
  ? readonly string[]
  : T extends string
    ? string
    : T;

export type Dict = { [K in keyof typeof en]: Widen<(typeof en)[K]> };
export type StringKey = keyof Dict;
