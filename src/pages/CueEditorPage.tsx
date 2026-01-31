import { useMemo } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useNavigate } from '@tanstack/react-router'
import { useAppStore } from '../store/useAppStore'
import { CueModal } from '../components/cues/CueModal'
import { CUE_COLORS } from '../config/cues.config'
import { sortCues } from '../utils/cue'
import type { CueTarget } from '../types/app'
import styles from '../styles/app.module.css'

export const CueEditorPage = () => {
  const navigate = useNavigate()
  const characters = useAppStore((state) => state.characters)
  const lines = useAppStore((state) => state.lines)
  const cues = useAppStore((state) => state.cues)
  const cueModalOpen = useAppStore((state) => state.cueModalOpen)
  const cueType = useAppStore((state) => state.cueType)
  const cueDescription = useAppStore((state) => state.cueDescription)
  const selectedTarget = useAppStore((state) => state.selectedTarget)
  const setSelectedTarget = useAppStore((state) => state.setSelectedTarget)
  const setCueModalOpen = useAppStore((state) => state.setCueModalOpen)
  const setCueType = useAppStore((state) => state.setCueType)
  const setCueDescription = useAppStore((state) => state.setCueDescription)
  const addCue = useAppStore((state) => state.addCue)
  const removeCue = useAppStore((state) => state.removeCue)

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

  const cueMarkers = useMemo(() => {
    const markers = new Map<string, { numbers: number[]; types: Set<string> }>()
    sortedCues.forEach((cue, index) => {
      const key = `${cue.target.lineId}:${cue.target.wordIndex ?? 'line'}`
      if (!markers.has(key)) {
        markers.set(key, { numbers: [], types: new Set() })
      }
      const entry = markers.get(key)
      if (!entry) return
      entry.numbers.push(index + 1)
      entry.types.add(cue.type)
    })
    return markers
  }, [sortedCues])

  const handleSelectTarget = (target: CueTarget) => {
    setSelectedTarget(target)
    setCueModalOpen(true)
  }

  return (
    <Box className={`${styles.editor} ${styles['editor--split']}`}>
      <Box className={styles['cue-left']}>
        <Typography variant="h2">Tekst (read-only)</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Klik op een regelnummer of woord om een cue te plaatsen.
        </Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {lines.map((line, index) => {
            const character = characters.find((item) => item.id === line.characterId)
            const words = line.text ? line.text.split(/\s+/).filter(Boolean) : []

            const lineKey = `${line.id}:line`
            const lineMarker = cueMarkers.get(lineKey)
            const lineMarkerColor =
              lineMarker && lineMarker.types.size > 1
                ? CUE_COLORS.multi
                : lineMarker
                  ? CUE_COLORS[[...lineMarker.types][0] as keyof typeof CUE_COLORS]
                  : 'transparent'
            const isLineSelected =
              selectedTarget?.lineId === line.id && selectedTarget?.wordIndex == null

            if (line.type === 'sectie') {
              return (
                <Box key={line.id} className={`${styles['cue-line']} ${styles['cue-line--section']}`}>
                  <span className={styles['cue-section']}>{line.text || 'Sectie'}</span>
                </Box>
              )
            }

            return (
              <Box
                key={line.id}
                className={styles['cue-line']}
                sx={{
                  backgroundColor: lineMarker ? lineMarkerColor : 'transparent',
                  borderRadius: 1.5,
                  paddingLeft: 1,
                  paddingRight: 1
                }}
              >
                {line.type === 'actie' ? (
                  <span className={`${styles['cue-index']} ${styles['cue-index--empty']}`} />
                ) : (
                  <button
                    type="button"
                    className={`${styles['cue-index']} ${isLineSelected ? styles['cue-selected'] : ''}`}
                    onClick={() =>
                      handleSelectTarget({
                        lineId: line.id,
                        lineIndex: index,
                        wordIndex: null,
                        wordText: null
                      })
                    }
                  >
                    {index + 1}
                    {lineMarker && (
                      <span className={styles['cue-badge']}>{lineMarker.numbers.join(',')}</span>
                    )}
                  </button>
                )}
                {line.type === 'actie' ? (
                  <span className={`${styles['cue-character']} ${styles['cue-character--empty']}`} />
                ) : (
                  <span className={styles['cue-character']}>
                    {character?.name?.toUpperCase() || 'ONBEKEND'}
                  </span>
                )}
                <span className={styles['cue-text']}>
                  {words.length === 0
                    ? '—'
                    : words.map((word, wordIndex) => {
                        const wordKey = `${line.id}:${wordIndex}`
                        const marker = cueMarkers.get(wordKey)
                        const color =
                          marker && marker.types.size > 1
                            ? CUE_COLORS.multi
                            : marker
                              ? CUE_COLORS[[...marker.types][0] as keyof typeof CUE_COLORS]
                              : 'transparent'
                        const isWordSelected =
                          selectedTarget?.lineId === line.id &&
                          selectedTarget?.wordIndex === wordIndex
                        return (
                          <button
                            key={`${line.id}-${wordIndex}`}
                            type="button"
                            className={`${styles['cue-word']} ${
                              isWordSelected ? styles['cue-selected'] : ''
                            }`}
                            onClick={() =>
                              handleSelectTarget({
                                lineId: line.id,
                                lineIndex: index,
                                wordIndex,
                                wordText: word
                              })
                            }
                            style={{ backgroundColor: marker ? color : 'transparent' }}
                          >
                            {word}
                            {marker && (
                              <span className={styles['cue-badge']}>{marker.numbers.join(',')}</span>
                            )}
                          </button>
                        )
                      })}
                </span>
              </Box>
            )
          })}
        </Stack>
      </Box>

      <Box className={styles['cue-right']}>
        <Typography variant="h2">Cues</Typography>
        <Box
          className={styles['cue-map']}
          sx={{
            minHeight: Math.max(
              lines.length * 56 + 220,
              360,
              (cuePositions.at(-1)?.top ?? 0) + 160
            )
          }}
        >
          {cuePositions.length === 0 && (
            <Typography color="text.secondary">Nog geen cues toegevoegd.</Typography>
          )}
          {cuePositions.map((cue) => (
            <Card
              key={cue.id}
              variant="outlined"
              className={`${styles.summary} ${styles['cue-card']} ${styles['cue-card--floating']}`}
              sx={{
                top: cue.top + 28,
                backgroundColor: CUE_COLORS[cue.type] || 'rgba(17, 20, 40, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.18)'
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                  <Stack spacing={0.5}>
                    <Typography variant="overline" color="text.secondary">
                      Cue {cue.number} · {cue.type.toUpperCase()}
                    </Typography>
                    <Typography>{cue.description || 'Geen beschrijving.'}</Typography>
                  </Stack>
                  <IconButton
                    onClick={() => removeCue(cue.id)}
                    className={styles['cue-delete']}
                    aria-label="Verwijder cue"
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button variant="text" onClick={() => navigate({ to: '/script' })}>
            Terug naar schrijven
          </Button>
          <Button variant="contained" onClick={() => navigate({ to: '/stageplot' })}>
            Naar stageplot
          </Button>
        </Stack>
      </Box>

      <CueModal
        open={cueModalOpen}
        cueType={cueType}
        cueDescription={cueDescription}
        disabled={!selectedTarget}
        onClose={() => setCueModalOpen(false)}
        onTypeChange={setCueType}
        onDescriptionChange={setCueDescription}
        onSave={addCue}
      />
    </Box>
  )
}
