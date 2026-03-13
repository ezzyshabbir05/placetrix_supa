// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/[testId]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { CandidateTestDetailClient } from "./CandidateTestDetailClient"
import { InstituteTestDetailClient } from "./InstituteTestDetailClient"
import type {
  CandidateTestDetail,
  CandidateAttemptDetail,
  InstituteTestDetail,
  InstituteQuestion,
  InstituteAttemptRow,
} from "./_types"

// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER DATA
// Replace the sections below with your real data-fetching logic.
// ─────────────────────────────────────────────────────────────────────────────

// ── Toggle which view to preview ──────────────────────────────────────────────
//
//   "candidate-no-attempt"     → student who hasn't started yet
//   "candidate-in-progress"    → student mid-attempt
//   "candidate-submitted-locked"  → submitted, results not released
//   "candidate-submitted-results" → submitted, results visible
//   "institute"                → institute/admin view
//
const PREVIEW_MODE =
  "candidate-no-attempt" as
    | "candidate-no-attempt"
    | "candidate-in-progress"
    | "candidate-submitted-locked"
    | "candidate-submitted-results"
    | "institute"

// ── Shared test metadata ──────────────────────────────────────────────────────

const PLACEHOLDER_TEST_BASE = {
  id: "test-001",
  title: "Organic Chemistry – Unit 3 Assessment",
  description:
    "Covers reaction mechanisms, stereochemistry, and functional group transformations from chapters 8–11.",
  instructions:
    "• Read each question carefully before selecting your answer.\n• Each question carries equal marks unless stated otherwise.\n• Do not navigate away or refresh during the test.\n• You may revisit flagged questions before submitting.",
  time_limit_seconds: 3600, // 60 minutes
  available_from: "2025-06-01T09:00:00Z",
  available_until: "2026-06-30T23:59:00Z",
  results_available: true,
  institute_name: "Greenfield Science Academy",
}

// ── Candidate placeholder data ────────────────────────────────────────────────

const CANDIDATE_TEST: CandidateTestDetail = {
  ...PLACEHOLDER_TEST_BASE,
  questions: undefined
}

const CANDIDATE_ATTEMPT_SUBMITTED: CandidateAttemptDetail = {
  id: "attempt-001",
  status: "submitted",
  score: 34,
  total_marks: 50,
  percentage: 68,
  started_at: "2025-06-10T10:00:00Z",
  submitted_at: "2025-06-10T10:47:32Z",
  time_spent_seconds: 2852,
  answers: [
    {
      question_id: "q1",
      question_text: "Which of the following best describes an SN2 reaction mechanism?",
      question_type: "single_correct",
      marks: 5,
      explanation:
        "SN2 reactions proceed via a backside attack by the nucleophile, forming a single transition state. The rate depends on both the substrate and nucleophile concentrations.",
      order_index: 0,
      is_correct: true,
      marks_awarded: 5,
      selected_option_ids: ["q1-opt-b"],
      options: [
        { id: "q1-opt-a", option_text: "Two-step mechanism via a carbocation intermediate", order_index: 0, is_correct: false },
        { id: "q1-opt-b", option_text: "Concerted backside attack with inversion of configuration", order_index: 1, is_correct: true },
        { id: "q1-opt-c", option_text: "Radical chain mechanism initiated by heat or light", order_index: 2, is_correct: false },
        { id: "q1-opt-d", option_text: "Elimination followed by addition", order_index: 3, is_correct: false },
      ],
      tags: [{ id: "tag-1", name: "Nucleophilic Substitution" }, { id: "tag-2", name: "Mechanisms" }],
    },
    {
      question_id: "q2",
      question_text: "Identify all products formed when 2-bromobutane undergoes an E2 elimination with a strong base.",
      question_type: "multiple_correct",
      marks: 8,
      explanation:
        "E2 elimination follows Zaitsev's rule as the major pathway, giving but-2-ene as the major product and but-1-ene as the minor product. Both stereoisomers of but-2-ene are possible.",
      order_index: 1,
      is_correct: false,
      marks_awarded: 0,
      selected_option_ids: ["q2-opt-a"],
      options: [
        { id: "q2-opt-a", option_text: "But-1-ene", order_index: 0, is_correct: true },
        { id: "q2-opt-b", option_text: "But-2-ene", order_index: 1, is_correct: true },
        { id: "q2-opt-c", option_text: "Butanol", order_index: 2, is_correct: false },
        { id: "q2-opt-d", option_text: "2-methylpropene", order_index: 3, is_correct: false },
      ],
      tags: [{ id: "tag-3", name: "Elimination" }, { id: "tag-2", name: "Mechanisms" }],
    },
    {
      question_id: "q3",
      question_text: "What is the IUPAC name for the compound with the structure CH₃–CH(OH)–CH₂–COOH?",
      question_type: "single_correct",
      marks: 5,
      explanation: null,
      order_index: 2,
      is_correct: true,
      marks_awarded: 5,
      selected_option_ids: ["q3-opt-c"],
      options: [
        { id: "q3-opt-a", option_text: "3-hydroxybutanoic acid", order_index: 0, is_correct: false },
        { id: "q3-opt-b", option_text: "2-methylmalonic acid", order_index: 1, is_correct: false },
        { id: "q3-opt-c", option_text: "3-hydroxybutanoic acid", order_index: 2, is_correct: true },
        { id: "q3-opt-d", option_text: "2-hydroxybutanoic acid", order_index: 3, is_correct: false },
      ],
      tags: [{ id: "tag-4", name: "Nomenclature" }],
    },
    {
      question_id: "q4",
      question_text: "A chiral molecule that is non-superimposable on its mirror image is called a/an:",
      question_type: "single_correct",
      marks: 5,
      explanation:
        "An enantiomer is a non-superimposable mirror image of a chiral molecule. Diastereomers are stereoisomers that are not mirror images.",
      order_index: 3,
      is_correct: false,
      marks_awarded: 0,
      selected_option_ids: ["q4-opt-a"],
      options: [
        { id: "q4-opt-a", option_text: "Diastereomer", order_index: 0, is_correct: false },
        { id: "q4-opt-b", option_text: "Enantiomer", order_index: 1, is_correct: true },
        { id: "q4-opt-c", option_text: "Epimer", order_index: 2, is_correct: false },
        { id: "q4-opt-d", option_text: "Conformational isomer", order_index: 3, is_correct: false },
      ],
      tags: [{ id: "tag-5", name: "Stereochemistry" }],
    },
    {
      question_id: "q5",
      question_text: "Which reagent is used to convert an alkene to a vicinal diol?",
      question_type: "single_correct",
      marks: 5,
      explanation:
        "OsO₄ oxidises alkenes to syn-diols (vicinal diols). Ozone (O₃) cleaves the double bond, and HBr adds across it via Markovnikov's rule.",
      order_index: 4,
      is_correct: true,
      marks_awarded: 5,
      selected_option_ids: ["q5-opt-b"],
      options: [
        { id: "q5-opt-a", option_text: "O₃ / Zn, H₂O (ozonolysis)", order_index: 0, is_correct: false },
        { id: "q5-opt-b", option_text: "OsO₄, then NaHSO₃/H₂O", order_index: 1, is_correct: true },
        { id: "q5-opt-c", option_text: "HBr (Markovnikov addition)", order_index: 2, is_correct: false },
        { id: "q5-opt-d", option_text: "NaBH₄ in ethanol", order_index: 3, is_correct: false },
      ],
      tags: [{ id: "tag-6", name: "Oxidation" }, { id: "tag-1", name: "Nucleophilic Substitution" }],
    },
    {
      // Skipped question
      question_id: "q6",
      question_text: "Draw and name the major product of the Diels-Alder reaction between butadiene and maleic anhydride.",
      question_type: "single_correct",
      marks: 7,
      explanation: null,
      order_index: 5,
      is_correct: null,
      marks_awarded: null,
      selected_option_ids: [],
      options: [
        { id: "q6-opt-a", option_text: "cis-4-cyclohexene-1,2-dicarboxylic anhydride", order_index: 0, is_correct: true },
        { id: "q6-opt-b", option_text: "trans-4-cyclohexene-1,2-dicarboxylic anhydride", order_index: 1, is_correct: false },
        { id: "q6-opt-c", option_text: "cyclohexane-1,4-dicarboxylic anhydride", order_index: 2, is_correct: false },
        { id: "q6-opt-d", option_text: "benzene-1,2-dicarboxylic anhydride", order_index: 3, is_correct: false },
      ],
      tags: [{ id: "tag-7", name: "Cycloaddition" }],
    },
  ],
}

const CANDIDATE_ATTEMPT_IN_PROGRESS: CandidateAttemptDetail = {
  id: "attempt-002",
  status: "in_progress",
  score: null,
  total_marks: null,
  percentage: null,
  started_at: new Date(Date.now() - 1200 * 1000).toISOString(),
  submitted_at: null,
  time_spent_seconds: null,
  answers: [],
}

// ── Institute placeholder data ────────────────────────────────────────────────

const INSTITUTE_QUESTIONS: InstituteQuestion[] = [
  {
    id: "q1",
    question_text: "Which of the following best describes an SN2 reaction mechanism?",
    question_type: "single_correct",
    order_index: 0,
    marks: 5,
    explanation:
      "SN2 reactions proceed via a backside attack by the nucleophile, forming a single transition state. The rate depends on both the substrate and nucleophile concentrations.",
    options: [
      { id: "q1-opt-a", option_text: "Two-step mechanism via a carbocation intermediate", is_correct: false, order_index: 0 },
      { id: "q1-opt-b", option_text: "Concerted backside attack with inversion of configuration", is_correct: true, order_index: 1 },
      { id: "q1-opt-c", option_text: "Radical chain mechanism initiated by heat or light", is_correct: false, order_index: 2 },
      { id: "q1-opt-d", option_text: "Elimination followed by addition", is_correct: false, order_index: 3 },
    ],
    tags: [{ id: "tag-1", name: "Nucleophilic Substitution" }, { id: "tag-2", name: "Mechanisms" }],
  },
  {
    id: "q2",
    question_text: "Identify all products formed when 2-bromobutane undergoes an E2 elimination with a strong base.",
    question_type: "multiple_correct",
    order_index: 1,
    marks: 8,
    explanation:
      "E2 elimination follows Zaitsev's rule as the major pathway, giving but-2-ene as the major product and but-1-ene as the minor product.",
    options: [
      { id: "q2-opt-a", option_text: "But-1-ene", is_correct: true, order_index: 0 },
      { id: "q2-opt-b", option_text: "But-2-ene", is_correct: true, order_index: 1 },
      { id: "q2-opt-c", option_text: "Butanol", is_correct: false, order_index: 2 },
      { id: "q2-opt-d", option_text: "2-methylpropene", is_correct: false, order_index: 3 },
    ],
    tags: [{ id: "tag-3", name: "Elimination" }, { id: "tag-2", name: "Mechanisms" }],
  },
  {
    id: "q3",
    question_text: "What is the IUPAC name for the compound with the structure CH₃–CH(OH)–CH₂–COOH?",
    question_type: "single_correct",
    order_index: 2,
    marks: 5,
    explanation: null,
    options: [
      { id: "q3-opt-a", option_text: "2-hydroxybutanoic acid", is_correct: false, order_index: 0 },
      { id: "q3-opt-b", option_text: "2-methylmalonic acid", is_correct: false, order_index: 1 },
      { id: "q3-opt-c", option_text: "3-hydroxybutanoic acid", is_correct: true, order_index: 2 },
      { id: "q3-opt-d", option_text: "4-hydroxybutanoic acid", is_correct: false, order_index: 3 },
    ],
    tags: [{ id: "tag-4", name: "Nomenclature" }],
  },
  {
    id: "q4",
    question_text: "A chiral molecule that is non-superimposable on its mirror image is called a/an:",
    question_type: "single_correct",
    order_index: 3,
    marks: 5,
    explanation:
      "An enantiomer is a non-superimposable mirror image of a chiral molecule. Diastereomers are stereoisomers that are not mirror images.",
    options: [
      { id: "q4-opt-a", option_text: "Diastereomer", is_correct: false, order_index: 0 },
      { id: "q4-opt-b", option_text: "Enantiomer", is_correct: true, order_index: 1 },
      { id: "q4-opt-c", option_text: "Epimer", is_correct: false, order_index: 2 },
      { id: "q4-opt-d", option_text: "Conformational isomer", is_correct: false, order_index: 3 },
    ],
    tags: [{ id: "tag-5", name: "Stereochemistry" }],
  },
  {
    id: "q5",
    question_text: "Which reagent is used to convert an alkene to a vicinal diol?",
    question_type: "single_correct",
    order_index: 4,
    marks: 5,
    explanation:
      "OsO₄ oxidises alkenes to syn-diols (vicinal diols). Ozone (O₃) cleaves the double bond.",
    options: [
      { id: "q5-opt-a", option_text: "O₃ / Zn, H₂O (ozonolysis)", is_correct: false, order_index: 0 },
      { id: "q5-opt-b", option_text: "OsO₄, then NaHSO₃/H₂O", is_correct: true, order_index: 1 },
      { id: "q5-opt-c", option_text: "HBr (Markovnikov addition)", is_correct: false, order_index: 2 },
      { id: "q5-opt-d", option_text: "NaBH₄ in ethanol", is_correct: false, order_index: 3 },
    ],
    tags: [{ id: "tag-6", name: "Oxidation" }],
  },
  {
    id: "q6",
    question_text: "Draw and name the major product of the Diels-Alder reaction between butadiene and maleic anhydride.",
    question_type: "single_correct",
    order_index: 5,
    marks: 7,
    explanation: null,
    options: [
      { id: "q6-opt-a", option_text: "cis-4-cyclohexene-1,2-dicarboxylic anhydride", is_correct: true, order_index: 0 },
      { id: "q6-opt-b", option_text: "trans-4-cyclohexene-1,2-dicarboxylic anhydride", is_correct: false, order_index: 1 },
      { id: "q6-opt-c", option_text: "cyclohexane-1,4-dicarboxylic anhydride", is_correct: false, order_index: 2 },
      { id: "q6-opt-d", option_text: "benzene-1,2-dicarboxylic anhydride", is_correct: false, order_index: 3 },
    ],
    tags: [{ id: "tag-7", name: "Cycloaddition" }],
  },
  {
    id: "q7",
    question_text: "What is the hybridisation of the carbon atom in carbon dioxide (CO₂)?",
    question_type: "single_correct",
    order_index: 6,
    marks: 5,
    explanation:
      "The carbon in CO₂ forms two double bonds and has no lone pairs, resulting in sp hybridisation and a linear geometry.",
    options: [
      { id: "q7-opt-a", option_text: "sp³", is_correct: false, order_index: 0 },
      { id: "q7-opt-b", option_text: "sp²", is_correct: false, order_index: 1 },
      { id: "q7-opt-c", option_text: "sp", is_correct: true, order_index: 2 },
      { id: "q7-opt-d", option_text: "sp³d", is_correct: false, order_index: 3 },
    ],
    tags: [{ id: "tag-8", name: "Bonding" }],
  },
  {
    id: "q8",
    question_text: "Which of the following is the strongest acid?",
    question_type: "single_correct",
    order_index: 7,
    marks: 5,
    explanation:
      "Trifluoroacetic acid (CF₃COOH) is the strongest because the three fluorine atoms withdraw electron density by induction, stabilising the conjugate base.",
    options: [
      { id: "q8-opt-a", option_text: "CH₃COOH (acetic acid)", is_correct: false, order_index: 0 },
      { id: "q8-opt-b", option_text: "CF₃COOH (trifluoroacetic acid)", is_correct: true, order_index: 1 },
      { id: "q8-opt-c", option_text: "CCl₃COOH (trichloroacetic acid)", is_correct: false, order_index: 2 },
      { id: "q8-opt-d", option_text: "CHF₂COOH (difluoroacetic acid)", is_correct: false, order_index: 3 },
    ],
    tags: [{ id: "tag-9", name: "Acidity" }],
  },
  {
    id: "q9",
    question_text: "Select ALL reagents that can be used to reduce a carboxylic acid to a primary alcohol.",
    question_type: "multiple_correct",
    order_index: 8,
    marks: 5,
    explanation:
      "LiAlH₄ and BH₃·THF are both capable of reducing carboxylic acids to primary alcohols. NaBH₄ alone is too mild.",
    options: [
      { id: "q9-opt-a", option_text: "LiAlH₄ in dry ether", is_correct: true, order_index: 0 },
      { id: "q9-opt-b", option_text: "NaBH₄ in methanol", is_correct: false, order_index: 1 },
      { id: "q9-opt-c", option_text: "BH₃·THF followed by H₂O₂/NaOH", is_correct: true, order_index: 2 },
      { id: "q9-opt-d", option_text: "H₂ / Pd–C (catalytic hydrogenation)", is_correct: false, order_index: 3 },
    ],
    tags: [{ id: "tag-10", name: "Reduction" }],
  },
  {
    id: "q10",
    question_text: "Which technique is most useful for determining the connectivity of atoms in an unknown organic molecule?",
    question_type: "single_correct",
    order_index: 9,
    marks: 5,
    explanation:
      "¹H and ¹³C NMR spectroscopy reveals atom connectivity and chemical environment. Mass spectrometry gives molecular weight; IR identifies functional groups.",
    options: [
      { id: "q10-opt-a", option_text: "Infrared (IR) spectroscopy", is_correct: false, order_index: 0 },
      { id: "q10-opt-b", option_text: "Mass spectrometry (MS)", is_correct: false, order_index: 1 },
      { id: "q10-opt-c", option_text: "Nuclear magnetic resonance (NMR) spectroscopy", is_correct: true, order_index: 2 },
      { id: "q10-opt-d", option_text: "UV-Vis spectroscopy", is_correct: false, order_index: 3 },
    ],
    tags: [{ id: "tag-11", name: "Spectroscopy" }],
  },
]

const INSTITUTE_ATTEMPTS: InstituteAttemptRow[] = [
  {
    id: "att-1", student_id: "s1",
    student_name: "Aisha Patel", student_email: "aisha.patel@student.edu",
    status: "submitted", score: 43, total_marks: 50, percentage: 86,
    started_at: "2025-06-10T09:01:00Z", submitted_at: "2025-06-10T09:54:22Z", time_spent_seconds: 3202,
  },
  {
    id: "att-2", student_id: "s2",
    student_name: "James Okafor", student_email: "james.okafor@student.edu",
    status: "submitted", score: 34, total_marks: 50, percentage: 68,
    started_at: "2025-06-10T10:00:00Z", submitted_at: "2025-06-10T10:47:32Z", time_spent_seconds: 2852,
  },
  {
    id: "att-3", student_id: "s3",
    student_name: "Maria Gonzalez", student_email: "m.gonzalez@student.edu",
    status: "submitted", score: 28, total_marks: 50, percentage: 56,
    started_at: "2025-06-10T11:10:00Z", submitted_at: "2025-06-10T12:05:18Z", time_spent_seconds: 3318,
  },
  {
    id: "att-4", student_id: "s4",
    student_name: "Liam Chen", student_email: "liam.chen@student.edu",
    status: "submitted", score: 19, total_marks: 50, percentage: 38,
    started_at: "2025-06-11T08:30:00Z", submitted_at: "2025-06-11T09:22:10Z", time_spent_seconds: 3130,
  },
  {
    id: "att-5", student_id: "s5",
    student_name: "Sofia Andersen", student_email: "sofia.a@student.edu",
    status: "submitted", score: 47, total_marks: 50, percentage: 94,
    started_at: "2025-06-11T14:00:00Z", submitted_at: "2025-06-11T14:41:55Z", time_spent_seconds: 2515,
  },
  {
    id: "att-6", student_id: "s6",
    student_name: "Raj Malhotra", student_email: "raj.m@student.edu",
    status: "in_progress", score: null, total_marks: null, percentage: null,
    started_at: new Date(Date.now() - 900 * 1000).toISOString(), submitted_at: null, time_spent_seconds: 900,
  },
  {
    id: "att-7", student_id: "s7",
    student_name: "Emma Fischer", student_email: "emma.f@student.edu",
    status: "in_progress", score: null, total_marks: null, percentage: null,
    started_at: new Date(Date.now() - 300 * 1000).toISOString(), submitted_at: null, time_spent_seconds: 300,
  },
]

const INSTITUTE_TEST: InstituteTestDetail = {
  ...PLACEHOLDER_TEST_BASE,
  status: "published",
  questions: INSTITUTE_QUESTIONS,
  attempts: INSTITUTE_ATTEMPTS,
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ testId: string }>
}

export default async function TestDetailPage({ params }: Props) {
  // `params` is awaited so this file stays compatible with Next.js 15+
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { testId } = await params

  // ── Candidate views ─────────────────────────────────────────────────────

  if (PREVIEW_MODE === "candidate-no-attempt") {
    return (
      <CandidateTestDetailClient
        test={CANDIDATE_TEST}
        attempt={null}
      />
    )
  }

  if (PREVIEW_MODE === "candidate-in-progress") {
    return (
      <CandidateTestDetailClient
        test={CANDIDATE_TEST}
        attempt={CANDIDATE_ATTEMPT_IN_PROGRESS}
      />
    )
  }

  if (PREVIEW_MODE === "candidate-submitted-locked") {
    return (
      <CandidateTestDetailClient
        test={{ ...CANDIDATE_TEST, results_available: false }}
        attempt={CANDIDATE_ATTEMPT_SUBMITTED}
      />
    )
  }

  if (PREVIEW_MODE === "candidate-submitted-results") {
    return (
      <CandidateTestDetailClient
        test={{ ...CANDIDATE_TEST, results_available: true }}
        attempt={CANDIDATE_ATTEMPT_SUBMITTED}
      />
    )
  }

  // ── Institute view ──────────────────────────────────────────────────────

  return <InstituteTestDetailClient test={INSTITUTE_TEST} />
}