import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "react-hot-toast"
import QuestionVerificationList from "./components/QuestionVerificationList.tsx"
import QuestionVerificationSideBySide from "./components/QuestionVerificationSideBySide.tsx"
import "./App.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

function App() {
  const [currentView, setCurrentView] = useState<"list" | "detail">("list")
  const [selectedVerificationId, setSelectedVerificationId] = useState<string | null>(null)
  const [verificationsList, setVerificationsList] = useState<any[]>([])
  const [showBatchEndMessage, setShowBatchEndMessage] = useState(false)

  const handleSelectVerification = (verificationId: string, verificationsList: any[]) => {
    setSelectedVerificationId(verificationId)
    setVerificationsList(verificationsList)
    setShowBatchEndMessage(false)
    setCurrentView("detail")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedVerificationId(null)
    setShowBatchEndMessage(false)
  }

  const handleNextQuestion = () => {
    if (!selectedVerificationId || verificationsList.length === 0) return

    const currentIndex = verificationsList.findIndex((v) => v.id === selectedVerificationId)
    const nextIndex = currentIndex + 1

    // Check if we've reached the end of the batch
    if (nextIndex >= verificationsList.length) {
      setShowBatchEndMessage(true)
      return
    }

    const nextVerification = verificationsList[nextIndex]
    if (nextVerification) {
      setSelectedVerificationId(nextVerification.id)
      setShowBatchEndMessage(false)
    }
  }

  // Helper function to get current question position
  const getCurrentQuestionPosition = () => {
    if (!selectedVerificationId || verificationsList.length === 0) return { current: 0, total: 0 }
    const currentIndex = verificationsList.findIndex((v) => v.id === selectedVerificationId)
    return { current: currentIndex + 1, total: verificationsList.length }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ minHeight: "100vh" }}>
        {currentView === "list" ? (
          <>
            {/* Header */}
            <div
              style={{
                borderBottom: "1px solid #e2e8f0",
                padding: "1.5rem",
                backgroundColor: "white",
              }}
            >
              <div className="container">
                <h1
                  style={{
                    fontSize: "1.875rem",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  Question Verification
                </h1>
                <p style={{ color: "#6b7280" }}>Review and approve AI-generated questions</p>
              </div>
            </div>

            {/* Main Content */}
            <main style={{ padding: "0" }}>
              <QuestionVerificationList onSelectVerification={handleSelectVerification} />
            </main>
          </>
        ) : (
          selectedVerificationId && (
            <QuestionVerificationSideBySide
              verificationId={selectedVerificationId}
              onBack={handleBackToList}
              onNext={handleNextQuestion}
              questionPosition={getCurrentQuestionPosition()}
              showBatchEndMessage={showBatchEndMessage}
            />
          )
        )}
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />

      {/* React Query DevTools */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
