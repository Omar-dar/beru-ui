export const isPdfFile = (file: File): boolean =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

export const getPdfFromDataTransfer = (dataTransfer: DataTransfer): File | null => {
  const files = Array.from(dataTransfer.files)
  return files.find(isPdfFile) ?? null
}

export const dataTransferHasFiles = (dataTransfer: DataTransfer): boolean =>
  Array.from(dataTransfer.types).includes('Files')
