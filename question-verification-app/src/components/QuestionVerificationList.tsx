import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Select, SelectItem, SelectValue } from "./ui/select"
import { Skeleton } from "./ui/skeleton"
import { getQuestionsForVerification, getAllTopics, getTopicQuestionCounts } from "../lib/actions"
import type { Filters, ActiveFilters, Topic } from "../types/question"
import { PiListChecks, PiTag, PiX, PiSortAscending } from "react-icons/pi"
import { PiCaretDown } from "react-icons/pi"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from "./ui/dropdown-menu"

const BATCH_SIZE = 50

interface QuestionVerificationListProps {
  onSelectVerification: (verificationId: string, verificationsList: any[]) => void
}

export default function QuestionVerificationList({
  onSelectVerification,
}: QuestionVerificationListProps) {
  const [filters, setFilters] = useState<Filters>({
    difficulty: "all",
    referenceSource: "",
    status: "all", // Changed from "pending" to "all" to see all verifications
    sortBy: "created",
    topicIds: [],
    challengeQuestion: "all",
  })
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({})

  // Fetch topics with their subtopics
  const { data: allTopics } = useQuery({
    queryKey: ["all-topics"],
    queryFn: getAllTopics,
  })

  // Get question counts for each topic/subtopic
  const { data: topicQuestionCounts } = useQuery({
    queryKey: ["topic-question-counts"],
    queryFn: getTopicQuestionCounts,
    enabled: !!allTopics && allTopics.length > 0,
  })

  // Use real database query
  const { data: verificationsData, isLoading } = useQuery({
    queryKey: ["question-verifications", filters],
    queryFn: async () => {
      return await getQuestionsForVerification({
        status: filters.status,
        difficulty: filters.difficulty,
        referenceSource: filters.referenceSource,
        challengeQuestion: filters.challengeQuestion,
        topicIds: filters.topicIds,
        limit: BATCH_SIZE,
      })
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - longer cache for question lists
    gcTime: 20 * 60 * 1000, // 20 minutes - keep in cache when switching views
  })

  // Update active filters display
  useEffect(() => {
    const active: ActiveFilters = {}

    if (filters.difficulty !== "all") active.difficulty = `Difficulty ${filters.difficulty}`
    if (filters.status !== "all")
      active.status = filters.status.charAt(0).toUpperCase() + filters.status.slice(1)
    if (filters.referenceSource) active.referenceSource = `Source: ${filters.referenceSource}`
    if (filters.challengeQuestion !== "all") {
      active.challengeQuestion =
        filters.challengeQuestion === "challenge" ? "Challenge Questions" : "Regular Questions"
    }
    if (filters.topicIds.length > 0) {
      active.topics = `${filters.topicIds.length} topic${filters.topicIds.length === 1 ? "" : "s"} selected`
    }

    setActiveFilters(active)
  }, [filters])

  const handleFilterChange = (key: keyof Filters, value: string | number | number[] | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  // Helper functions for topic selection
  const handleTopicHeaderClick = (topic: Topic) => {
    if (!topic.childTopics || topic.childTopics.length === 0) return

    const subtopicIds = topic.childTopics.map((st) => st.id)
    const allSelected = subtopicIds.every((id) => filters.topicIds.includes(id))

    if (allSelected) {
      // Deselect all subtopics of this topic
      const newTopicIds = filters.topicIds.filter((id) => !subtopicIds.includes(id))
      handleFilterChange("topicIds", newTopicIds)
    } else {
      // Select all subtopics of this topic
      const newTopicIds = [...new Set([...filters.topicIds, ...subtopicIds])]
      handleFilterChange("topicIds", newTopicIds)
    }
  }

  const handleSubtopicToggle = (subtopicId: number) => {
    const newTopicIds = filters.topicIds.includes(subtopicId)
      ? filters.topicIds.filter((id) => id !== subtopicId)
      : [...filters.topicIds, subtopicId]
    handleFilterChange("topicIds", newTopicIds)
  }

  const areAllSubtopicsSelected = (topic: Topic) => {
    if (!topic.childTopics || topic.childTopics.length === 0) return false
    const subtopicIds = topic.childTopics.map((st) => st.id)
    return subtopicIds.every((id) => filters.topicIds.includes(id))
  }

  const getSelectedSubtopicsCount = (topic: Topic) => {
    if (!topic.childTopics || topic.childTopics.length === 0) return 0
    const subtopicIds = topic.childTopics.map((st) => st.id)
    return subtopicIds.filter((id) => filters.topicIds.includes(id)).length
  }

  const getQuestionCount = (topicId: number) => topicQuestionCounts?.[topicId] || 0

  const getTopicTotalQuestionCount = (topic: Topic) => {
    return topic.childTopics
      ? topic.childTopics.reduce((sum, st) => sum + getQuestionCount(st.id), 0)
      : getQuestionCount(topic.id)
  }

  const removeFilter = (filterKey: string) => {
    const newFilters = { ...filters }

    switch (filterKey) {
      case "difficulty":
        newFilters.difficulty = "all"
        break
      case "status":
        newFilters.status = "all"
        break
      case "referenceSource":
        newFilters.referenceSource = ""
        break
      case "challengeQuestion":
        newFilters.challengeQuestion = "all"
        break
      case "topics":
        newFilters.topicIds = []
        break
    }

    setFilters(newFilters)
  }

  const clearAllFilters = () => {
    setFilters({
      difficulty: "all",
      referenceSource: "",
      status: "pending",
      sortBy: "created",
      topicIds: [],
      challengeQuestion: "all",
    })
  }

  const getDifficultyColor = (difficulty: number | null) => {
    if (!difficulty) return ""
    if (difficulty <= 3) return "difficulty-easy"
    if (difficulty <= 6) return "difficulty-medium"
    return "difficulty-hard"
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

  const verifications = verificationsData?.verifications || []

  return (
    <div style={{ padding: "1.5rem", maxWidth: "none" }}>
      {/* Enhanced Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <PiListChecks style={{ width: "1.25rem", height: "1.25rem" }} />
          <h3 className="font-semibold">Filters</h3>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <div className="grid grid-cols-4">
            {/* Status Filter */}
            <div>
              <label
                htmlFor="status-filter"
                className="text-sm font-medium mb-2"
                style={{ display: "block" }}
              >
                Status
              </label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectValue placeholder="All statuses" />
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="needImage">Needs Image</SelectItem>
              </Select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label
                htmlFor="difficulty-filter"
                className="text-sm font-medium mb-2"
                style={{ display: "block" }}
              >
                Difficulty
              </label>
              <Select
                value={filters.difficulty}
                onValueChange={(value) => handleFilterChange("difficulty", value)}
              >
                <SelectValue placeholder="All difficulties" />
                <SelectItem value="all">All difficulties</SelectItem>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? "(Easy)" : num === 10 ? "(Hard)" : ""}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Reference Source Filter */}
            <div>
              <label
                htmlFor="reference-source-filter"
                className="text-sm font-medium mb-2"
                style={{ display: "block" }}
              >
                Reference Source
              </label>
              <Input
                id="reference-source-filter"
                placeholder="Filter by source..."
                value={filters.referenceSource}
                onChange={(e) => handleFilterChange("referenceSource", e.target.value)}
              />
            </div>

            {/* Challenge Question Filter */}
            <div>
              <label
                htmlFor="challenge-question-filter"
                className="text-sm font-medium mb-2"
                style={{ display: "block" }}
              >
                Question Type
              </label>
              <Select
                value={filters.challengeQuestion}
                onValueChange={(value) => handleFilterChange("challengeQuestion", value)}
              >
                <SelectValue placeholder="All question types" />
                <SelectItem value="all">All question types</SelectItem>
                <SelectItem value="challenge">Challenge Questions</SelectItem>
                <SelectItem value="regular">Regular Questions</SelectItem>
              </Select>
            </div>
          </div>
        </div>

        {/* Topic Filter - Horizontal columns with dropdowns */}
        <div style={{ marginBottom: "1.5rem" }}>
          <span className="text-sm font-medium mb-2" style={{ display: "block" }}>
            Topics & Subtopics
          </span>
          <p className="text-xs text-muted" style={{ marginBottom: "0.5rem" }}>
            Click topic headers to select all subtopics. Only subtopics can be individually
            selected.
          </p>
          <div className="card" style={{ backgroundColor: "#f8fafc", padding: "1rem" }}>
            {allTopics && allTopics.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "1rem",
                }}
              >
                {allTopics.filter((topic) => getTopicTotalQuestionCount(topic) > 0).map((topic) => (
                  <div key={topic.id} style={{ minWidth: 0 }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          style={{
                            width: "100%",
                            justifyContent: "space-between",
                            gap: "0.5rem",
                            height: "auto",
                            padding: "0.75rem",
                          }}
                          onClick={() => handleTopicHeaderClick(topic)}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: "500",
                                fontSize: "0.875rem",
                                textAlign: "left",
                                width: "100%",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {topic.title}
                            </span>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                fontSize: "0.75rem",
                                color: "#6b7280",
                              }}
                            >
                              {topic.childTopics && topic.childTopics.length > 0 && (
                                <>
                                  <span>
                                    {getSelectedSubtopicsCount(topic)}/{topic.childTopics.length}{" "}
                                    selected
                                  </span>
                                  <span>•</span>
                                </>
                              )}
                              <span>
                                {topic.childTopics
                                  ? topic.childTopics.reduce(
                                      (sum, st) => sum + getQuestionCount(st.id),
                                      0
                                    )
                                  : 0}{" "}
                                questions
                              </span>
                            </div>
                          </div>
                          <PiCaretDown style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
                        </Button>
                      </DropdownMenuTrigger>
                      {topic.childTopics && topic.childTopics.length > 0 && (
                        <DropdownMenuContent align="start" className="w-56">
                          <DropdownMenuItem
                            className="font-medium cursor-pointer text-blue-500"
                            onClick={() => handleTopicHeaderClick(topic)}
                          >
                            {areAllSubtopicsSelected(topic) ? "Deselect All" : "Select All"}
                          </DropdownMenuItem>
                          <div
                            style={{
                              height: "1px",
                              backgroundColor: "#e2e8f0",
                              margin: "0.25rem 0",
                            }}
                          />
                          {topic.childTopics.filter((subtopic) => getQuestionCount(subtopic.id) > 0).map((subtopic) => (
                            <DropdownMenuCheckboxItem
                              key={subtopic.id}
                              checked={filters.topicIds.includes(subtopic.id)}
                              onCheckedChange={() => handleSubtopicToggle(subtopic.id)}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  width: "100%",
                                }}
                              >
                                <span>{subtopic.title}</span>
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "#6b7280",
                                    marginLeft: "0.5rem",
                                  }}
                                >
                                  ({getQuestionCount(subtopic.id)})
                                </span>
                              </div>
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      )}
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2rem",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Loading topics...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {Object.keys(activeFilters).length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <PiTag style={{ width: "1rem", height: "1rem" }} />
              <span className="text-sm font-medium">Active Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(activeFilters).map(([key, value]) => (
                <Badge
                  key={key}
                  variant="secondary"
                  style={{ cursor: "pointer" }}
                  onClick={() => removeFilter(key)}
                >
                  {value}{" "}
                  <PiX style={{ width: "0.75rem", height: "0.75rem", marginLeft: "0.25rem" }} />
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted">
            {verificationsData && (
              <>
                Showing {verifications.length} of {verificationsData.total} questions
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              disabled={Object.keys(activeFilters).length === 0}
            >
              Clear All Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card">
              <div className="flex justify-between items-start">
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <Skeleton style={{ height: "1rem", width: "75%" }} />
                  <Skeleton style={{ height: "1rem", width: "50%" }} />
                  <div className="flex gap-2">
                    <Skeleton style={{ height: "1.5rem", width: "4rem" }} />
                    <Skeleton style={{ height: "1.5rem", width: "5rem" }} />
                    <Skeleton style={{ height: "1.5rem", width: "6rem" }} />
                  </div>
                </div>
                <Skeleton style={{ height: "2.5rem", width: "6rem" }} />
              </div>
            </div>
          ))
        ) : verifications.length === 0 ? (
          <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
            <PiSortAscending
              style={{ width: "3rem", height: "3rem", margin: "0 auto 1rem", color: "#64748b" }}
            />
            <h3 className="font-semibold mb-2">No questions found</h3>
            <p className="text-muted">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <>
            {verifications.map((verification) => (
              <div
                key={verification.id}
                className="card question-card"
                onClick={() => onSelectVerification(verification.id, verifications)}
                style={{ cursor: "pointer" }}
              >
                <div className="flex justify-between items-start">
                  <div
                    style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-lg">
                          {verification.questionType || "Unknown Type"} Question
                        </h4>
                        <Badge className={getStatusColor(verification.status)} variant="secondary">
                          {verification.status.charAt(0).toUpperCase() +
                            verification.status.slice(1)}
                        </Badge>
                        {/* Challenge Question Badge */}
                        {verification.metadata?.challengeQuestion === true && (
                          <Badge
                            style={{ backgroundColor: "#f0abfc", color: "#a21caf" }}
                            variant="secondary"
                          >
                            Challenge Question
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted" style={{ lineHeight: "1.4" }}>
                        {verification.questionSpecification?.substring(0, 150)}...
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {verification.questionDifficulty && (
                        <Badge
                          className={getDifficultyColor(verification.questionDifficulty)}
                          variant="secondary"
                        >
                          Difficulty {verification.questionDifficulty}
                        </Badge>
                      )}

                      {verification.questionType && (
                        <Badge variant="outline">{verification.questionType}</Badge>
                      )}

                      {verification.subjectTitle && (
                        <Badge variant="outline">{verification.subjectTitle}</Badge>
                      )}

                      {verification.referenceSource && (
                        <Badge variant="outline">{verification.referenceSource}</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span>Created {new Date(verification.createdAt).toLocaleDateString()}</span>
                      {verification.questionLevel && (
                        <Badge variant="outline" className="text-sm">
                          Level: {verification.questionLevel}
                        </Badge>
                      )}
                      {verification.questionPaper && (
                        <Badge variant="outline" className="text-sm">
                          Paper: {verification.questionPaper}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div style={{ marginLeft: "1rem" }}>
                    <Button variant="outline" size="sm">
                      Review →
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
