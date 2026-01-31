export type LineType = 'tekst' | 'actie' | 'sectie'

export type CueType = 'licht' | 'video' | 'audio' | 'decor'

export type ShapeKind = 'circle' | 'square'

export type ShapeLabel = 'licht' | 'decor'

export type Character = {
  id: string
  name: string
  person: string
}

export type ScriptLine = {
  id: string
  characterId: string
  text: string
  type: LineType
}

export type CueTarget = {
  lineId: string
  lineIndex?: number
  wordIndex: number | null
  wordText: string | null
}

export type Cue = {
  id: string
  type: CueType
  description: string
  target: CueTarget
}

export type StageShape = {
  id: string
  x: number
  y: number
  size: number
  kind: ShapeKind
  label: ShapeLabel
  name: string
  description: string
}

export type StagePlot = {
  enabled: boolean
  shapes: StageShape[]
  canvas?: {
    width: number
    height: number
  }
}

export type LeaderContact = {
  firstName: string
  lastName: string
  phone: string
}

export type ShapeDraft = {
  name: string
  description: string
  label: ShapeLabel
  kind: ShapeKind
  size: number
}
