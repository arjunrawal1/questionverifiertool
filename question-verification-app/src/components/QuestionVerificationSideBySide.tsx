import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"
import { RenderMarkdown } from "./RenderMarkdown"
import {
  loadQuestionDetails,
  approveQuestion,
  rejectQuestion,
  needImageQuestion,
} from "../lib/actions"
import { PiArrowLeft, PiCheck, PiX, PiImage, PiArrowRight } from "react-icons/pi"
import toast from "react-hot-toast"

interface QuestionVerificationSideBySideProps {
  verificationId: string
  onBack: () => void
  onNext: () => void
}

interface QuestionDisplayProps {
  question: any
  title: string
  isReference?: boolean
}

function QuestionDisplay({ question, title, isReference = false }: QuestionDisplayProps) {
  if (!question) {
    return (
      <div
        className="p-8 text-center"
        style={{ border: "2px dashed #d1d5db", borderRadius: "12px" }}
      >
        <p style={{ color: "#6b7280" }}>No {isReference ? "reference " : ""}question available</p>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: "1.5rem",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        backgroundColor: isReference ? "#f9fafb" : "white",
      }}
    >
      <h4
        style={{
          fontSize: "1.125rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: isReference ? "#6b7280" : "#059669",
        }}
      >
        {title}
      </h4>

      {/* Question specification */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h5 style={{ fontWeight: "600", marginBottom: "0.5rem" }}>Question:</h5>
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            lineHeight: "1.6",
          }}
        >
          <RenderMarkdown className="max-w-none text-base">{question.specification}</RenderMarkdown>
        </div>
      </div>

      {/* Question parts */}
      {question.parts && question.parts.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h5 style={{ fontWeight: "600", marginBottom: "0.5rem" }}>Parts:</h5>
          {question.parts.map((part: any, index: number) => (
            <div
              key={part.id}
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                backgroundColor: "#f1f5f9",
                borderRadius: "8px",
              }}
            >
              <div style={{ fontWeight: "500", marginBottom: "0.5rem" }}>
                Part {index + 1} ({part.marks} marks)
              </div>
              <div style={{ marginBottom: "0.5rem", lineHeight: "1.6" }}>
                <RenderMarkdown className="max-w-none text-base">{part.content}</RenderMarkdown>
              </div>
              {part.markscheme && (
                <div
                  style={{
                    padding: "0.5rem",
                    backgroundColor: "#ecfdf5",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                  }}
                >
                  <strong>Markscheme:</strong>{" "}
                  <RenderMarkdown className="max-w-none text-sm inline">
                    {part.markscheme}
                  </RenderMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Multiple choice options */}
      {question.options && question.options.length > 0 && (
        <div>
          <h5 style={{ fontWeight: "600", marginBottom: "0.5rem" }}>Options:</h5>
          {question.options.map((option: any, index: number) => (
            <div
              key={option.id}
              style={{
                marginBottom: "0.5rem",
                padding: "0.75rem",
                backgroundColor: option.correct ? "#dcfce7" : "#f8fafc",
                borderRadius: "8px",
                border: option.correct ? "2px solid #16a34a" : "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                }}
              >
                <span>{String.fromCharCode(65 + index)}.</span>
                <div style={{ flex: 1 }}>
                  <RenderMarkdown className="max-w-none text-base">{option.content}</RenderMarkdown>
                </div>
                {option.correct && (
                  <span style={{ color: "#16a34a", marginLeft: "0.5rem" }}>✓ Correct</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question metadata */}
      <div
        style={{
          marginTop: "1.5rem",
          padding: "1rem",
          backgroundColor: "#f1f5f9",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0.5rem",
            fontSize: "0.875rem",
          }}
        >
          {question.difficulty && (
            <div>
              <strong>Difficulty:</strong> {question.difficulty}/10
            </div>
          )}
          {question.level && (
            <div>
              <strong>Level:</strong> {question.level}
            </div>
          )}
          {question.paper && (
            <div>
              <strong>Paper:</strong> {question.paper}
            </div>
          )}
          {question.questionType && (
            <div>
              <strong>Type:</strong> {question.questionType}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function QuestionVerificationSideBySide({
  verificationId,
  onBack,
  onNext,
}: QuestionVerificationSideBySideProps) {
  const [loading, setLoading] = useState(false)
  const [optimisticApproved, setOptimisticApproved] = useState(false)

  // Reset local states when verificationId changes
  useEffect(() => {
    setLoading(false)
    setOptimisticApproved(false)
  }, [verificationId])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["question-verification-details", verificationId],
    queryFn: () => loadQuestionDetails(verificationId),
    staleTime: 5 * 60 * 1000,
  })

  const verification = data?.verification
  const newQuestion = data?.newQuestion
  const referenceQuestion = data?.referenceQuestion

  const handleApprove = async () => {
    setOptimisticApproved(true)
    setLoading(true)

    try {
      const result = await approveQuestion(verificationId)
      if (result.success) {
        toast.success("Question approved successfully!")
        setTimeout(() => {
          refetch()
          onNext()
        }, 1000)
      } else {
        setOptimisticApproved(false)
        toast.error(result.error || "Failed to approve question")
      }
    } catch (error) {
      setOptimisticApproved(false)
      toast.error("An error occurred while approving the question")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      const result = await rejectQuestion(verificationId)
      if (result.success) {
        toast.success("Question rejected successfully!")
        setTimeout(() => {
          refetch()
          onNext()
        }, 1000)
      } else {
        toast.error(result.error || "Failed to reject question")
      }
    } catch (error) {
      toast.error("An error occurred while rejecting the question")
    } finally {
      setLoading(false)
    }
  }

  const handleNeedImage = async () => {
    setLoading(true)
    try {
      const result = await needImageQuestion(verificationId)
      if (result.success) {
        toast.success("Question marked as needs image!")
        setTimeout(() => {
          refetch()
          onNext()
        }, 1000)
      } else {
        toast.error(result.error || "Failed to mark question as needs image")
      }
    } catch (error) {
      toast.error("An error occurred while marking the question")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "status-approved"
      case "rejected":
        return "status-rejected"
      case "needImage":
        return "status-needImage"
      case "pending":
        return "status-pending"
      default:
        return ""
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: "1.5rem", maxWidth: "none" }}>
        {/* Header skeleton */}
        <div className="flex justify-between items-center" style={{ marginBottom: "2rem" }}>
          <Button variant="outline" onClick={onBack}>
            <PiArrowLeft style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
            Back to List
          </Button>
          <Skeleton style={{ height: "2rem", width: "6rem" }} />
        </div>

        {/* Content skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <div>
            <Skeleton style={{ height: "1.5rem", width: "12rem", marginBottom: "1rem" }} />
            <Skeleton style={{ height: "20rem", width: "100%" }} />
          </div>
          <div>
            <Skeleton style={{ height: "1.5rem", width: "12rem", marginBottom: "1rem" }} />
            <Skeleton style={{ height: "20rem", width: "100%" }} />
          </div>
        </div>
      </div>
    )
  }

  if (!verification) {
    return (
      <div style={{ padding: "1.5rem", textAlign: "center" }}>
        <p>Verification not found</p>
        <Button onClick={onBack} style={{ marginTop: "1rem" }}>
          Back to List
        </Button>
      </div>
    )
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "none" }}>
      {/* Header */}
      <div className="flex justify-between items-center" style={{ marginBottom: "2rem" }}>
        <Button variant="outline" onClick={onBack}>
          <PiArrowLeft style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
          Back to List
        </Button>
        <div className="flex gap-2 items-center">
          <Badge className={getStatusColor(verification.status)} variant="secondary">
            {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
          </Badge>
          {verification.referenceSource && (
            <Badge variant="outline">Source: {verification.referenceSource}</Badge>
          )}
          {verification.metadata?.challengeQuestion === true && (
            <Badge style={{ backgroundColor: "#f0abfc", color: "#a21caf" }} variant="secondary">
              Challenge Question
            </Badge>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1.5rem",
            fontSize: "0.875rem",
          }}
        >
          <div>
            <p style={{ fontWeight: "500", color: "#6b7280" }}>Subject</p>
            <p style={{ fontSize: "1rem" }}>{verification.subjectTitle || "Not specified"}</p>
          </div>
          <div>
            <p style={{ fontWeight: "500", color: "#6b7280" }}>Difficulty</p>
            <p style={{ fontSize: "1rem" }}>
              {verification.questionDifficulty
                ? `${verification.questionDifficulty}/10`
                : "Not specified"}
            </p>
          </div>
          <div>
            <p style={{ fontWeight: "500", color: "#6b7280" }}>Type</p>
            <p style={{ fontSize: "1rem" }}>{verification.questionType || "Not specified"}</p>
          </div>
          <div>
            <p style={{ fontWeight: "500", color: "#6b7280" }}>Created</p>
            <p style={{ fontSize: "1rem" }}>
              {new Date(verification.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          marginBottom: "2rem",
        }}
      >
        <QuestionDisplay
          question={newQuestion}
          title="New Question (To Verify)"
          isReference={false}
        />
        <QuestionDisplay
          question={referenceQuestion}
          title="Reference Question"
          isReference={true}
        />
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-4" style={{ marginBottom: "2rem" }}>
        <Button
          onClick={handleApprove}
          disabled={loading || verification.status === "approved" || optimisticApproved}
          style={{
            backgroundColor: optimisticApproved ? "#16a34a" : "#22c55e",
            color: "white",
            flex: "1",
            maxWidth: "12rem",
            padding: "0.75rem 1rem",
          }}
        >
          <PiCheck style={{ width: "1.25rem", height: "1.25rem", marginRight: "0.5rem" }} />
          {optimisticApproved ? "✓ Approved!" : loading ? "Approving..." : "Approve"}
        </Button>

        <Button
          onClick={handleReject}
          disabled={loading || verification.status === "rejected"}
          style={{
            backgroundColor: "#ef4444",
            color: "white",
            flex: "1",
            maxWidth: "12rem",
            padding: "0.75rem 1rem",
          }}
        >
          <PiX style={{ width: "1.25rem", height: "1.25rem", marginRight: "0.5rem" }} />
          {loading ? "Rejecting..." : "Reject"}
        </Button>

        <Button
          onClick={handleNeedImage}
          disabled={loading || verification.status === "needImage"}
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            flex: "1",
            maxWidth: "12rem",
            padding: "0.75rem 1rem",
          }}
        >
          <PiImage style={{ width: "1.25rem", height: "1.25rem", marginRight: "0.5rem" }} />
          {loading ? "Sending..." : "Needs Image"}
        </Button>

        <Button
          onClick={onNext}
          variant="outline"
          style={{
            flex: "1",
            maxWidth: "12rem",
            padding: "0.75rem 1rem",
          }}
        >
          <PiArrowRight style={{ width: "1.25rem", height: "1.25rem", marginRight: "0.5rem" }} />
          Next Question
        </Button>
      </div>

      {/* Additional info */}
      <div
        style={{
          backgroundColor: "#f8fafc",
          padding: "1.5rem",
          borderRadius: "12px",
          fontSize: "0.875rem",
          color: "#6b7280",
        }}
      >
        <p style={{ marginBottom: "0.5rem" }}>
          <strong>Question ID:</strong> {verification.questionId}
        </p>
        {verification.referenceQuestionId && (
          <p style={{ marginBottom: "0.5rem" }}>
            <strong>Reference ID:</strong> {verification.referenceQuestionId}
          </p>
        )}
        <p>
          <strong>Verification ID:</strong> {verification.id}
        </p>
      </div>
    </div>
  )
}
