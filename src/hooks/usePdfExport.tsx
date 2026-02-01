import { useCallback } from 'react'
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf
} from '@react-pdf/renderer'
import {
  Editor,
  createTLStore,
  defaultAddFontsFromNode,
  defaultBindingUtils,
  defaultShapeUtils,
  tipTapDefaultExtensions
} from 'tldraw'
import type { TLEditorSnapshot } from 'tldraw'
import type { Character, Cue, LeaderContact, ScriptLine } from '../types/app'
import { normalizeWord, sortCues, tokenizeText } from '../utils/cue'
import { CUE_MARKER_COLORS } from '../config/cues.config'
import { SUMMARIES } from '../config/summaries.config'

type Section = {
  id: string
  title: string
}

type PodiumPlotLayouts = Record<string, string[]>
type PodiumPlotDocuments = Record<string, TLEditorSnapshot>
type PodiumPlotNotes = Record<string, string>

type UsePdfExportArgs = {
  selectedPlay: string
  characters: Character[]
  lines: ScriptLine[]
  cues: Cue[]
  sections: Section[]
  podiumPlotLayouts: PodiumPlotLayouts
  podiumPlotDocuments: PodiumPlotDocuments
  podiumPlotNotes: PodiumPlotNotes
  leaderContact: LeaderContact
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 22,
    paddingHorizontal: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1f2a3a'
  },
  header: {
    marginBottom: 8
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  metaPill: {
    backgroundColor: '#f3f5f8',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 999,
    marginRight: 6,
    marginBottom: 4
  },
  section: {
    marginTop: 6
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#6a7280',
    marginBottom: 4
  },
  panel: {
    borderWidth: 1,
    borderColor: '#e2e6ee',
    borderRadius: 10,
    padding: 6,
    backgroundColor: '#fbfcfd'
  },
  grid: {
    flexDirection: 'row'
  },
  gridCol: {
    flexGrow: 1,
    flexBasis: 0
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e9f0',
    paddingVertical: 3
  },
  tableHeader: {
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#6a7280'
  },
  tableCell: {
    flexGrow: 1
  },
  scriptLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 1,
    paddingHorizontal: 2,
    borderRadius: 6
  },
  scriptIndex: {
    width: 18,
    fontSize: 9,
    color: '#6a7280',
    marginRight: 4
  },
  scriptSpeaker: {
    width: 70,
    fontSize: 9,
    color: '#000000',
    fontWeight: 700,
    marginRight: 4
  },
  scriptText: {
    width: 214,
    lineHeight: 1.05
  },
  scriptTextWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start'
  },
  wordPlain: {
    marginRight: 2,
    marginBottom: 1,
    lineHeight: 1.0
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 0,
    borderRadius: 999,
    marginRight: 2,
    marginBottom: 1
  },
  wordChipText: {
    color: '#1f2a3a',
    lineHeight: 1.0
  },
  wordChipNumber: {
    marginLeft: 2,
    paddingHorizontal: 3,
    paddingVertical: 0,
    borderRadius: 999
  },
  wordChipNumberText: {
    fontSize: 8,
    fontWeight: 700,
    color: '#0f172a'
  },
  actionWordText: {
    fontStyle: 'italic',
    fontWeight: 600
  },
  actionText: {
    fontStyle: 'italic',
    fontWeight: 600,
    fontSize: 10
  },
  cueBadge: {
    fontSize: 8,
    color: '#2b3446',
    marginLeft: 4
  },
  cueChip: {
    fontSize: 7,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#2b3446',
    backgroundColor: '#eef2f7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start'
  },
  sectionLine: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: 700,
    color: '#2b3446'
  },
  sceneCard: {
    borderWidth: 1,
    borderColor: '#e2e6ee',
    borderRadius: 10,
    padding: 6,
    marginBottom: 8
  },
  cueCard: {
    borderWidth: 1,
    borderColor: '#e2e6ee',
    borderRadius: 10,
    padding: 6,
    marginBottom: 4,
    backgroundColor: '#f7f9fb'
  },
  cueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 2,
    borderBottomWidth: 0
  },
  cueRowLine: {
    width: 330
  },
  cueRowCues: {
    width: 180,
    flexShrink: 0,
    marginTop: 2
  },
  cueLabel: {
    fontSize: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#6a7280',
    marginBottom: 2
  },
  plotSection: {
    marginTop: 10
  },
  plotTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 4,
    color: '#2b3446'
  },
  plotImage: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e6ee',
    objectFit: 'contain'
  },
  plotNote: {
    marginTop: 2,
    fontSize: 9,
    color: '#6a7280'
  }
})

const buildTldrawImage = async (snapshot?: TLEditorSnapshot) => {
  if (!snapshot) return null
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.width = '1200px'
  container.style.height = '800px'
  container.style.opacity = '0'
  container.style.pointerEvents = 'none'
  document.body.appendChild(container)

  const store = createTLStore({ snapshot })
  const editor = new Editor({
    store,
    shapeUtils: defaultShapeUtils,
    bindingUtils: defaultBindingUtils,
    tools: [],
    getContainer: () => container,
    textOptions: {
      addFontsFromNode: defaultAddFontsFromNode,
      tipTapConfig: { extensions: tipTapDefaultExtensions }
    }
  })

  editor.updateViewportScreenBounds(container)
  editor.setCamera({ x: 0, y: 0, z: 1 }, { force: true, immediate: true, reset: true })
  const shapeIds = Array.from(editor.getCurrentPageShapeIds())
  if (!shapeIds.length) {
    editor.dispose()
    container.remove()
    return null
  }

  const result = await editor.toImageDataUrl(shapeIds, {
    format: 'png',
    background: false,
    scale: 1
  })

  editor.dispose()
  container.remove()

  return result?.url ?? null
}

const PdfDocument = ({
  selectedPlay,
  characters,
  lines,
  cues,
  sections,
  podiumPlots,
  leaderContact
}: {
  selectedPlay: string
  characters: Character[]
  lines: ScriptLine[]
  cues: Cue[]
  sections: Section[]
  podiumPlots: Array<{
    section: Section
    image: string | null
    note: string
  }>
  leaderContact: LeaderContact
}) => {
  const leaderName = [leaderContact.firstName, leaderContact.lastName]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(' ')
  const leaderPhone = leaderContact.phone.trim()
  const sortedCues = sortCues(cues, lines)
  const cueBadge = (numbers: number[]) =>
    numbers && numbers.length ? ` [${numbers.join(',')}]` : ''

  const cueNumbers = new Map(sortedCues.map((cue, index) => [cue.id, index + 1]))
  const cuesByLine = new Map<string, Cue[]>()
  sortedCues.forEach((cue) => {
    const list = cuesByLine.get(cue.target.lineId) ?? []
    list.push(cue)
    cuesByLine.set(cue.target.lineId, list)
  })
  cuesByLine.forEach((list) => {
    list.sort((a, b) => (a.target.wordIndex ?? -1) - (b.target.wordIndex ?? -1))
  })

  const pdfLineMarkers = new Map<string, { numbers: number[]; types: Set<string> }>()
  const pdfWordMarkers = new Map<string, Array<{ numbers: number[]; types: Set<string> }>>()
  const lineWords = new Map(lines.map((line) => [line.id, tokenizeText(line.text)]))

  sortedCues.forEach((cue, index) => {
    const wordIndex = cue?.target?.wordIndex
    const wordText = cue?.target?.wordText
    const isLineCue = wordIndex == null && !wordText
    const cueNumber = index + 1

    if (isLineCue) {
      const key = `${cue.target.lineId}:line`
      if (!pdfLineMarkers.has(key)) {
        pdfLineMarkers.set(key, { numbers: [], types: new Set() })
      }
      const entry = pdfLineMarkers.get(key)
      if (!entry) return
      entry.numbers.push(cueNumber)
      entry.types.add(cue.type)
      return
    }

    const words = lineWords.get(cue.target.lineId) || []
    const normalizedWords = words.map((word) => normalizeWord(word))
    const normalizedTarget = normalizeWord(wordText ?? '')
    let targetIndex: number | null = null

    if (wordIndex != null && Number.isFinite(Number(wordIndex))) {
      const indexValue = Number(wordIndex)
      if (indexValue >= 0 && indexValue < words.length) {
        if (
          normalizedTarget &&
          normalizedWords[indexValue] &&
          normalizedWords[indexValue] !== normalizedTarget
        ) {
          targetIndex = null
        } else {
          targetIndex = indexValue
        }
      }
    }

    if (targetIndex == null && normalizedTarget) {
      const indexValue = normalizedWords.findIndex((value) => value === normalizedTarget)
      if (indexValue !== -1) {
        targetIndex = indexValue
      }
    }

    if (targetIndex == null) {
      return
    }

    if (!pdfWordMarkers.has(cue.target.lineId)) {
      pdfWordMarkers.set(cue.target.lineId, [])
    }
    const markers = pdfWordMarkers.get(cue.target.lineId)
    if (!markers) return
    if (!markers[targetIndex]) {
      markers[targetIndex] = { numbers: [], types: new Set() }
    }
    markers[targetIndex].numbers.push(cueNumber)
    markers[targetIndex].types.add(cue.type)
  })

  const markerColor = (types?: Set<string>) => {
    if (!types || types.size === 0) return 'transparent'
    if (types.size > 1) return '#d7deea'
    const type = Array.from(types)[0]
    return (CUE_MARKER_COLORS as Record<string, string>)[type] ?? '#d7deea'
  }

  const lineIndexMap = new Map(lines.map((line, index) => [line.id, index]))
  const scenes: Array<{ title: string; lines: ScriptLine[] }> = []
  let currentScene: { title: string; lines: ScriptLine[] } | null = null
  lines.forEach((line) => {
    if (line.type === 'sectie') {
      currentScene = {
        title: line.text?.trim() || `Sectie ${scenes.length + 1}`,
        lines: []
      }
      scenes.push(currentScene)
      return
    }
    if (!currentScene) {
      currentScene = { title: `Sectie ${scenes.length + 1}`, lines: [] }
      scenes.push(currentScene)
    }
    currentScene.lines.push(line)
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Technische fiche</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text>Groep: {selectedPlay}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text>
                Leiding: {leaderName || '-'} {leaderPhone ? `(${leaderPhone})` : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.grid, styles.section]}>
          <View style={[styles.gridCol, styles.panel, { marginRight: 12 }]}>
            <Text style={styles.sectionTitle}>Personages</Text>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableHeader]}>Personage</Text>
              <Text style={[styles.tableCell, styles.tableHeader]}>Speler</Text>
            </View>
            {characters.map((character) => (
              <View key={character.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{character.name || '-'}</Text>
                <Text style={styles.tableCell}>{character.person || '-'}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.gridCol, styles.panel]}>
            <Text style={styles.sectionTitle}>Samenvatting</Text>
            <Text>{SUMMARIES[selectedPlay] ?? selectedPlay}</Text>
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Script & cues</Text>
          <View>
            {scenes.map((scene, sceneIndex) => {
              const allowSplit = scene.lines.length > 12
              return (
                <View
                  key={`scene-${sceneIndex}`}
                  style={styles.sceneCard}
                  wrap={allowSplit}
                >
                  <Text style={styles.sectionLine}>{scene.title}</Text>
                  {scene.lines.map((line) => {
                    const index = lineIndexMap.get(line.id) ?? 0
                    const character = characters.find((item) => item.id === line.characterId)
                    const words = tokenizeText(line.text)
                    const lineKey = `${line.id}:line`
                    const lineMarker = pdfLineMarkers.get(lineKey)
                    const lineMarkerNumbers = lineMarker?.numbers || []
                    const lineMarkerColor = markerColor(lineMarker?.types)
                    const lineCues = cuesByLine.get(line.id) ?? []

                    return (
                      <View key={line.id} style={styles.cueRow}>
                        <View style={styles.cueRowLine}>
                          <View
                            style={[
                              styles.scriptLine,
                              lineMarkerNumbers.length ? { backgroundColor: lineMarkerColor } : null
                            ]}
                          >
                            <Text style={styles.scriptIndex}>
                              {line.type === 'actie' ? '' : index + 1}
                              {lineMarkerNumbers.length ? (
                                <Text style={styles.cueBadge}>{cueBadge(lineMarkerNumbers)}</Text>
                              ) : null}
                            </Text>
                            <Text style={styles.scriptSpeaker}>
                              {line.type === 'actie' ? '' : character?.name?.toUpperCase() || 'ONBEKEND'}
                            </Text>
                            <View style={styles.scriptText}>
                              <View style={styles.scriptTextWrap}>
                                {words.length
                                  ? words.map((word, wordIndex) => {
                                      const marker = pdfWordMarkers.get(line.id)?.[wordIndex]
                                      const markerNumbers = marker?.numbers || []
                                      const hasMarkers = markerNumbers && markerNumbers.length
                                      const wordColor = markerColor(marker?.types)
                                      const wordTextStyle = [
                                        styles.wordChipText,
                                        line.type === 'actie' ? styles.actionWordText : null
                                      ]
                                      const plainTextStyle = [
                                        styles.wordPlain,
                                        line.type === 'actie' ? styles.actionWordText : null
                                      ]
                                      if (!hasMarkers) {
                                        return (
                                          <Text key={`${line.id}-${wordIndex}`} style={plainTextStyle}>
                                            {word}
                                          </Text>
                                        )
                                      }
                                      return (
                                        <View
                                          key={`${line.id}-${wordIndex}`}
                                          style={[styles.wordChip, { backgroundColor: wordColor }]}
                                        >
                                          <Text style={wordTextStyle}>{word}</Text>
                                          <View
                                            style={[
                                              styles.wordChipNumber,
                                              { backgroundColor: wordColor }
                                            ]}
                                          >
                                            <Text style={styles.wordChipNumberText}>
                                              {markerNumbers.join(',')}
                                            </Text>
                                          </View>
                                        </View>
                                      )
                                    })
                                  : (
                                    <Text style={styles.wordPlain}>—</Text>
                                  )}
                              </View>
                            </View>
                          </View>
                        </View>
                        <View style={styles.cueRowCues}>
                          {lineCues.map((cue) => {
                            const cueColor =
                              (CUE_MARKER_COLORS as Record<string, string>)[cue.type] ?? '#f7f9fb'
                            return (
                              <View key={cue.id} style={[styles.cueCard, { backgroundColor: cueColor }]}>
                                <Text style={styles.cueLabel}>
                                  Cue {cueNumbers.get(cue.id)} · {cue.type.toUpperCase()}
                                </Text>
                                <Text>{cue.description || 'Geen beschrijving.'}</Text>
                                {cue.fileName ? <Text>Bestand: {cue.fileName}</Text> : null}
                              </View>
                            )
                          })}
                        </View>
                      </View>
                    )
                  })}
                </View>
              )
            })}
          </View>
        </View>
      </Page>

      {sections.flatMap((section) => {
        const entries = podiumPlots.filter((entry) => entry.section.id === section.id)
        if (!entries.length) {
          return [
            <Page key={`plot-${section.id}-empty`} size="A4" style={styles.page}>
              <Text style={styles.sectionTitle}>Podiumplots</Text>
              <Text style={styles.plotTitle}>{section.title}</Text>
              <Text>Geen podiumplot.</Text>
            </Page>
          ]
        }
        return entries.map((entry, idx) => (
          <Page key={`plot-${section.id}-${idx}`} size="A4" style={styles.page}>
            <Text style={styles.sectionTitle}>Podiumplots</Text>
            <Text style={styles.plotTitle}>{section.title}</Text>
            {entry.image ? (
              <Image
                style={[styles.plotImage, { height: 420 }]}
                src={entry.image}
              />
            ) : (
              <Text>Geen podiumplot.</Text>
            )}
            {entry.note ? <Text style={styles.plotNote}>{entry.note}</Text> : null}
          </Page>
        ))
      })}
    </Document>
  )
}

export const usePdfExport = ({
  selectedPlay,
  characters,
  lines,
  cues,
  sections,
  podiumPlotLayouts,
  podiumPlotDocuments,
  podiumPlotNotes,
  leaderContact
}: UsePdfExportArgs) => {
  return useCallback(async () => {
    if (!lines.length || !sections.length) return

    const podiumPlots = (
      await Promise.all(
        sections.flatMap((section) => {
          const plots = podiumPlotLayouts[section.id] ?? []
          if (!plots.length) {
            return [
              Promise.resolve({
                section,
                image: null,
                note: ''
              })
            ]
          }
          return plots.map(async (plotId) => ({
            section,
            image: await buildTldrawImage(podiumPlotDocuments[plotId]),
            note: podiumPlotNotes[plotId] ?? ''
          }))
        })
      )
    ).filter(Boolean)

    const blob = await pdf(
      <PdfDocument
        selectedPlay={selectedPlay}
        characters={characters}
        lines={lines}
        cues={cues}
        sections={sections}
        podiumPlots={podiumPlots}
        leaderContact={leaderContact}
      />
    ).toBlob()

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `toneelstuk-export-${selectedPlay}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }, [
    characters,
    cues,
    leaderContact,
    lines,
    sections,
    selectedPlay,
    podiumPlotDocuments,
    podiumPlotLayouts,
    podiumPlotNotes
  ])
}
