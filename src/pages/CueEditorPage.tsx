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
  const cueFileName = useAppStore((state) => state.cueFileName)
  const selectedTarget = useAppStore((state) => state.selectedTarget)
  const setSelectedTarget = useAppStore((state) => state.setSelectedTarget)
  const setCueModalOpen = useAppStore((state) => state.setCueModalOpen)
  const setCueType = useAppStore((state) => state.setCueType)
  const setCueDescription = useAppStore((state) => state.setCueDescription)
  const setCueFileName = useAppStore((state) => state.setCueFileName)
  const addCue = useAppStore((state) => state.addCue)
  const removeCue = useAppStore((state) => state.removeCue)

  const sortedCues = useMemo(() => sortCues(cues, lines), [cues, lines])

  const cueNumbers = useMemo(
    () => new Map(sortedCues.map((cue, index) => [cue.id, index + 1])),
    [sortedCues]
  )

  const cuesByLine = useMemo(() => {
    const map = new Map<string, typeof sortedCues>()
    sortedCues.forEach((cue) => {
      const list = map.get(cue.target.lineId) ?? []
      list.push(cue)
      map.set(cue.target.lineId, list)
    })
    map.forEach((list) => {
      list.sort((a, b) => (a.target.wordIndex ?? -1) - (b.target.wordIndex ?? -1))
    })
    return map
  }, [sortedCues])

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

  const isCueDisabled = !selectedTarget

  return (
    <Box className={styles.editor}>
      <Typography variant="h2">Tekst & cues</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        Klik op een regelnummer of woord om een cue te plaatsen.
      </Typography>
      {sortedCues.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Nog geen cues toegevoegd.
        </Typography>
      )}
      <Box className={styles['cue-grid']}>
        {lines.map((line, index) => {
          const character = characters.find((item) => item.id === line.characterId)
          const words = line.text ? line.text.split(/\s+/).filter(Boolean) : []
          const lineCues = cuesByLine.get(line.id) ?? []

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
              <Box key={line.id} className={`${styles['cue-row']} ${styles['cue-row--section']}`}>
                <Box className={`${styles['cue-line']} ${styles['cue-line--section']}`}>
                  <span className={styles['cue-section']}>{line.text || 'Sectie'}</span>
                </Box>
              </Box>
            )
          }

          return (
            <Box key={line.id} className={styles['cue-row']}>
              <Box className={styles['cue-row__line']}>
                <Box
                  className={styles['cue-line']}
                  sx={{
                    backgroundColor: lineMarker ? lineMarkerColor : 'transparent',
                    borderRadius: 1.5,
                    paddingLeft: 1,
                    paddingRight: 1
                  }}
                >
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
                                <span className={styles['cue-badge']}>
                                  {marker.numbers.join(',')}
                                </span>
                              )}
                            </button>
                          )
                        })}
                  </span>
                </Box>
              </Box>
              <Box className={styles['cue-row__cues']}>
                {lineCues.map((cue) => (
                  <Card
                    key={cue.id}
                    variant="outlined"
                    className={`${styles.summary} ${styles['cue-card']} ${styles['cue-card--inline']}`}
                    sx={{
                      backgroundColor: CUE_COLORS[cue.type] || 'rgba(17, 20, 40, 0.8)',
                      borderColor: 'rgba(255, 255, 255, 0.18)'
                    }}
                  >
                    <CardContent>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        spacing={2}
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="overline" color="text.secondary">
                            Cue {cueNumbers.get(cue.id)} · {cue.type.toUpperCase()}
                          </Typography>
                          <Typography>{cue.description || 'Geen beschrijving.'}</Typography>
                          {cue.fileName && (
                            <Typography color="text.secondary">Bestand: {cue.fileName}</Typography>
                          )}
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
            </Box>
          )
        })}
      </Box>
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button variant="text" onClick={() => navigate({ to: '/script' })}>
          Terug naar schrijven
        </Button>
        <Button variant="contained" onClick={() => navigate({ to: '/podiumplot' })}>
          Naar podiumplot
        </Button>
      </Stack>

      <CueModal
        open={cueModalOpen}
        cueType={cueType}
        cueDescription={cueDescription}
        cueFileName={cueFileName}
        disabled={isCueDisabled}
        onClose={() => setCueModalOpen(false)}
        onTypeChange={setCueType}
        onDescriptionChange={setCueDescription}
        onFileNameChange={setCueFileName}
        onSave={addCue}
      />
    </Box>
  )
}
