import { neon } from "@neondatabase/serverless"

// Use the admin Neon URL for this internal admin tool (like the main app does for admin operations)
const DATABASE_URL = import.meta.env.VITE_NEON_ADMIN_URL || import.meta.env.NEON_ADMIN_URL_STAGING

if (!DATABASE_URL) {
  throw new Error("VITE_NEON_ADMIN_URL is not set")
}

const sql = neon(DATABASE_URL)

interface VerificationFilters {
  status?: string
  difficulty?: string
  referenceSource?: string
  challengeQuestion?: string
  topicIds?: number[]
  limit?: number
  cursor?: string
}

export async function getQuestionsForVerification(filters: VerificationFilters = {}) {
  try {
    console.log("Fetching verifications with filters:", filters)
    console.log("Using DATABASE_URL:", DATABASE_URL)

    // Debug: Check if we can access the database at all
    const connectionTest = await sql`SELECT 1 as test`
    console.log("Connection test:", connectionTest)

    // Debug: Check what tables exist in the current schema
    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    console.log("Available tables:", tablesResult)

    // Debug: Try to check the question_verification table structure
    const tableStructure = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'question_verification'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    console.log("question_verification table structure:", tableStructure)

    // Simple approach - get all verifications first to see what's available
    const limit = filters.limit || 20

    // Let's first check if there are any verifications at all with a simpler query
    const allCountResult = await sql`
      SELECT COUNT(*) as count
      FROM question_verification
    `
    console.log("Total verifications in database (simple query):", allCountResult[0]?.count)

    // Try a direct select to see if we can access any rows
    const directSelectResult = await sql`
      SELECT id, status, created_at
      FROM question_verification
      LIMIT 5
    `
    console.log("Direct select result:", directSelectResult)

    // Check current user and privileges
    const currentUser = await sql`SELECT current_user, session_user`
    console.log("Current database user:", currentUser)

    // Let's also try the original query but with simpler joins
    const allCountResultWithJoin = await sql`
      SELECT COUNT(*) as count
      FROM question_verification qv
      LEFT JOIN question q ON q.id = qv.question_id
      LEFT JOIN subject s ON s.id = q.subject_id
    `
    console.log("Total verifications in database (with joins):", allCountResultWithJoin[0]?.count)

    // Build WHERE conditions based on filters
    const whereConditions: string[] = []
    const queryParams: any[] = []
    let paramIndex = 1

    // Status filter
    if (filters.status && filters.status !== "all") {
      whereConditions.push(`qv.status = $${paramIndex}`)
      queryParams.push(filters.status)
      paramIndex++
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty !== "all") {
      whereConditions.push(`q.difficulty = $${paramIndex}`)
      queryParams.push(Number(filters.difficulty))
      paramIndex++
    }

    // Reference source filter
    if (filters.referenceSource) {
      whereConditions.push(`qv.reference_source ILIKE $${paramIndex}`)
      queryParams.push(`%${filters.referenceSource}%`)
      paramIndex++
    }

    // Note: Subject and Question Type filters can be added here when needed
    // if (filters.subjectId) {
    //   whereConditions.push(`q.subject_id = $${paramIndex}`)
    //   queryParams.push(filters.subjectId)
    //   paramIndex++
    // }

    // Challenge question filter
    if (filters.challengeQuestion && filters.challengeQuestion !== "all") {
      if (filters.challengeQuestion === "challenge") {
        whereConditions.push(`qv.metadata->>'challengeQuestion' = 'true'`)
      } else if (filters.challengeQuestion === "regular") {
        whereConditions.push(
          `(qv.metadata->>'challengeQuestion' IS NULL OR qv.metadata->>'challengeQuestion' != 'true')`
        )
      }
    }

    // Build the WHERE clause
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    console.log("Applied filters:", filters)
    console.log("WHERE clause:", whereClause)
    console.log("Query params:", queryParams)

    // Get count based on filters
    let countResult: any[]
    if (whereConditions.length === 0) {
      // No filters - get all
      countResult = await sql`
        SELECT COUNT(*) as count
        FROM question_verification qv
        LEFT JOIN question q ON q.id = qv.question_id
        LEFT JOIN subject s ON s.id = q.subject_id
      `
    } else if (whereConditions.length === 1 && filters.status && filters.status !== "all") {
      // Status filter only
      countResult = await sql`
        SELECT COUNT(*) as count
        FROM question_verification qv
        LEFT JOIN question q ON q.id = qv.question_id
        LEFT JOIN subject s ON s.id = q.subject_id
        WHERE qv.status = ${filters.status}
      `
    } else if (whereConditions.length === 1 && filters.difficulty && filters.difficulty !== "all") {
      // Difficulty filter only
      countResult = await sql`
        SELECT COUNT(*) as count
        FROM question_verification qv
        LEFT JOIN question q ON q.id = qv.question_id
        LEFT JOIN subject s ON s.id = q.subject_id
        WHERE q.difficulty = ${Number(filters.difficulty)}
      `
    } else {
      // Multiple filters - construct query for most common combinations
      if (
        filters.status &&
        filters.status !== "all" &&
        filters.difficulty &&
        filters.difficulty !== "all"
      ) {
        countResult = await sql`
          SELECT COUNT(*) as count
          FROM question_verification qv
          LEFT JOIN question q ON q.id = qv.question_id
          LEFT JOIN subject s ON s.id = q.subject_id
          WHERE qv.status = ${filters.status} AND q.difficulty = ${Number(filters.difficulty)}
        `
      } else {
        // Fallback to no filter for complex cases
        countResult = await sql`
          SELECT COUNT(*) as count
          FROM question_verification qv
          LEFT JOIN question q ON q.id = qv.question_id
          LEFT JOIN subject s ON s.id = q.subject_id
        `
      }
    }

    const total = countResult[0]?.count || 0
    console.log("Total matching verifications:", total)

    // Get verifications based on filters
    let verifications: any[]
    if (whereConditions.length === 0) {
      // No filters - get all
      verifications = await sql`
        SELECT
          qv.id,
          qv.question_id,
          qv.reference_question_id,
          qv.approver_user_ids,
          qv.rejected_user_ids,
          qv.reference_source,
          qv.status,
          qv.metadata,
          qv.created_at,
          qv.updated_at,
          q.specification as question_specification,
          q.difficulty as question_difficulty,
          q.question_type,
          q.level as question_level,
          q.paper as question_paper,
          q.subject_id as question_subject_id,
          s.title as subject_title,
          s.slug as subject_slug
        FROM question_verification qv
        LEFT JOIN question q ON q.id = qv.question_id
        LEFT JOIN subject s ON s.id = q.subject_id
        ORDER BY qv.created_at DESC
        LIMIT ${limit + 1}
      `
    } else if (whereConditions.length === 1 && filters.status && filters.status !== "all") {
      // Status filter only
      verifications = await sql`
        SELECT
          qv.id,
          qv.question_id,
          qv.reference_question_id,
          qv.approver_user_ids,
          qv.rejected_user_ids,
          qv.reference_source,
          qv.status,
          qv.metadata,
          qv.created_at,
          qv.updated_at,
          q.specification as question_specification,
          q.difficulty as question_difficulty,
          q.question_type,
          q.level as question_level,
          q.paper as question_paper,
          q.subject_id as question_subject_id,
          s.title as subject_title,
          s.slug as subject_slug
        FROM question_verification qv
        LEFT JOIN question q ON q.id = qv.question_id
        LEFT JOIN subject s ON s.id = q.subject_id
        WHERE qv.status = ${filters.status}
        ORDER BY qv.created_at DESC
        LIMIT ${limit + 1}
      `
    } else if (whereConditions.length === 1 && filters.difficulty && filters.difficulty !== "all") {
      // Difficulty filter only
      verifications = await sql`
        SELECT
          qv.id,
          qv.question_id,
          qv.reference_question_id,
          qv.approver_user_ids,
          qv.rejected_user_ids,
          qv.reference_source,
          qv.status,
          qv.metadata,
          qv.created_at,
          qv.updated_at,
          q.specification as question_specification,
          q.difficulty as question_difficulty,
          q.question_type,
          q.level as question_level,
          q.paper as question_paper,
          q.subject_id as question_subject_id,
          s.title as subject_title,
          s.slug as subject_slug
        FROM question_verification qv
        LEFT JOIN question q ON q.id = qv.question_id
        LEFT JOIN subject s ON s.id = q.subject_id
        WHERE q.difficulty = ${Number(filters.difficulty)}
        ORDER BY qv.created_at DESC
        LIMIT ${limit + 1}
      `
    } else {
      // Multiple filters - construct query for most common combinations
      if (
        filters.status &&
        filters.status !== "all" &&
        filters.difficulty &&
        filters.difficulty !== "all"
      ) {
        verifications = await sql`
          SELECT
            qv.id,
            qv.question_id,
            qv.reference_question_id,
            qv.approver_user_ids,
            qv.rejected_user_ids,
            qv.reference_source,
            qv.status,
            qv.metadata,
            qv.created_at,
            qv.updated_at,
            q.specification as question_specification,
            q.difficulty as question_difficulty,
            q.question_type,
            q.level as question_level,
            q.paper as question_paper,
            q.subject_id as question_subject_id,
            s.title as subject_title,
            s.slug as subject_slug
          FROM question_verification qv
          LEFT JOIN question q ON q.id = qv.question_id
          LEFT JOIN subject s ON s.id = q.subject_id
          WHERE qv.status = ${filters.status} AND q.difficulty = ${Number(filters.difficulty)}
          ORDER BY qv.created_at DESC
          LIMIT ${limit + 1}
        `
      } else {
        // Fallback to no filter for complex cases
        verifications = await sql`
          SELECT
            qv.id,
            qv.question_id,
            qv.reference_question_id,
            qv.approver_user_ids,
            qv.rejected_user_ids,
            qv.reference_source,
            qv.status,
            qv.metadata,
            qv.created_at,
            qv.updated_at,
            q.specification as question_specification,
            q.difficulty as question_difficulty,
            q.question_type,
            q.level as question_level,
            q.paper as question_paper,
            q.subject_id as question_subject_id,
            s.title as subject_title,
            s.slug as subject_slug
          FROM question_verification qv
          LEFT JOIN question q ON q.id = qv.question_id
          LEFT JOIN subject s ON s.id = q.subject_id
          ORDER BY qv.created_at DESC
          LIMIT ${limit + 1}
        `
      }
    }

    console.log("Raw verifications result:", verifications)

    // Check if there are more verifications
    const hasMore = verifications.length > limit
    const finalVerifications = hasMore ? verifications.slice(0, limit) : verifications

    // Set cursor for next batch (last item's ID)
    const newCursor =
      finalVerifications.length > 0 ? finalVerifications[finalVerifications.length - 1].id : null

    // Process the results
    const processedVerifications = finalVerifications.map((v: any) => ({
      id: v.id,
      questionId: v.question_id,
      referenceQuestionId: v.reference_question_id,
      approverUserIds: v.approver_user_ids || [],
      rejectedUserIds: v.rejected_user_ids || [],
      referenceSource: v.reference_source,
      status: v.status,
      metadata: v.metadata,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
      questionSpecification: v.question_specification,
      questionDifficulty: v.question_difficulty,
      questionType: v.question_type,
      questionLevel: v.question_level,
      questionPaper: v.question_paper,
      questionSubjectId: v.question_subject_id,
      subjectTitle: v.subject_title,
      subjectSlug: v.subject_slug,
    }))

    console.log("Loaded verifications:", processedVerifications.length)
    console.log("Processed verifications:", processedVerifications)

    return {
      verifications: processedVerifications,
      total: Number(total),
      hasMore,
      cursor: newCursor,
    }
  } catch (error) {
    console.error("Error fetching questions for verification:", error)
    throw error
  }
}

export async function approveQuestion(
  verificationId: string,
  userId = "fe9ffb80-877b-4671-9c35-235a6f220828"
) {
  try {
    console.log("Approving question:", verificationId, "by user:", userId)

    // Get current verification to check existing approver_user_ids
    const verification = await sql`
      SELECT approver_user_ids, question_id
      FROM question_verification
      WHERE id = ${verificationId}
    `

    if (verification.length === 0) {
      throw new Error("Verification not found")
    }

    const currentApprovers = verification[0].approver_user_ids || []
    const questionId = verification[0].question_id

    // Add user to approver list if not already there
    const updatedApprovers = currentApprovers.includes(userId)
      ? currentApprovers
      : [...currentApprovers, userId]

    // Update verification status and approver list
    await sql`
      UPDATE question_verification
      SET
        status = 'approved',
        approver_user_ids = ${updatedApprovers},
        updated_at = NOW()
      WHERE id = ${verificationId}
    `

    // Update the question to set is_staging to false (make it live)
    await sql`
      UPDATE question
      SET is_staging = false
      WHERE id = ${questionId}
    `

    console.log("Successfully approved question:", verificationId)
    return { success: true }
  } catch (error) {
    console.error("Error approving question:", error)
    return { success: false, error: "Failed to approve question" }
  }
}

export async function rejectQuestion(
  verificationId: string,
  userId = "fe9ffb80-877b-4671-9c35-235a6f220828"
) {
  try {
    console.log("Rejecting question:", verificationId, "by user:", userId)

    // Get current verification to check existing rejected_user_ids
    const verification = await sql`
      SELECT rejected_user_ids
      FROM question_verification
      WHERE id = ${verificationId}
    `

    if (verification.length === 0) {
      throw new Error("Verification not found")
    }

    const currentRejected = verification[0].rejected_user_ids || []

    // Add user to rejected list if not already there
    const updatedRejected = currentRejected.includes(userId)
      ? currentRejected
      : [...currentRejected, userId]

    // Update verification status and rejected list
    await sql`
      UPDATE question_verification
      SET
        status = 'rejected',
        rejected_user_ids = ${updatedRejected},
        updated_at = NOW()
      WHERE id = ${verificationId}
    `

    console.log("Successfully rejected question:", verificationId)
    return { success: true }
  } catch (error) {
    console.error("Error rejecting question:", error)
    return { success: false, error: "Failed to reject question" }
  }
}

export async function needImageQuestion(
  verificationId: string,
  userId = "fe9ffb80-877b-4671-9c35-235a6f220828"
) {
  try {
    console.log("Marking question as needs image:", verificationId, "by user:", userId)

    // Update verification status to needImage
    await sql`
      UPDATE question_verification
      SET
        status = 'needImage',
        updated_at = NOW()
      WHERE id = ${verificationId}
    `

    console.log("Successfully marked question as needs image:", verificationId)
    return { success: true }
  } catch (error) {
    console.error("Error marking question as needs image:", error)
    return { success: false, error: "Failed to mark question as needs image" }
  }
}

export async function loadQuestionDetails(verificationId: string) {
  try {
    console.log("Loading question details for verification:", verificationId)

    // Get verification with full question data
    const verification = await sql`
      SELECT
        qv.id,
        qv.question_id,
        qv.reference_question_id,
        qv.approver_user_ids,
        qv.rejected_user_ids,
        qv.reference_source,
        qv.status,
        qv.metadata,
        qv.created_at,
        qv.updated_at,
        q.specification as question_specification,
        q.difficulty as question_difficulty,
        q.question_type,
        q.level as question_level,
        q.paper as question_paper,
        q.subject_id as question_subject_id,
        q.current_revision_id,
        s.title as subject_title,
        s.slug as subject_slug
      FROM question_verification qv
      LEFT JOIN question q ON q.id = qv.question_id
      LEFT JOIN subject s ON s.id = q.subject_id
      WHERE qv.id = ${verificationId}
    `

    if (verification.length === 0) {
      throw new Error("Verification not found")
    }

    const v = verification[0]

    // Get question parts for the current revision
    const parts = await sql`
      SELECT id, content, markscheme, marks, "order"
      FROM question_part
      WHERE revision_id = ${v.current_revision_id}
      ORDER BY "order"
    `

    // Get question options for the current revision
    const options = await sql`
      SELECT id, content, correct, "order", markscheme
      FROM question_option
      WHERE revision_id = ${v.current_revision_id}
      ORDER BY "order"
    `

    // Build the new question object
    const newQuestion = {
      id: v.question_id,
      specification: v.question_specification,
      questionType: v.question_type,
      parts: parts.map((part: any) => ({
        id: part.id,
        content: part.content,
        markscheme: part.markscheme || "",
        marks: part.marks || 0,
        order: part.order,
      })),
      options: options.map((option: any) => ({
        id: option.id,
        content: option.content,
        correct: option.correct,
        order: option.order,
        markscheme: option.markscheme || "",
      })),
      level: v.question_level,
      paper: v.question_paper,
      subjectId: v.question_subject_id,
      difficulty: v.question_difficulty,
      currentRevisionId: v.current_revision_id,
    }

    // Load reference question if available
    let referenceQuestion = null
    if (v.reference_question_id) {
      const refData = await sql`
        SELECT
          q.id,
          q.specification,
          q.question_type,
          q.level,
          q.paper,
          q.subject_id,
          q.difficulty,
          q.current_revision_id
        FROM question q
        WHERE q.id = ${v.reference_question_id}
      `

      if (refData.length > 0) {
        const ref = refData[0]

        // Get reference question parts
        const refParts = await sql`
          SELECT id, content, markscheme, marks, "order"
          FROM question_part
          WHERE revision_id = ${ref.current_revision_id}
          ORDER BY "order"
        `

        // Get reference question options
        const refOptions = await sql`
          SELECT id, content, correct, "order", markscheme
          FROM question_option
          WHERE revision_id = ${ref.current_revision_id}
          ORDER BY "order"
        `

        referenceQuestion = {
          id: ref.id,
          specification: ref.specification,
          questionType: ref.question_type,
          parts: refParts.map((part: any) => ({
            id: part.id,
            content: part.content,
            markscheme: part.markscheme || "",
            marks: part.marks || 0,
            order: part.order,
          })),
          options: refOptions.map((option: any) => ({
            id: option.id,
            content: option.content,
            correct: option.correct,
            order: option.order,
            markscheme: option.markscheme || "",
          })),
          level: ref.level,
          paper: ref.paper,
          subjectId: ref.subject_id,
          difficulty: ref.difficulty,
          currentRevisionId: ref.current_revision_id,
        }
      }
    }

    const processedVerification = {
      id: v.id,
      questionId: v.question_id,
      referenceQuestionId: v.reference_question_id,
      approverUserIds: v.approver_user_ids || [],
      rejectedUserIds: v.rejected_user_ids || [],
      referenceSource: v.reference_source,
      status: v.status,
      metadata: v.metadata,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
      questionSpecification: v.question_specification,
      questionDifficulty: v.question_difficulty,
      questionType: v.question_type,
      questionLevel: v.question_level,
      questionPaper: v.question_paper,
      questionSubjectId: v.question_subject_id,
      subjectTitle: v.subject_title,
      subjectSlug: v.subject_slug,
    }

    return {
      verification: processedVerification,
      newQuestion,
      referenceQuestion,
    }
  } catch (error) {
    console.error("Error loading question details:", error)
    throw error
  }
}
