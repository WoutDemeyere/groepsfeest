export type LineType = 'tekst' | 'actie' | 'sectie'

export type CueType = 'licht' | 'video' | 'audio' | 'decor' | 'afbeelding'

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
  fileName?: string
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

export type PodiumPlot = {
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

export type PodiumPlotLayout = Record<string, string[]>

export type PodiumPlotNotes = Record<string, string>

export type PodiumPlotDocuments = Record<string, import('tldraw').TLEditorSnapshot>

export type ExportSchemaVersion = 2

export type ExportPayload = {
  schemaVersion: ExportSchemaVersion
  selectedPlay: string
  characters: Character[]
  lines: ScriptLine[]
  cues: Cue[]
  podiumPlots: Record<string, PodiumPlot>
  podiumPlotLayouts: PodiumPlotLayout
  podiumPlotDocuments: PodiumPlotDocuments
  podiumPlotNotes: PodiumPlotNotes
  leaderContact: LeaderContact
}
