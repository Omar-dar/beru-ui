import React, { useRef, useState, useCallback } from 'react'
import { dataTransferHasFiles, getPdfFromDataTransfer } from '../utils/pdfFile'

interface Props {
  children: React.ReactNode
  onUpload: (file: File) => void
  onInvalidFile?: () => void
  disabled?: boolean
}

const PdfDropZone: React.FC<Props> = ({
  children,
  onUpload,
  onInvalidFile,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const resetDrag = useCallback(() => {
    dragCounter.current = 0
    setIsDragging(false)
  }, [])

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled || !dataTransferHasFiles(e.dataTransfer)) return
      dragCounter.current += 1
      setIsDragging(true)
    },
    [disabled]
  )

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled) return
      dragCounter.current -= 1
      if (dragCounter.current <= 0) {
        resetDrag()
      }
    },
    [disabled, resetDrag]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled || !dataTransferHasFiles(e.dataTransfer)) return
      e.dataTransfer.dropEffect = 'copy'
    },
    [disabled]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      resetDrag()
      if (disabled) return

      const pdf = getPdfFromDataTransfer(e.dataTransfer)
      if (pdf) {
        onUpload(pdf)
        return
      }

      if (e.dataTransfer.files.length > 0) {
        onInvalidFile?.()
      }
    },
    [disabled, onUpload, onInvalidFile, resetDrag]
  )

  return (
    <div
      className={`pdf-drop-zone${isDragging ? ' pdf-drop-zone--active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      {isDragging && (
        <div className="pdf-drop-overlay" aria-hidden>
          <div className="pdf-drop-overlay-content">
            <span className="pdf-drop-overlay-icon">📄</span>
            <p className="pdf-drop-overlay-title">Drop PDF to upload</p>
            <p className="pdf-drop-overlay-sub">Text-based PDFs up to 20 MB</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PdfDropZone
