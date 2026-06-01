import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'
import { getMessageDirection, getMessageLang } from '../utils/textDirection'

interface Props {
  content: string
  language?: string | null
  textDirection?: 'ltr' | 'rtl' | null
}

const MarkdownContent: React.FC<Props> = ({ content, language, textDirection }) => {
  const dir = getMessageDirection(content, language, textDirection)
  const lang = getMessageLang(content, language)

  return (
    <div
      className={`markdown-body${dir === 'rtl' ? ' markdown-body--rtl' : ''}`}
      dir={dir}
      lang={lang}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const isBlock = /language-(\w+)/.test(className || '')
            if (isBlock) {
              return <CodeBlock className={className}>{children}</CodeBlock>
            }
            return (
              <code className="inline-code" dir="ltr" {...props}>
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
