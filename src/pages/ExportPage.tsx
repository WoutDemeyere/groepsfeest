import { useMemo } from 'react'
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import { useAppStore } from '../store/useAppStore'
import type { ExportPayload, ExportSchemaVersion } from '../types/app'
import { buildPlotPng, getPlotCanvasBaseHeight } from '../utils/plotExport'
import { normalizeWord, sortCues, tokenizeText } from '../utils/cue'
import { CUE_MARKER_COLORS } from '../config/cues.config'
import { SUMMARIES } from '../config/summaries.config'
import styles from '../styles/app.module.css'

export const ExportPage = () => {
  const navigate = useNavigate()
  const selectedPlay = useAppStore((state) => state.selectedPlay)
  const characters = useAppStore((state) => state.characters)
  const lines = useAppStore((state) => state.lines)
  const cues = useAppStore((state) => state.cues)
  const stagePlots = useAppStore((state) => state.stagePlots)
  const stagePlotLayouts = useAppStore((state) => state.stagePlotLayouts)
  const stagePlotDocuments = useAppStore((state) => state.stagePlotDocuments)
  const stagePlotNotes = useAppStore((state) => state.stagePlotNotes)
  const leaderContact = useAppStore((state) => state.leaderContact)
  const setLeaderContact = useAppStore((state) => state.setLeaderContact)

  const isReadyToPublish = useMemo(() => {
    return (
      leaderContact.firstName.trim().length > 0 &&
      leaderContact.lastName.trim().length > 0 &&
      leaderContact.phone.trim().length > 0
    )
  }, [leaderContact.firstName, leaderContact.lastName, leaderContact.phone])

  const sections = useMemo(() => {
    let sectionCount = 0
    return lines
      .filter((line) => line.type === 'sectie')
      .map((line) => {
        sectionCount += 1
        return {
          id: line.id,
          title: line.text?.trim() || `Sectie ${sectionCount}`
        }
      })
  }, [lines])

  const hasEnabledPlots = useMemo(
    () => sections.some((section) => stagePlots[section.id]?.enabled),
    [sections, stagePlots]
  )

  const sortedCues = useMemo(() => sortCues(cues, lines), [cues, lines])

  const cuePositions = useMemo(() => {
    const lineIndex = new Map(lines.map((line, index) => [line.id, index]))
    const lineHeight = 56
    const minGap = 120
    const maxShift = 200
    let lastTop = -Infinity
    return sortedCues.map((cue, index) => {
      const baseIndex = cue.target.lineIndex ?? lineIndex.get(cue.target.lineId) ?? 0
      const wordOffset = cue.target.wordIndex != null ? 0.18 : 0
      const desiredTop = (baseIndex + wordOffset) * lineHeight - 38
      let top = desiredTop
      if (top < lastTop + minGap) {
        top = Math.min(lastTop + minGap, desiredTop + maxShift)
      }
      lastTop = top
      return {
        ...cue,
        number: index + 1,
        top,
        lineHeight
      }
    })
  }, [sortedCues, lines])

  const exportJson = () => {
    const payload: ExportPayload = {
      schemaVersion: 2 as ExportSchemaVersion,
      selectedPlay,
      characters,
      lines,
      cues,
      stagePlots,
      stagePlotLayouts,
      stagePlotDocuments,
      stagePlotNotes,
      leaderContact
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `toneelstuk-export-${selectedPlay}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportPlotsPng = () => {
    const plots = sections
      .map((section, index) => {
        const plot = stagePlots[section.id]
        if (!plot?.enabled) return null
        const image = buildPlotPng(plot)
        if (!image) return null
        return { section, index, image }
      })
      .filter(Boolean)

    plots.forEach((plot) => {
      const rawTitle = plot?.section.title?.trim() || `sectie-${(plot?.index ?? 0) + 1}`
      const safeTitle = rawTitle.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-')
      const link = document.createElement('a')
      link.href = plot?.image ?? ''
      link.download = `stageplot-${selectedPlay}-${safeTitle}.png`
      link.click()
    })
  }

  const exportPdf = () => {
    const cueBadge = (numbers: number[]) =>
      numbers && numbers.length ? `<span class="badge">${numbers.join(',')}</span>` : ''

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
      if (types.size > 1) return '#dfe6ff'
      const type = Array.from(types)[0]
      return (CUE_MARKER_COLORS as Record<string, string>)[type] ?? '#dfe6ff'
    }

    const leaderName = [leaderContact.firstName, leaderContact.lastName]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' ')
    const leaderPhone = leaderContact.phone.trim()

    const plotImages = sections.map((section, index) => {
      const plot = stagePlots[section.id]
      return {
        section,
        index,
        enabled: plot?.enabled === true,
        image: plot?.enabled ? buildPlotPng(plot) : null
      }
    })

    const cueMapHeight = Math.max(
      lines.length * 36 + 160,
      360,
      (cuePositions.at(-1)?.top ?? 0) + 160
    )

    const content = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Toneelstuk export</title>
          <style>
            @page { size: A4 portrait; margin: 16mm; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { font-family: Arial, sans-serif; padding: 0; background: #ffffff; color: #1b1c2b; font-size: 12px; }
            h1 { font-size: 17px; margin-bottom: 4px; color: #2a2b5f; }
            h2 { font-size: 10px; margin: 0 0 10px; color: #2a2b5f; text-transform: uppercase; letter-spacing: 0.1em; }
            .meta { font-size: 11px; color: #4b4c6b; margin-bottom: 12px; }
            .grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; }
            .grid--single { grid-template-columns: 1fr; }
            .panel { border: 1px solid #e6e8f3; border-radius: 12px; padding: 12px; background: #f9f9ff; }
            .line { display: grid; grid-template-columns: 32px 100px 1fr; gap: 8px; padding: 6px 6px; border-radius: 8px; margin: 3px 0; }
            .line--action .text { font-style: italic; color: #4b4c6b; }
            .index { font-weight: 700; color: #4a4d85; }
            .speaker { font-weight: 700; letter-spacing: 0.08em; color: #2e2f5c; font-size: 9px; }
            .text { line-height: 1.45; }
            .word { display: inline; padding: 0; margin-right: 0; white-space: nowrap; -webkit-box-decoration-break: clone; box-decoration-break: clone; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .badge { display: inline-block; margin-left: 5px; padding: 1px 6px; font-size: 9px; border-radius: 999px; background: #2a2b5f; color: #fff; }
            .line--section { display: block; font-weight: 700; color: #6b5dd3; width: 100%; }
            .cue-map { position: relative; min-height: ${cueMapHeight}px; }
            .cue-card { position: absolute; left: 0; right: 0; border-radius: 12px; padding: 10px; border: 1px solid #e0e3f4; }
            .cue-title { font-size: 9px; letter-spacing: 0.08em; color: #4b4c6b; text-transform: uppercase; margin-bottom: 4px; }
            .plot-block { margin: 12px 0; }
            .plot-image { width: 100%; max-width: 680px; border: 1px solid #e0e3f4; border-radius: 12px; background: #ffffff; display: block; }
            .plot-empty { font-size: 10px; color: #6a6b8e; }
            .page-break { page-break-before: always; margin-top: 16px; }
            .table { width: 100%; border-collapse: collapse; font-size: 10px; }
            .table th, .table td { border: 1px solid #e0e3f4; padding: 4px 6px; text-align: left; vertical-align: top; }
            .table th { background: #eef1ff; text-transform: uppercase; letter-spacing: 0.08em; font-size: 8px; color: #4b4c6b; }
            .section-title { font-size: 12px; font-weight: 700; margin: 0 0 8px; color: #2a2b5f; }
            .plot-note { font-size: 9px; color: #6a6b8e; margin-top: 6px; }
          </style>
        </head>
        <body>
          <h1>Export toneelstuk</h1>
          <div class="meta"><strong>Groep:</strong> ${selectedPlay}</div>
          <div class="meta"><strong>Leiding:</strong> ${leaderName || '-'} ${leaderPhone ? `(${leaderPhone})` : ''}</div>
          <div class="grid">
            <div class="panel">
              <h2>Personages</h2>
              <table class="table">
                <thead>
                  <tr>
                    <th>Personage</th>
                    <th>Speler</th>
                  </tr>
                </thead>
                <tbody>
                  ${characters
                    .map(
                      (character) => `
                    <tr>
                      <td>${character.name || '-'}</td>
                      <td>${character.person || '-'}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
            <div class="panel">
              <h2>Samenvatting</h2>
              <div>${SUMMARIES[selectedPlay] ?? selectedPlay}</div>
            </div>
          </div>

          <div class="page-break"></div>
          <h2>Script + cues</h2>
          <div class="grid">
            <div class="panel">
              ${lines
                .map((line, index) => {
                  if (line.type === 'sectie') {
                    return `<div class="line line--section">${line.text || `Sectie ${index + 1}`}</div>`
                  }
                  const character = characters.find((item) => item.id === line.characterId)
                  const words = tokenizeText(line.text)
                  const lineKey = `${line.id}:line`
                  const lineMarker = pdfLineMarkers.get(lineKey)
                  const lineMarkerNumbers = lineMarker?.numbers || []
                  const lineMarkerColor = markerColor(lineMarker?.types)
                  return `
                    <div class="line ${line.type === 'actie' ? 'line--action' : ''}" style="background:${lineMarkerColor}">
                      <div class="index">${line.type === 'actie' ? '' : index + 1}${cueBadge(lineMarkerNumbers)}</div>
                      <div class="speaker">${line.type === 'actie' ? '' : character?.name?.toUpperCase() || 'ONBEKEND'}</div>
                      <div class="text">
                        ${
                          words.length
                            ? words
                                .map((word, wordIndex) => {
                                  const marker = pdfWordMarkers.get(line.id)?.[wordIndex]
                                  const markerNumbers = marker?.numbers || []
                                  const color = markerColor(marker?.types)
                                  const hasMarkers = markerNumbers && markerNumbers.length
                                  const wordStyle = hasMarkers
                                    ? `background:${color}; border-radius:6px; padding:1px 4px; color:#1b1c2b; font-weight:700;`
                                    : 'background:transparent;'
                                  return `<span class="word${hasMarkers ? ' word--marked' : ''}" style="${wordStyle}">${word}${hasMarkers ? cueBadge(markerNumbers) : ''}</span>`
                                })
                                .join(' ')
                            : '—'
                        }
                      </div>
                    </div>
                  `
                })
                .join('')}
            </div>
            <div class="panel">
              <h2>Cues</h2>
              <div class="cue-map">
                ${cuePositions
                  .map((cue) => {
                    const bg = {
                      licht: '#d9e8ff',
                      video: '#ead9ff',
                      audio: '#d9fff1',
                      decor: '#ffe8d0'
                    }[cue.type]
                    return `<div class="cue-card" style="top:${cue.top + 16}px; background:${bg};">
                      <div class="cue-title">Cue ${cue.number} · ${cue.type.toUpperCase()}</div>
                      <div>${cue.description || 'Geen beschrijving.'}</div>
                    </div>`
                  })
                  .join('')}
              </div>
            </div>
          </div>

          <div class="page-break"></div>
          <h2>Stageplots</h2>
          ${plotImages
            .map((plot) => {
              const title = plot.section.title || `Sectie ${plot.index + 1}`
              if (!plot.enabled || !plot.image) {
                return `
                  <div class="plot-block">
                    <div class="section-title">${title}</div>
                    <div class="plot-empty">Geen stageplot.</div>
                  </div>
                `
              }
              const height = getPlotCanvasBaseHeight()
              return `
                <div class="plot-block">
                  <div class="section-title">${title}</div>
                  <img class="plot-image" src="${plot.image}" width="680" height="${height}" />
                  <div class="plot-note">Schaal: ${height}px</div>
                </div>
              `
            })
            .join('')}
        </body>
      </html>
    `

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(content)
    win.document.close()
    win.onload = () => {
      win.focus()
      setTimeout(() => win.print(), 200)
    }
  }

  const hasMissingFields = !isReadyToPublish

  return (
    <Box className={styles.export}>
      <Card className={styles['export-card']}>
        <CardContent>
          <Stack spacing={3}>
            <Stack spacing={0.5}>
              <Typography variant="h2">Export</Typography>
              <Typography color="text.secondary">Exporteer het volledige stuk als PDF of JSON.</Typography>
            </Stack>

            <Card variant="outlined" className={styles.summary}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h2">Leiding van de afdeling</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Voornaam"
                      value={leaderContact.firstName}
                      onChange={(event) => setLeaderContact({ firstName: event.target.value })}
                      fullWidth
                      required
                      error={hasMissingFields && leaderContact.firstName.trim().length === 0}
                    />
                    <TextField
                      label="Achternaam"
                      value={leaderContact.lastName}
                      onChange={(event) => setLeaderContact({ lastName: event.target.value })}
                      fullWidth
                      required
                      error={hasMissingFields && leaderContact.lastName.trim().length === 0}
                    />
                  </Stack>
                  <TextField
                    label="Telefoonnummer"
                    value={leaderContact.phone}
                    onChange={(event) => setLeaderContact({ phone: event.target.value })}
                    fullWidth
                    required
                    error={hasMissingFields && leaderContact.phone.trim().length === 0}
                    helperText={
                      hasMissingFields ? 'Vul alle verplichte velden in om te kunnen exporteren.' : ''
                    }
                  />
                  <Typography color="text.secondary">
                    Deze gegevens komen mee in de PDF-export.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Button variant="contained" onClick={exportPdf} disabled={!isReadyToPublish}>
                Exporteer PDF
              </Button>
              <Button
                variant="outlined"
                onClick={exportPlotsPng}
                disabled={!hasEnabledPlots || !isReadyToPublish}
              >
                Exporteer plots (PNG)
              </Button>
              <Button variant="outlined" onClick={exportJson} disabled={!isReadyToPublish}>
                Exporteer JSON
              </Button>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Button variant="text" onClick={() => navigate({ to: '/stageplot' })}>
                Terug naar stageplot
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
