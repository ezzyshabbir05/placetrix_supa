// ─────────────────────────────────────────────────────────────────────────────
// app/~/tests/[testId]/attempt/page.tsx  (PLACEHOLDER / UI PREVIEW)
// Replace with the real page.tsx once DB is wired up.
// ─────────────────────────────────────────────────────────────────────────────

import { AttemptClient } from "./AttemptClient"
import type { AttemptTest, AttemptQuestion, AttemptInfo, SavedAnswer } from "./_types"

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockTest: AttemptTest = {
  id: "test-001",
  title: "Mid-Semester Assessment – Computer Science",
  description: "Covers topics from Units 1–4 including data structures, algorithms, and OOP.",
  instructions:
    "Read each question carefully before answering.\nDo not switch tabs during the test.\nAll answers are saved automatically.",
  time_limit_seconds: 30 * 60, // 30 minutes
  available_until: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
}

const mockQuestions: AttemptQuestion[] = [
  {
    id: "q1",
    question_text: "What is the time complexity of binary search on a sorted array of n elements?",
    question_type: "single_correct",
    order_index: 1,
    marks: 2,
    options: [
      { id: "q1-a", option_text: "O(n)", order_index: 1 },
      { id: "q1-b", option_text: "O(log n)", order_index: 2 },
      { id: "q1-c", option_text: "O(n log n)", order_index: 3 },
      { id: "q1-d", option_text: "O(1)", order_index: 4 },
    ],
    tags: [{ id: "t1", name: "Algorithms" }, { id: "t2", name: "Complexity" }],
  },
  {
    id: "q2",
    question_text: "Which of the following are valid ways to declare a variable in JavaScript?",
    question_type: "multiple_correct",
    order_index: 2,
    marks: 3,
    options: [
      { id: "q2-a", option_text: "var x = 10", order_index: 1 },
      { id: "q2-b", option_text: "let x = 10", order_index: 2 },
      { id: "q2-c", option_text: "const x = 10", order_index: 3 },
      { id: "q2-d", option_text: "int x = 10", order_index: 4 },
    ],
    tags: [{ id: "t3", name: "JavaScript" }],
  },
  {
    id: "q3",
    question_text: "Which data structure uses LIFO (Last In, First Out) ordering?",
    question_type: "single_correct",
    order_index: 3,
    marks: 1,
    options: [
      { id: "q3-a", option_text: "Queue", order_index: 1 },
      { id: "q3-b", option_text: "Stack", order_index: 2 },
      { id: "q3-c", option_text: "Linked List", order_index: 3 },
      { id: "q3-d", option_text: "Heap", order_index: 4 },
    ],
    tags: [{ id: "t4", name: "Data Structures" }],
  },
  {
    id: "q4",
    question_text: "In object-oriented programming, which principle refers to hiding internal implementation details?",
    question_type: "single_correct",
    order_index: 4,
    marks: 2,
    options: [
      { id: "q4-a", option_text: "Inheritance", order_index: 1 },
      { id: "q4-b", option_text: "Polymorphism", order_index: 2 },
      { id: "q4-c", option_text: "Encapsulation", order_index: 3 },
      { id: "q4-d", option_text: "Abstraction", order_index: 4 },
    ],
    tags: [{ id: "t5", name: "OOP" }],
  },
  {
    id: "q5",
    question_text: "Which of the following sorting algorithms have O(n log n) average-case time complexity?",
    question_type: "multiple_correct",
    order_index: 5,
    marks: 3,
    options: [
      { id: "q5-a", option_text: "Merge Sort", order_index: 1 },
      { id: "q5-b", option_text: "Quick Sort", order_index: 2 },
      { id: "q5-c", option_text: "Bubble Sort", order_index: 3 },
      { id: "q5-d", option_text: "Heap Sort", order_index: 4 },
    ],
    tags: [{ id: "t1", name: "Algorithms" }, { id: "t2", name: "Complexity" }],
  },
  {
    id: "q6",
    question_text: "What does SQL stand for?",
    question_type: "single_correct",
    order_index: 6,
    marks: 1,
    options: [
      { id: "q6-a", option_text: "Structured Query Language", order_index: 1 },
      { id: "q6-b", option_text: "Simple Query Language", order_index: 2 },
      { id: "q6-c", option_text: "Standard Query Logic", order_index: 3 },
      { id: "q6-d", option_text: "Sequential Query Language", order_index: 4 },
    ],
    tags: [{ id: "t6", name: "Databases" }],
  },
  {
    id: "q7",
    question_text: "Which HTTP method is typically used to update an existing resource?",
    question_type: "single_correct",
    order_index: 7,
    marks: 2,
    options: [
      { id: "q7-a", option_text: "GET", order_index: 1 },
      { id: "q7-b", option_text: "POST", order_index: 2 },
      { id: "q7-c", option_text: "PUT", order_index: 3 },
      { id: "q7-d", option_text: "DELETE", order_index: 4 },
    ],
    tags: [{ id: "t7", name: "Web" }, { id: "t8", name: "REST" }],
  },
  {
    id: "q8",
    question_text: "Which of the following are NoSQL database types?",
    question_type: "multiple_correct",
    order_index: 8,
    marks: 3,
    options: [
      { id: "q8-a", option_text: "Document store", order_index: 1 },
      { id: "q8-b", option_text: "Key-value store", order_index: 2 },
      { id: "q8-c", option_text: "Relational", order_index: 3 },
      { id: "q8-d", option_text: "Graph database", order_index: 4 },
    ],
    tags: [{ id: "t6", name: "Databases" }],
  },
]

const mockAttemptInfo: AttemptInfo = {
  id: "attempt-001",
  started_at: new Date().toISOString(),
  time_spent_seconds: 500,
}

// Pre-seed one saved answer to demonstrate resume behaviour
const mockSavedAnswers: SavedAnswer[] = [
  { question_id: "q1", selected_option_ids: ["q1-b"] },
]

// ─── No-op server actions for UI preview ─────────────────────────────────────

async function handleSaveAnswer(
  _attemptId: string,
  _questionId: string,
  _selectedIds: string[]
) {
  "use server"
  // No-op: answers are kept in local state only during preview
}

async function handleSubmit(_attemptId: string, _timeSpentSeconds: number) {
  "use server"
  // No-op: redirect or toast would go here in production
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttemptPage() {
  return (
    <AttemptClient
      test={mockTest}
      questions={mockQuestions}
      attemptInfo={mockAttemptInfo}
      savedAnswers={mockSavedAnswers}
      onSaveAnswer={handleSaveAnswer}
      onSubmit={handleSubmit}
    />
  )
}