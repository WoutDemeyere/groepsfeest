import { useCallback } from 'react'
import type { ChangeEvent } from 'react'
import { useAppStore } from '../store/useAppStore'
import { normalizeCueTarget } from '../utils/cue'
import type { Cue, PodiumPlot, PodiumPlotLayout, PodiumPlotDocuments, PodiumPlotNotes } from '../types/app'

type ImportPayload = {
  schemaVersion?: number
  selectedPlay?: string
  characters?: unknown
  lines?: unknown
  cues?: unknown
  leaderContact?: {
    firstName?: string
    lastName?: string
    phone?: string
  }
  podiumPlots?: unknown
  podiumPlotLayouts?: unknown
  podiumPlotDocuments?: unknown
  podiumPlotNotes?: unknown
}

const normalizePodiumPlots = (rawPlots: Record<string, PodiumPlot>) =>
  Object.fromEntries(
    Object.entries(rawPlots).map(([sectionId, plot]) => {
      const shapes = Array.isArray(plot?.shapes) ? plot.shapes : []
      return [
        sectionId,
        {
          enabled: plot?.enabled === true,
          canvas: {
            width: Number(plot?.canvas?.width ?? 0),
            height: Number(plot?.canvas?.height ?? 0)
          },
          shapes: shapes.map((shape) => ({
            id: shape?.id ?? crypto.randomUUID(),
            x: Number(shape?.x ?? 0),
            y: Number(shape?.y ?? 0),
            size: Number(shape?.size ?? 70),
            kind: shape?.kind === 'square' ? 'square' : 'circle',
            label: shape?.label === 'decor' ? 'decor' : 'licht',
            name: shape?.name ?? '',
            description: shape?.description ?? ''
          }))
        }
      ]
    })
  )

export const usePlayImport = () => {
  const setSelectedPlay = useAppStore((state) => state.setSelectedPlay)
  const setCharacters = useAppStore((state) => state.setCharacters)
  const setLines = useAppStore((state) => state.setLines)
  const setCues = useAppStore((state) => state.setCues)
  const setLeaderContact = useAppStore((state) => state.setLeaderContact)
  const setPodiumPlots = useAppStore((state) => state.setPodiumPlots)
  const setPodiumPlotLayouts = useAppStore((state) => state.setPodiumPlotLayouts)
  const setPodiumPlotDocuments = useAppStore((state) => state.setPodiumPlotDocuments)
  const setPodiumPlotNotes = useAppStore((state) => state.setPodiumPlotNotes)
  const lines = useAppStore((state) => state.lines)

  return useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      const text = await file.text()
      event.target.value = ''

      try {
        const data = JSON.parse(text) as ImportPayload

        if (data.selectedPlay) setSelectedPlay(data.selectedPlay)

        const importedLines = Array.isArray(data.lines) ? data.lines : null
        if (Array.isArray(data.characters)) setCharacters(data.characters)
        if (importedLines) setLines(importedLines)

        if (data.leaderContact && typeof data.leaderContact === 'object') {
          setLeaderContact({
            firstName: data.leaderContact.firstName ?? '',
            lastName: data.leaderContact.lastName ?? '',
            phone: data.leaderContact.phone ?? ''
          })
        }

        if (Array.isArray(data.cues)) {
          const sourceLines = importedLines || lines
          const lineMap = new Map(sourceLines.map((line) => [line.id, line]))
          const lineWords = new Map(
            sourceLines.map((line) => [
              line.id,
              line.text ? line.text.split(/\s+/).filter(Boolean) : []
            ])
          )
          const lineIndex = new Map(sourceLines.map((line, index) => [line.id, index]))
          const normalized = (data.cues as Cue[]).map((cue) =>
            normalizeCueTarget(cue, lineIndex, lineWords)
          )
          const filtered = normalized.map((cue) => {
            if (!cue.target.wordText && cue.target.wordIndex != null) {
              const line = lineMap.get(cue.target.lineId)
              const words = line?.text ? line.text.split(/\s+/).filter(Boolean) : []
              return {
                ...cue,
                target: {
                  ...cue.target,
                  wordText: words[cue.target.wordIndex] ?? null
                }
              }
            }
            return cue
          })
          setCues(filtered)
        }

        if (data.podiumPlots && typeof data.podiumPlots === 'object') {
          setPodiumPlots(normalizePodiumPlots(data.podiumPlots as Record<string, PodiumPlot>))
        }

        if (data.podiumPlotLayouts && typeof data.podiumPlotLayouts === 'object') {
          setPodiumPlotLayouts(data.podiumPlotLayouts as PodiumPlotLayout)
        }

        if (data.podiumPlotDocuments && typeof data.podiumPlotDocuments === 'object') {
          setPodiumPlotDocuments(data.podiumPlotDocuments as PodiumPlotDocuments)
        }

        if (data.podiumPlotNotes && typeof data.podiumPlotNotes === 'object') {
          setPodiumPlotNotes(data.podiumPlotNotes as PodiumPlotNotes)
        }
      } catch {
        // ignore invalid import
      }
    },
    [
      lines,
      setCharacters,
      setCues,
      setLeaderContact,
      setLines,
      setSelectedPlay,
      setPodiumPlots,
      setPodiumPlotLayouts,
      setPodiumPlotDocuments,
      setPodiumPlotNotes
    ]
  )
}
