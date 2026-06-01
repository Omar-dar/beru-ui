import React from 'react'
import MarkdownContent from './MarkdownContent'
import { useTypewriter } from '../hooks/useTypewriter'
import { getMessageDirection } from '../utils/textDirection'

interface Props {
  content: string
  language?: string | null
  textDirection?: 'ltr' | 'rtl' | null
  onReveal?: () => void
}

const AnimatedMarkdown: React.FC<Props> = ({
  content,
  language,
  textDirection,
  onReveal,
}) => {
  const dir = getMessageDirection(content, language, textDirection)
  const rtl = dir === 'rtl'
  const { visibleText, isComplete } = useTypewriter(content, !rtl, onReveal)

  return (
    <div
      className={`animated-markdown${isComplete ? ' animated-markdown--done' : ''}${
        dir === 'rtl' ? ' animated-markdown--rtl' : ''
      }`}
      dir={dir}
    >
      <MarkdownContent
        content={visibleText}
        language={language}
        textDirection={textDirection}
      />
      {!isComplete && <span className="stream-cursor" aria-hidden />}
    </div>
  )
}

export default AnimatedMarkdown
