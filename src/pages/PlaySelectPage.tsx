import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import {
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography
} from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import { PLAYS } from '../config/plays.config'
import { SUMMARIES } from '../config/summaries.config'
import { STEP_ROUTES } from '../config/steps.config'
import { useAppStore } from '../store/useAppStore'
import { normalizeCueTarget } from '../utils/cue'
import type { Cue, StagePlot } from '../types/app'
import styles from '../styles/app.module.css'

export const PlaySelectPage = () => {
  const navigate = useNavigate()
  const selectedPlay = useAppStore((state) => state.selectedPlay)
  const setSelectedPlay = useAppStore((state) => state.setSelectedPlay)
  const setCharacters = useAppStore((state) => state.setCharacters)
  const setLines = useAppStore((state) => state.setLines)
  const setCues = useAppStore((state) => state.setCues)
  const setLeaderContact = useAppStore((state) => state.setLeaderContact)
  const setStagePlots = useAppStore((state) => state.setStagePlots)
  const lines = useAppStore((state) => state.lines)

  const summary = useMemo(() => SUMMARIES[selectedPlay], [selectedPlay])

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const data = JSON.parse(text)
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
        const lineMap = new Map((importedLines || lines).map((line) => [line.id, line]))
        const lineWords = new Map(
          (importedLines || lines).map((line) => [
            line.id,
            line.text ? line.text.split(/\s+/).filter(Boolean) : []
          ])
        )
        const lineIndex = new Map((importedLines || lines).map((line, index) => [line.id, index]))
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
      if (data.stagePlots && typeof data.stagePlots === 'object') {
        const normalizedPlots = Object.fromEntries(
          Object.entries(data.stagePlots).map(([sectionId, plot]) => {
            const shapes = Array.isArray((plot as StagePlot)?.shapes)
              ? (plot as StagePlot).shapes
              : []
            return [
              sectionId,
              {
                enabled: (plot as StagePlot)?.enabled === true,
                canvas: {
                  width: Number((plot as StagePlot)?.canvas?.width ?? 0),
                  height: Number((plot as StagePlot)?.canvas?.height ?? 0)
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
        setStagePlots(normalizedPlots)
      }
    } catch {
      // ignore invalid import
    }
  }

  return (
    <Card className={styles.card}>
      <CardContent>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary">
              Toneelmaker
            </Typography>
            <Typography variant="h1">Start je toneeltje</Typography>
            <Typography color="text.secondary">
              Kies je groep en ga daarna verder in de editor.
            </Typography>
          </Stack>

          <Stepper activeStep={0} alternativeLabel>
            {STEP_ROUTES.map((step) => (
              <Step key={step.id}>
                <StepLabel>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="play-label">Groep</InputLabel>
              <Select
                labelId="play-label"
                id="play"
                label="Groep"
                value={selectedPlay}
                onChange={(event) => setSelectedPlay(event.target.value as string)}
                sx={{
                  backgroundColor: 'rgba(12, 14, 32, 0.95)'
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: 'rgba(12, 14, 32, 0.98)'
                    }
                  }
                }}
              >
                {PLAYS.map((play) => (
                  <MenuItem key={play.id} value={play.id}>
                    {play.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Card variant="outlined" className={styles.summary}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h2">Korte inhoud</Typography>
                  <Typography color="text.secondary">{summary}</Typography>
                </Stack>
              </CardContent>
            </Card>

            <Button variant="outlined" component="label" sx={{ alignSelf: 'flex-start' }}>
              Importeer JSON
              <input type="file" accept="application/json" hidden onChange={handleImport} />
            </Button>

            <Button
              variant="contained"
              onClick={() => navigate({ to: '/script' })}
              sx={{ alignSelf: 'flex-start' }}
            >
              Naar schrijven
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
