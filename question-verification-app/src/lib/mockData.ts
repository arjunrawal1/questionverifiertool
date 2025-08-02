import type { QuestionVerification, Question, Topic, Subject } from "../types/question"

export const mockSubjects: Subject[] = [
  { id: 454, title: "Mathematics", slug: "mathematics" },
  { id: 455, title: "Physics", slug: "physics" },
  { id: 456, title: "Chemistry", slug: "chemistry" },
]

export const mockTopics: Topic[] = [
  {
    id: 1,
    title: "Algebra",
    slug: "algebra",
    parentTopicId: null,
    subjectId: 454,
    childTopics: [
      {
        id: 11,
        title: "Linear Equations",
        slug: "linear-equations",
        parentTopicId: 1,
        subjectId: 454,
      },
      {
        id: 12,
        title: "Quadratic Equations",
        slug: "quadratic-equations",
        parentTopicId: 1,
        subjectId: 454,
      },
    ],
  },
  {
    id: 2,
    title: "Calculus",
    slug: "calculus",
    parentTopicId: null,
    subjectId: 454,
    childTopics: [
      {
        id: 21,
        title: "Differentiation",
        slug: "differentiation",
        parentTopicId: 2,
        subjectId: 454,
      },
      { id: 22, title: "Integration", slug: "integration", parentTopicId: 2, subjectId: 454 },
    ],
  },
  {
    id: 3,
    title: "Mechanics",
    slug: "mechanics",
    parentTopicId: null,
    subjectId: 455,
    childTopics: [
      { id: 31, title: "Forces", slug: "forces", parentTopicId: 3, subjectId: 455 },
      { id: 32, title: "Motion", slug: "motion", parentTopicId: 3, subjectId: 455 },
    ],
  },
]

export const mockQuestions: Question[] = [
  {
    id: "q1",
    specification: "Solve the quadratic equation x² + 5x + 6 = 0",
    questionType: "LA",
    level: "AS",
    paper: "Paper 1",
    subjectId: 454,
    difficulty: 4,
    parts: [
      {
        id: "p1",
        content: "Find the values of x that satisfy the equation.",
        markscheme: "x = -2 or x = -3. Method: factoring (x+2)(x+3) = 0",
        marks: 3,
        order: 1,
      },
    ],
    options: [],
    currentRevisionId: 1,
    questionSet: "STUDENT",
  },
  {
    id: "q2",
    specification: "Which of the following is equal to 2³?",
    questionType: "MC",
    level: "GCSE",
    paper: "Paper 2",
    subjectId: 454,
    difficulty: 2,
    parts: [],
    options: [
      { id: "o1", content: "6", correct: false, order: 1, markscheme: "" },
      { id: "o2", content: "8", correct: true, order: 2, markscheme: "2³ = 2 × 2 × 2 = 8" },
      { id: "o3", content: "9", correct: false, order: 3, markscheme: "" },
      { id: "o4", content: "12", correct: false, order: 4, markscheme: "" },
    ],
    currentRevisionId: 1,
    questionSet: "STUDENT",
  },
  {
    id: "q3",
    specification:
      "A ball is thrown vertically upward with an initial velocity of 20 m/s. Calculate the maximum height reached.",
    questionType: "LA",
    level: "A Level",
    paper: "Paper 1",
    subjectId: 455,
    difficulty: 6,
    parts: [
      {
        id: "p3",
        content: "Using the equation v² = u² + 2as, find the maximum height.",
        markscheme:
          "At maximum height, v = 0. Using v² = u² + 2as: 0 = 20² + 2(-9.8)s. s = 400/(2×9.8) = 20.4 m",
        marks: 4,
        order: 1,
      },
    ],
    options: [],
    currentRevisionId: 1,
    questionSet: "STUDENT",
  },
]

export const mockVerifications: QuestionVerification[] = [
  {
    id: "v1",
    questionId: "q1",
    referenceQuestionId: null,
    approverUserIds: [],
    rejectedUserIds: [],
    referenceSource: "AQA Past Papers",
    status: "pending",
    metadata: { challengeQuestion: false },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questionSpecification: "Solve the quadratic equation x² + 5x + 6 = 0",
    questionDifficulty: 4,
    questionType: "LA",
    questionLevel: "AS",
    questionPaper: "Paper 1",
    questionSubjectId: 454,
    subjectTitle: "Mathematics",
    subjectSlug: "mathematics",
  },
  {
    id: "v2",
    questionId: "q2",
    referenceQuestionId: null,
    approverUserIds: [],
    rejectedUserIds: [],
    referenceSource: "Edexcel Past Papers",
    status: "pending",
    metadata: { challengeQuestion: true },
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    questionSpecification: "Which of the following is equal to 2³?",
    questionDifficulty: 2,
    questionType: "MC",
    questionLevel: "GCSE",
    questionPaper: "Paper 2",
    questionSubjectId: 454,
    subjectTitle: "Mathematics",
    subjectSlug: "mathematics",
  },
  {
    id: "v3",
    questionId: "q3",
    referenceQuestionId: null,
    approverUserIds: ["user1"],
    rejectedUserIds: [],
    referenceSource: "OCR Past Papers",
    status: "approved",
    metadata: { challengeQuestion: false },
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    questionSpecification:
      "A ball is thrown vertically upward with an initial velocity of 20 m/s. Calculate the maximum height reached.",
    questionDifficulty: 6,
    questionType: "LA",
    questionLevel: "A Level",
    questionPaper: "Paper 1",
    questionSubjectId: 455,
    subjectTitle: "Physics",
    subjectSlug: "physics",
  },
]

// Helper function to get question by ID
export const getQuestionById = (id: string): Question | null => {
  return mockQuestions.find((q) => q.id === id) || null
}

// Helper function to get subject by ID
export const getSubjectById = (id: number): Subject | null => {
  return mockSubjects.find((s) => s.id === id) || null
}

// Helper function to get topics by subject ID
export const getTopicsBySubjectId = (subjectId: number): Topic[] => {
  return mockTopics.filter((t) => t.subjectId === subjectId)
}
