import React, { useState, useCallback } from 'react'

interface Props {
  className?: string
  children: React.ReactNode
}

const CodeBlock: React.FC<Props> = ({ className, children }) => {
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''
  const code = String(children).replace(/\n$/, '')
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }, [code])

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span>{language || 'code'}</span>
        <button type="button" className="code-block-copy" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <pre className="code-block-pre">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default CodeBlock
