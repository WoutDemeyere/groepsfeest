import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import { useAppStore } from '../store/useAppStore'
import type { ExportPayload, ExportSchemaVersion } from '../types/app'
import { buildPlotPng } from '../utils/plotExport'
import { usePdfExport } from '../hooks/usePdfExport'
import styles from '../styles/app.module.css'

export const ExportPage = () => {
  const navigate = useNavigate()
  const selectedPlay = useAppStore((state) => state.selectedPlay)
  const characters = useAppStore((state) => state.characters)
  const lines = useAppStore((state) => state.lines)
  const cues = useAppStore((state) => state.cues)
  const podiumPlots = useAppStore((state) => state.podiumPlots)
  const podiumPlotLayouts = useAppStore((state) => state.podiumPlotLayouts)
  const podiumPlotDocuments = useAppStore((state) => state.podiumPlotDocuments)
  const podiumPlotNotes = useAppStore((state) => state.podiumPlotNotes)
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
    () => sections.some((section) => podiumPlots[section.id]?.enabled),
    [sections, podiumPlots]
  )

  const exportPdf = usePdfExport({
    selectedPlay,
    characters,
    lines,
    cues,
    sections,
    podiumPlotLayouts,
    podiumPlotDocuments,
    podiumPlotNotes,
    leaderContact
  })

  const [isPdfExporting, setIsPdfExporting] = useState(false)

  const handleExportPdf = async () => {
    if (isPdfExporting) return
    setIsPdfExporting(true)
    try {
      await exportPdf()
    } finally {
      setIsPdfExporting(false)
    }
  }

  const exportJson = () => {
    const payload: ExportPayload = {
      schemaVersion: 2 as ExportSchemaVersion,
      selectedPlay,
      characters,
      lines,
      cues,
      podiumPlots,
      podiumPlotLayouts,
      podiumPlotDocuments,
      podiumPlotNotes,
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
        const plot = podiumPlots[section.id]
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
      link.download = `podiumplot-${selectedPlay}-${safeTitle}.png`
      link.click()
    })
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
              <Button
                variant="contained"
                onClick={handleExportPdf}
                disabled={!isReadyToPublish || isPdfExporting}
                startIcon={isPdfExporting ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {isPdfExporting ? 'PDF wordt opgebouwd...' : 'Exporteer PDF'}
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
              <Button variant="text" onClick={() => navigate({ to: '/podiumplot' })}>
                Terug naar podiumplot
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
