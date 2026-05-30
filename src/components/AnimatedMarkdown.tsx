import React from 'react'
import MarkdownContent from './MarkdownContent'
import { useTypewriter } from '../hooks/useTypewriter'

interface Props {
  content: string
  onReveal?: () => void
}

const AnimatedMarkdown: React.FC<Props> = ({ content, onReveal }) => {
  const { visibleText, isComplete } = useTypewriter(content, true, onReveal)

  return (
    <div className={`animated-markdown${isComplete ? ' animated-markdown--done' : ''}`}>
      <MarkdownContent content={visibleText} />
      {!isComplete && <span className="stream-cursor" aria-hidden />}
    </div>
  )
}

export default AnimatedMarkdown
