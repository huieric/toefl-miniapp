const cleanParagraph = (value) => String(value || '').replace(/\s+/g, ' ').trim()

const paragraphSignalPattern = /^(However|Furthermore|Moreover|Nevertheless|Despite|In contrast|By contrast|As a result|Consequently|For example|For instance|Another|Different|The largest|The unique|The sheer|The uppermost|Underneath|A little deeper|Passed|Because|Although|While|Therefore|Thus|Similarly|On the other hand|In addition|First|Second|Finally)\b/

const wordCount = (text) => cleanParagraph(text).split(/\s+/).filter(Boolean).length

const splitBySentences = (text) => cleanParagraph(text)
  .split(/(?<=[.!?;:]["')\]]?\s+)/)
  .map(cleanParagraph)
  .filter(sentence => sentence.length > 10)

const splitByWords = (text) => {
  const fullText = cleanParagraph(text)
  if (!fullText) return []

  const words = fullText.split(/\s+/).filter(Boolean)
  if (words.length <= 80 && fullText.length <= 560) return [fullText]

  const targetParagraphCount = Math.min(8, Math.max(3, Math.round(words.length / 85) || Math.ceil(fullText.length / 520)))
  const targetWords = Math.max(50, Math.ceil(words.length / targetParagraphCount))
  const paragraphs = []

  for (let start = 0; start < words.length; start += targetWords) {
    paragraphs.push(words.slice(start, start + targetWords).join(' '))
  }

  return paragraphs.filter(Boolean)
}

const mergeReadableParagraphs = (paragraphs) => {
  const merged = []

  for (const paragraph of paragraphs.filter(Boolean)) {
    const startsLowercase = /^[a-z]/.test(paragraph)
    const tooShort = wordCount(paragraph) < 28

    if (merged.length > 0 && (startsLowercase || tooShort)) {
      merged[merged.length - 1] += ' ' + paragraph
    } else {
      merged.push(paragraph)
    }
  }

  return merged
}

const groupSentencesIntoParagraphs = (sentences, fullText) => {
  const totalWords = Math.max(1, wordCount(fullText))
  const targetParagraphCount = Math.min(8, Math.max(3, Math.round(totalWords / 95)))
  const targetWordsPerParagraph = Math.max(60, Math.ceil(totalWords / targetParagraphCount))

  const paragraphs = []
  let current = []

  for (const sentence of sentences) {
    const currentText = current.join(' ')
    const currentWords = wordCount(currentText)
    const isSignalStart = paragraphSignalPattern.test(sentence)

    if (current.length > 0 && (currentWords >= targetWordsPerParagraph || (currentWords >= 45 && isSignalStart))) {
      paragraphs.push(currentText)
      current = []
    }

    current.push(sentence)
  }

  if (current.length > 0) paragraphs.push(current.join(' '))

  return mergeReadableParagraphs(paragraphs)
}

const rebuildParagraphsFromSentences = (raw) => {
  const fullText = cleanParagraph(raw)
  if (!fullText) return []

  const sentences = splitBySentences(fullText)
  if (sentences.length > 1) {
    const paragraphs = groupSentencesIntoParagraphs(sentences, fullText)
    if (paragraphs.length > 1) return paragraphs
  }

  return splitByWords(fullText)
}

export const splitPassageParagraphs = (rawValue) => {
  const raw = String(rawValue || '')
  if (!raw.trim()) return []

  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  if (/\n\s*\n/.test(text)) {
    const paragraphs = text
      .split(/\n\s*\n+/)
      .map(block => cleanParagraph(block.replace(/\n+/g, ' ')))
      .filter(Boolean)

    if (paragraphs.length > 1) return paragraphs
  }

  const originalLines = text.split('\n')
  const nonEmptyLines = originalLines.map(line => line.trim()).filter(Boolean)

  const indentedParagraphs = []
  let current = []
  for (const line of originalLines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (/^\s{2,}\S/.test(line) && current.length > 0) {
      indentedParagraphs.push(cleanParagraph(current.join(' ')))
      current = []
    }
    current.push(trimmed)
  }
  if (current.length > 0) indentedParagraphs.push(cleanParagraph(current.join(' ')))

  if (indentedParagraphs.length > 1) return indentedParagraphs

  const fullText = cleanParagraph(nonEmptyLines.length ? nonEmptyLines.join(' ') : text)
  if (!fullText) return []

  if (fullText.length > 500 || wordCount(fullText) > 90) {
    return rebuildParagraphsFromSentences(fullText)
  }

  return nonEmptyLines.length > 1 ? nonEmptyLines.map(cleanParagraph) : [fullText]
}
