import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'

interface Props {
  content: string
}

const MarkdownContent: React.FC<Props> = ({ content }) => {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const isBlock = /language-(\w+)/.test(className || '')
            if (isBlock) {
              return <CodeBlock className={className}>{children}</CodeBlock>
            }
            return (
              <code className="inline-code" {...props}>
                {children}
              </code>
            )
          },
          pre({ children }) {
            return <>{children}</>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownContent
