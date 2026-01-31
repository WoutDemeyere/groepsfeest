import { create } from 'zustand'
import type {
  Character,
  Cue,
  CueTarget,
  CueType,
  LeaderContact,
  LineType,
  ScriptLine,
  ShapeDraft,
  ShapeKind,
  ShapeLabel,
  StagePlot,
  StageShape
} from '../types/app'
import { PLAYS } from '../config/plays.config'

const createId = () => crypto.randomUUID()

const createDefaultSection = (): ScriptLine => ({
  id: createId(),
  characterId: '',
  text: 'Scene 1',
  type: 'sectie'
})

const ensureFirstSection = (lines: ScriptLine[]) => {
  if (!lines.length) return [createDefaultSection()]
  if (lines[0].type !== 'sectie') return [createDefaultSection(), ...lines]
  return lines
}

export type AppState = {
  selectedPlay: string
  characters: Character[]
  lines: ScriptLine[]
  cues: Cue[]
  stagePlots: Record<string, StagePlot>
  leaderContact: LeaderContact
  cueModalOpen: boolean
  cueType: CueType
  cueDescription: string
  selectedTarget: CueTarget | null
  shapeModalOpen: boolean
  shapeDraft: ShapeDraft
  activeSectionId: string | null
  editingShapeId: string | null
  draggedLineId: string | null
  dropTargetId: string | null
  setSelectedPlay: (playId: string) => void
  setLeaderContact: (next: Partial<LeaderContact>) => void
  addCharacter: () => void
  updateCharacter: (id: string, field: keyof Character, value: string) => void
  removeCharacter: (id: string) => void
  addLine: () => void
  updateLine: (id: string, field: keyof ScriptLine | 'type', value: string) => void
  removeLine: (id: string) => void
  moveLine: (fromId: string | null, toId: string | null) => void
  setDraggedLineId: (id: string | null) => void
  setDropTargetId: (id: string | null) => void
  setCues: (cues: Cue[]) => void
  setLines: (lines: ScriptLine[]) => void
  setCharacters: (characters: Character[]) => void
  setStagePlots: (plots: Record<string, StagePlot>) => void
  updateStagePlots: (
    updater: (prev: Record<string, StagePlot>) => Record<string, StagePlot>
  ) => void
  updatePlotCanvasSize: (sectionId: string, rect: DOMRect) => void
  addCue: () => void
  removeCue: (cueId: string) => void
  setCueModalOpen: (open: boolean) => void
  setCueType: (value: CueType) => void
  setCueDescription: (value: string) => void
  setSelectedTarget: (target: CueTarget | null) => void
  enableStagePlot: (sectionId: string) => void
  disableStagePlot: (sectionId: string) => void
  openAddShapeModal: (sectionId: string, kind: ShapeKind) => void
  openEditShapeModal: (sectionId: string, shape: StageShape) => void
  setShapeDraft: (draft: Partial<ShapeDraft>) => void
  setShapeModalOpen: (open: boolean) => void
  saveShape: () => void
  removeShape: (sectionId: string, shapeId: string) => void
  setActiveSectionId: (sectionId: string | null) => void
  setEditingShapeId: (shapeId: string | null) => void
  resetUi: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedPlay: PLAYS[0]?.id ?? 'aspi-1',
  characters: [{ id: createId(), name: 'Personage 1', person: '' }],
  lines: [createDefaultSection()],
  cues: [],
  stagePlots: {},
  leaderContact: { firstName: '', lastName: '', phone: '' },
  cueModalOpen: false,
  cueType: 'licht',
  cueDescription: '',
  selectedTarget: null,
  shapeModalOpen: false,
  shapeDraft: {
    name: '',
    description: '',
    label: 'licht',
    kind: 'circle',
    size: 70
  },
  activeSectionId: null,
  editingShapeId: null,
  draggedLineId: null,
  dropTargetId: null,
  setSelectedPlay: (playId) => set({ selectedPlay: playId }),
  setLeaderContact: (next) =>
    set((state) => ({ leaderContact: { ...state.leaderContact, ...next } })),
  addCharacter: () =>
    set((state) => ({
      characters: [...state.characters, { id: createId(), name: '', person: '' }]
    })),
  updateCharacter: (id, field, value) =>
    set((state) => ({
      characters: state.characters.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    })),
  removeCharacter: (id) =>
    set((state) => ({
      characters: state.characters.filter((item) => item.id !== id),
      lines: state.lines.map((line) =>
        line.characterId === id ? { ...line, characterId: '' } : line
      )
    })),
  addLine: () =>
    set((state) => ({
      lines: ensureFirstSection([
        ...state.lines,
        { id: createId(), characterId: '', text: '', type: 'tekst' }
      ])
    })),
  updateLine: (id, field, value) =>
    set((state) => ({
      lines: state.lines.map((line) => {
        if (line.id !== id) return line
        if (state.lines[0]?.id === id && field === 'type' && value !== 'sectie') {
          return line
        }
        if (field === 'type' && (value === 'sectie' || value === 'actie')) {
          return { ...line, type: value as LineType, characterId: '' }
        }
        return { ...line, [field]: value }
      })
    })),
  removeLine: (id) =>
    set((state) => ({
      lines: ensureFirstSection(state.lines.filter((line) => line.id !== id))
    })),
  moveLine: (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return
    set((state) => {
      const firstLineId = state.lines[0]?.id
      if (fromId === firstLineId || toId === firstLineId) return state
      const fromIndex = state.lines.findIndex((line) => line.id === fromId)
      const toIndex = state.lines.findIndex((line) => line.id === toId)
      if (fromIndex === -1 || toIndex === -1) return state
      const next = [...state.lines]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return { lines: ensureFirstSection(next) }
    })
  },
  setDraggedLineId: (id) => set({ draggedLineId: id }),
  setDropTargetId: (id) => set({ dropTargetId: id }),
  setCues: (cues) => set({ cues }),
  setLines: (lines) => set({ lines: ensureFirstSection(lines) }),
  setCharacters: (characters) => set({ characters }),
  setStagePlots: (plots) => set({ stagePlots: plots }),
  updateStagePlots: (updater) => set((state) => ({ stagePlots: updater(state.stagePlots) })),
  updatePlotCanvasSize: (sectionId, rect) =>
    set((state) => {
      if (!sectionId || !rect) return state
      const width = Math.round(rect.width)
      const height = Math.round(rect.height)
      const section = state.stagePlots[sectionId] || { enabled: true, shapes: [] }
      const current = section.canvas || {}
      if (current.width === width && current.height === height) return state
      return {
        stagePlots: {
          ...state.stagePlots,
          [sectionId]: { ...section, canvas: { width, height } }
        }
      }
    }),
  addCue: () => {
    const { selectedTarget, cueType, cueDescription } = get()
    if (!selectedTarget) return
    set((state) => ({
      cues: [
        ...state.cues,
        {
          id: createId(),
          type: cueType,
          description: cueDescription.trim(),
          target: selectedTarget
        }
      ],
      cueDescription: '',
      cueModalOpen: false
    }))
  },
  removeCue: (cueId) =>
    set((state) => ({ cues: state.cues.filter((cue) => cue.id !== cueId) })),
  setCueModalOpen: (open) => set({ cueModalOpen: open }),
  setCueType: (value) => set({ cueType: value }),
  setCueDescription: (value) => set({ cueDescription: value }),
  setSelectedTarget: (target) => set({ selectedTarget: target }),
  enableStagePlot: (sectionId) =>
    set((state) => ({
      stagePlots: {
        ...state.stagePlots,
        [sectionId]: {
          ...(state.stagePlots[sectionId] || {}),
          enabled: true,
          shapes: state.stagePlots[sectionId]?.shapes ?? []
        }
      }
    })),
  disableStagePlot: (sectionId) =>
    set((state) => ({
      stagePlots: {
        ...state.stagePlots,
        [sectionId]: {
          ...(state.stagePlots[sectionId] || {}),
          enabled: false,
          shapes: state.stagePlots[sectionId]?.shapes ?? []
        }
      }
    })),
  openAddShapeModal: (sectionId, kind) =>
    set({
      activeSectionId: sectionId,
      editingShapeId: null,
      shapeDraft: { name: '', description: '', label: 'licht', kind, size: 70 },
      shapeModalOpen: true
    }),
  openEditShapeModal: (sectionId, shape) =>
    set({
      activeSectionId: sectionId,
      editingShapeId: shape.id,
      shapeDraft: {
        name: shape.name ?? '',
        description: shape.description ?? '',
        label: shape.label ?? 'licht',
        kind: shape.kind ?? 'circle',
        size: shape.size ?? 70
      },
      shapeModalOpen: true
    }),
  setShapeDraft: (draft) => set((state) => ({ shapeDraft: { ...state.shapeDraft, ...draft } })),
  setShapeModalOpen: (open) => set({ shapeModalOpen: open }),
  saveShape: () => {
    const { activeSectionId, editingShapeId, shapeDraft } = get()
    if (!activeSectionId) return
    const normalizedSize = Math.max(30, Number(shapeDraft.size) || 70)
    set((state) => {
      const section = state.stagePlots[activeSectionId] || { enabled: true, shapes: [] }
      const shapes = [...section.shapes]
      if (editingShapeId) {
        const index = shapes.findIndex((shape) => shape.id === editingShapeId)
        if (index !== -1) {
          shapes[index] = {
            ...shapes[index],
            name: shapeDraft.name.trim(),
            description: shapeDraft.description.trim(),
            label: shapeDraft.label as ShapeLabel,
            kind: shapeDraft.kind as ShapeKind,
            size: normalizedSize
          }
        }
      } else {
        shapes.push({
          id: createId(),
          x: 160,
          y: 120,
          size: normalizedSize,
          kind: shapeDraft.kind as ShapeKind,
          label: shapeDraft.label as ShapeLabel,
          name: shapeDraft.name.trim() || 'Object',
          description: shapeDraft.description.trim()
        })
      }
      return {
        stagePlots: {
          ...state.stagePlots,
          [activeSectionId]: { ...section, enabled: true, shapes }
        },
        shapeModalOpen: false,
        editingShapeId: null
      }
    })
  },
  removeShape: (sectionId, shapeId) =>
    set((state) => {
      const section = state.stagePlots[sectionId]
      if (!section) return state
      return {
        stagePlots: {
          ...state.stagePlots,
          [sectionId]: {
            ...section,
            shapes: section.shapes.filter((shape) => shape.id !== shapeId)
          }
        }
      }
    }),
  setActiveSectionId: (sectionId) => set({ activeSectionId: sectionId }),
  setEditingShapeId: (shapeId) => set({ editingShapeId: shapeId }),
  resetUi: () =>
    set({
      cueModalOpen: false,
      cueDescription: '',
      selectedTarget: null,
      shapeModalOpen: false,
      activeSectionId: null,
      editingShapeId: null,
      draggedLineId: null,
      dropTargetId: null
    })
}))
