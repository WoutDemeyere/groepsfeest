import type { Cue, CueTarget, ScriptLine } from '../types/app'

export const normalizeWord = (value?: string | null) => {
  if (!value) return ''
  return value
    .toString()
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, '')
    .trim()
}

export const tokenizeText = (value?: string | null) => {
  if (!value) return []
  const cleaned = value.toString().replace(/[\s\u00A0]+/g, ' ').trim()
  return cleaned ? cleaned.split(' ') : []
}

export const sortCues = (cues: Cue[], lines: ScriptLine[]) => {
  const lineIndex = new Map(lines.map((line, index) => [line.id, index]))
  return [...cues].sort((a, b) => {
    const aLine = lineIndex.get(a.target.lineId) ?? 0
    const bLine = lineIndex.get(b.target.lineId) ?? 0
    if (aLine !== bLine) return aLine - bLine
    return (a.target.wordIndex ?? -1) - (b.target.wordIndex ?? -1)
  })
}

export const normalizeCueTarget = (
  cue: Cue,
  lineIndex: Map<string, number>,
  lineWords: Map<string, string[]>
): Cue => {
  const words = lineWords.get(cue.target.lineId) || []
  const parsedIndex = Number(cue?.target?.wordIndex)
  let wordText = cue?.target?.wordText ?? null
  if (!Number.isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < words.length) {
    wordText = words[parsedIndex] ?? null
  }
  return {
    ...cue,
    target: {
      ...cue.target,
      lineIndex: cue?.target?.lineIndex === undefined ? undefined : Number(cue.target.lineIndex),
      wordIndex: Number.isFinite(parsedIndex) ? parsedIndex : null,
      wordText
    }
  }
}

export const createCueTarget = (target: Partial<CueTarget>): CueTarget => ({
  lineId: target.lineId ?? '',
  lineIndex: target.lineIndex,
  wordIndex: target.wordIndex ?? null,
  wordText: target.wordText ?? null
})
