import type React from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import remarkMath from "remark-math"
// katex styles
import "katex/dist/katex.min.css"
import { cn } from "../lib/utils"
import { memo } from "react"

type RenderMarkdownProps = {
  children?: string
  className?: string
  components?: Components
}

function RenderMarkdown({ children, className, components }: RenderMarkdownProps) {
  const processedContent =
    typeof children === "string"
      ? children
          // Convert LaTeX delimiters to KaTeX format
          ?.replaceAll("\\(", "$$")
          ?.replaceAll("\\)", "$$")
          ?.replaceAll("\\( ", "$$")
          ?.replaceAll(" \\)", "$$")
          ?.replaceAll("\\[", "$$")
          ?.replaceAll("\\]", "$$")
          // Remove quotes from image URLs in markdown
          ?.replace(/!\[([^\]]*)\]\("([^"]+)"\)/g, "![$1]($2)")
          ?.replace(/!\[([^\]]*)\]\('([^']+)'\)/g, "![$1]($2)")
      : children

  return (
    <div
      className={cn(
        "prose space-y-3 text-black/75 prose-neutral marker:text-inherit print:overflow-hidden print:text-black",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          ...(components || {}),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

const Markdown = memo(
  RenderMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
)

export { RenderMarkdown, Markdown }
