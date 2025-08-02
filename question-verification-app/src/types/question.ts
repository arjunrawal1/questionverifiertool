export interface QuestionPart {
  id: string
  content: string
  markscheme: string
  marks: number
  order: number
}

export interface QuestionOption {
  id: string
  content: string
  correct: boolean
  order: number
  markscheme: string
}

export interface Question {
  id: string
  specification: string
  questionType: string | null
  level: string | null
  paper: string | null
  subjectId: number | null
  difficulty: number | null
  parts: QuestionPart[]
  options: QuestionOption[]
  currentRevisionId?: number
  questionSet?: string
}

export interface Subject {
  id: number
  title: string
  slug: string
}

export interface Topic {
  id: number
  title: string
  slug: string
  parentTopicId: number | null
  subjectId: number
  childTopics?: Topic[]
}

export interface QuestionVerification {
  id: string
  questionId: string
  referenceQuestionId: string | null
  approverUserIds: string[]
  rejectedUserIds: string[]
  referenceSource: string | null
  status: "pending" | "approved" | "rejected" | "needImage"
  metadata: Record<string, any> | null
  createdAt: string
  updatedAt: string
  // Joined data
  questionSpecification: string | null
  questionDifficulty: number | null
  questionType: string | null
  questionLevel: string | null
  questionPaper: string | null
  questionSubjectId: number | null
  subjectTitle: string | null
  subjectSlug: string | null
}

export interface QuestionVerificationWithData extends QuestionVerification {
  question: Question | null
  referenceQuestion: Question | null
  topics: Topic[]
  subject: Subject | null
}

export interface Filters {
  difficulty: string
  referenceSource: string
  status: string
  sortBy: "created" | "difficulty" | "topic" | "status"
  topicIds: number[]
  challengeQuestion: string
}

export interface ActiveFilters {
  [key: string]: string
}
