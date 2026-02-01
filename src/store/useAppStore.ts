import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
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
  PodiumPlot,
  StageShape
} from '../types/app'
import { PLAYS } from '../config/plays.config'
import type { TLEditorSnapshot, TLContent } from 'tldraw'
import { idbStorage } from './idbStorage'

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
  podiumPlots: Record<string, PodiumPlot>
  podiumPlotLayouts: Record<string, string[]>
  podiumPlotDocuments: Record<string, TLEditorSnapshot>
  podiumPlotNotes: Record<string, string>
  podiumPlotClipboard: TLContent | null
  leaderContact: LeaderContact
  cueModalOpen: boolean
  cueType: CueType
  cueDescription: string
  cueFileName: string
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
  setPodiumPlots: (plots: Record<string, PodiumPlot>) => void
  setPodiumPlotLayouts: (layouts: Record<string, string[]>) => void
  setPodiumPlotDocuments: (documents: Record<string, TLEditorSnapshot>) => void
  setPodiumPlotNotes: (notes: Record<string, string>) => void
  setPodiumPlotClipboard: (content: TLContent | null) => void
  ensurePodiumPlotSections: (sectionIds: string[]) => void
  addPodiumPlot: (sectionId: string) => string
  removePodiumPlot: (sectionId: string, plotId: string) => void
  setPodiumPlotDocument: (plotId: string, snapshot: TLEditorSnapshot) => void
  setPodiumPlotNote: (plotId: string, note: string) => void
  updatePodiumPlots: (
    updater: (prev: Record<string, PodiumPlot>) => Record<string, PodiumPlot>
  ) => void
  updatePlotCanvasSize: (sectionId: string, rect: DOMRect) => void
  addCue: () => void
  removeCue: (cueId: string) => void
  setCueModalOpen: (open: boolean) => void
  setCueType: (value: CueType) => void
  setCueDescription: (value: string) => void
  setCueFileName: (value: string) => void
  setSelectedTarget: (target: CueTarget | null) => void
  enablePodiumPlot: (sectionId: string) => void
  disablePodiumPlot: (sectionId: string) => void
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedPlay: PLAYS[0]?.id ?? 'aspi-1',
  characters: [{ id: createId(), name: 'Personage 1', person: '' }],
  lines: [createDefaultSection()],
  cues: [],
  podiumPlots: {},
  podiumPlotLayouts: {},
  podiumPlotDocuments: {},
  podiumPlotNotes: {},
  podiumPlotClipboard: null,
  leaderContact: { firstName: '', lastName: '', phone: '' },
  cueModalOpen: false,
  cueType: 'licht',
  cueDescription: '',
  cueFileName: '',
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
  setPodiumPlots: (plots) => set({ podiumPlots: plots }),
  setPodiumPlotLayouts: (layouts) => set({ podiumPlotLayouts: layouts }),
  setPodiumPlotDocuments: (documents) => set({ podiumPlotDocuments: documents }),
  setPodiumPlotNotes: (notes) => set({ podiumPlotNotes: notes }),
  setPodiumPlotClipboard: (content) => set({ podiumPlotClipboard: content }),
  ensurePodiumPlotSections: (sectionIds) =>
    set((state) => {
      const nextLayouts: Record<string, string[]> = {}
      sectionIds.forEach((sectionId) => {
        const existing = state.podiumPlotLayouts[sectionId]
        if (existing?.length) {
          nextLayouts[sectionId] = existing
        } else {
          nextLayouts[sectionId] = [createId()]
        }
      })

      const nextDocuments: Record<string, TLEditorSnapshot> = {}
      Object.entries(state.podiumPlotDocuments).forEach(([plotId, snapshot]) => {
        const stillExists = Object.values(nextLayouts).some((plots) => plots.includes(plotId))
        if (stillExists) {
          nextDocuments[plotId] = snapshot
        }
      })

      const nextNotes: Record<string, string> = {}
      Object.entries(state.podiumPlotNotes).forEach(([plotId, note]) => {
        const stillExists = Object.values(nextLayouts).some((plots) => plots.includes(plotId))
        if (stillExists) {
          nextNotes[plotId] = note
        }
      })

      return {
        podiumPlotLayouts: nextLayouts,
        podiumPlotDocuments: nextDocuments,
        podiumPlotNotes: nextNotes
      }
    }),
  addPodiumPlot: (sectionId) => {
    const plotId = createId()
    set((state) => ({
      podiumPlotLayouts: {
        ...state.podiumPlotLayouts,
        [sectionId]: [...(state.podiumPlotLayouts[sectionId] ?? []), plotId]
      },
      podiumPlotNotes: {
        ...state.podiumPlotNotes,
        [plotId]: state.podiumPlotNotes[plotId] ?? ''
      }
    }))
    return plotId
  },
  removePodiumPlot: (sectionId, plotId) =>
    set((state) => {
      const current = state.podiumPlotLayouts[sectionId] ?? []
      if (current.length <= 1) return state
      const nextLayouts = {
        ...state.podiumPlotLayouts,
        [sectionId]: current.filter((id) => id !== plotId)
      }
      const nextDocuments = { ...state.podiumPlotDocuments }
      const nextNotes = { ...state.podiumPlotNotes }
      delete nextDocuments[plotId]
      delete nextNotes[plotId]
      return {
        podiumPlotLayouts: nextLayouts,
        podiumPlotDocuments: nextDocuments,
        podiumPlotNotes: nextNotes
      }
    }),
  setPodiumPlotDocument: (plotId, snapshot) =>
    set((state) => ({
      podiumPlotDocuments: { ...state.podiumPlotDocuments, [plotId]: snapshot }
    })),
  setPodiumPlotNote: (plotId, note) =>
    set((state) => ({
      podiumPlotNotes: { ...state.podiumPlotNotes, [plotId]: note }
    })),
  updatePodiumPlots: (updater) => set((state) => ({ podiumPlots: updater(state.podiumPlots) })),
  updatePlotCanvasSize: (sectionId, rect) =>
    set((state) => {
      if (!sectionId || !rect) return state
      const width = Math.round(rect.width)
      const height = Math.round(rect.height)
      const section = state.podiumPlots[sectionId] || { enabled: true, shapes: [] }
      const current = section.canvas || {}
      if (current.width === width && current.height === height) return state
      return {
        podiumPlots: {
          ...state.podiumPlots,
          [sectionId]: { ...section, canvas: { width, height } }
        }
      }
    }),
  addCue: () => {
    const { selectedTarget, cueType, cueDescription, cueFileName } = get()
    if (!selectedTarget) return
    set((state) => ({
      cues: [
        ...state.cues,
        {
          id: createId(),
          type: cueType,
          description: cueDescription.trim(),
          fileName: cueFileName.trim() || undefined,
          target: selectedTarget
        }
      ],
      cueDescription: '',
      cueFileName: '',
      cueModalOpen: false
    }))
  },
  removeCue: (cueId) =>
    set((state) => ({ cues: state.cues.filter((cue) => cue.id !== cueId) })),
  setCueModalOpen: (open) => set({ cueModalOpen: open }),
  setCueType: (value) => set({ cueType: value }),
  setCueDescription: (value) => set({ cueDescription: value }),
  setCueFileName: (value) => set({ cueFileName: value }),
  setSelectedTarget: (target) => set({ selectedTarget: target }),
  enablePodiumPlot: (sectionId) =>
    set((state) => ({
      podiumPlots: {
        ...state.podiumPlots,
        [sectionId]: {
          ...(state.podiumPlots[sectionId] || {}),
          enabled: true,
          shapes: state.podiumPlots[sectionId]?.shapes ?? []
        }
      }
    })),
  disablePodiumPlot: (sectionId) =>
    set((state) => ({
      podiumPlots: {
        ...state.podiumPlots,
        [sectionId]: {
          ...(state.podiumPlots[sectionId] || {}),
          enabled: false,
          shapes: state.podiumPlots[sectionId]?.shapes ?? []
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
      const section = state.podiumPlots[activeSectionId] || { enabled: true, shapes: [] }
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
        podiumPlots: {
          ...state.podiumPlots,
          [activeSectionId]: { ...section, enabled: true, shapes }
        },
        shapeModalOpen: false,
        editingShapeId: null
      }
    })
  },
  removeShape: (sectionId, shapeId) =>
    set((state) => {
      const section = state.podiumPlots[sectionId]
      if (!section) return state
      return {
        podiumPlots: {
          ...state.podiumPlots,
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
    }),
    {
      name: 'groepsfeestapp-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        selectedPlay: state.selectedPlay,
        characters: state.characters,
        lines: state.lines,
        cues: state.cues,
        podiumPlots: state.podiumPlots,
        podiumPlotLayouts: state.podiumPlotLayouts,
        podiumPlotDocuments: state.podiumPlotDocuments,
        podiumPlotNotes: state.podiumPlotNotes,
        leaderContact: state.leaderContact,
        cueType: state.cueType,
        cueDescription: state.cueDescription,
        cueFileName: state.cueFileName
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.lines) {
          state.lines = ensureFirstSection(state.lines)
        }
      }
    }
  )
)
