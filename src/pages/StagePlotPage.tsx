import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { ComponentProps } from 'react'
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import type { TLCameraOptions, TLEditorSnapshot } from 'tldraw'
import { Tldraw, createShapeId, toRichText } from 'tldraw'
import { useAppStore } from '../store/useAppStore'
import styles from '../styles/app.module.css'

const STAGE_RATIO = 12 / 9.5
const STAGE_WIDTH = 1080
const STAGE_HEIGHT = STAGE_WIDTH / STAGE_RATIO
const CANVAS_PADDING = 24
const STAGE_X = CANVAS_PADDING
const STAGE_Y = CANVAS_PADDING
const STAGE_LABEL_OFFSET = 28
const NOTES_WIDTH = 350
const CANVAS_WIDTH = STAGE_WIDTH + CANVAS_PADDING * 2
const CANVAS_HEIGHT = STAGE_HEIGHT + STAGE_LABEL_OFFSET + 64

export const StagePlotPage = () => {
  const navigate = useNavigate()
  const lines = useAppStore((state) => state.lines)
  const stagePlotLayouts = useAppStore((state) => state.stagePlotLayouts)
  const stagePlotDocuments = useAppStore((state) => state.stagePlotDocuments)
  const stagePlotNotes = useAppStore((state) => state.stagePlotNotes)
  const ensureStagePlotSections = useAppStore((state) => state.ensureStagePlotSections)
  const addStagePlot = useAppStore((state) => state.addStagePlot)
  const setStagePlotDocument = useAppStore((state) => state.setStagePlotDocument)
  const setStagePlotNote = useAppStore((state) => state.setStagePlotNote)
  const initialSnapshotsRef = useRef<Record<string, TLEditorSnapshot | undefined>>({})

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

  useEffect(() => {
    ensureStagePlotSections(sections.map((section) => section.id))
  }, [ensureStagePlotSections, sections])

  const cameraOptions = useMemo<TLCameraOptions>(
    () => ({
      isLocked: false,
      panSpeed: 1,
      zoomSpeed: 1,
      zoomSteps: [0.5, 0.75, 1, 1.25, 1.5, 2],
      wheelBehavior: 'zoom',
      constraints: {
        bounds: {
          x: STAGE_X,
          y: STAGE_Y,
          w: STAGE_WIDTH,
          h: STAGE_HEIGHT + STAGE_LABEL_OFFSET + 40
        },
        padding: { x: 40, y: 40 },
        origin: { x: 0.5, y: 0.5 },
        initialZoom: 'fit-min-100',
        baseZoom: 'fit-min-100',
        behavior: 'inside'
      }
    }),
    []
  )

  const ensureStageShapes = useCallback(
    (editor: Parameters<NonNullable<ComponentProps<typeof Tldraw>['onMount']>>[0]) => {
      const shapes = editor.getCurrentPageShapes()
      const hasStage = shapes.some((shape) => shape.meta?.role === 'stage')
      const hasAudience = shapes.some((shape) => shape.meta?.role === 'audience-label')

      if (!hasStage) {
        const stageId = createShapeId('stage')
        editor.createShapes([
          {
            id: stageId,
            type: 'geo',
            x: STAGE_X,
            y: STAGE_Y,
            isLocked: true,
            props: {
              geo: 'rectangle',
              w: STAGE_WIDTH,
              h: STAGE_HEIGHT,
              richText: toRichText('')
            },
            meta: { role: 'stage' }
          }
        ])
      } else {
        const stageShape = shapes.find((shape) => shape.meta?.role === 'stage')
        if (stageShape && !stageShape.isLocked) {
          editor.updateShapes([{ id: stageShape.id, type: stageShape.type, isLocked: true }])
        }
      }

      if (!hasAudience) {
        const audienceId = createShapeId('audience')
        editor.createShapes([
          {
            id: audienceId,
            type: 'text',
            x: STAGE_X + STAGE_WIDTH / 2 - 70,
            y: STAGE_Y + STAGE_HEIGHT + STAGE_LABEL_OFFSET,
            isLocked: true,
            props: {
              richText: toRichText('PUBLIEK')
            },
            meta: { role: 'audience-label' }
          }
        ])
      } else {
        const audienceShape = shapes.find((shape) => shape.meta?.role === 'audience-label')
        if (audienceShape && !audienceShape.isLocked) {
          editor.updateShapes([{ id: audienceShape.id, type: audienceShape.type, isLocked: true }])
        }
      }
    },
    []
  )

  const handleMount = useCallback(
    (plotId: string) =>
      (editor: Parameters<NonNullable<ComponentProps<typeof Tldraw>['onMount']>>[0]) => {
        ensureStageShapes(editor)
        editor.setCameraOptions(cameraOptions)
        editor.zoomToBounds(
          {
            x: STAGE_X,
            y: STAGE_Y,
            w: STAGE_WIDTH,
            h: STAGE_HEIGHT + STAGE_LABEL_OFFSET + 40
          },
          { immediate: true, targetZoom: 0.72, inset: 0 }
        )
        setStagePlotDocument(plotId, editor.getSnapshot() as TLEditorSnapshot)

        const handleChange = () => {
          const snapshot = editor.getSnapshot()
          setStagePlotDocument(plotId, snapshot as TLEditorSnapshot)
        }

        editor.on('change', handleChange)
        return () => {
          editor.off('change', handleChange)
        }
      },
    [cameraOptions, ensureStageShapes, setStagePlotDocument]
  )

  return (
    <Box className={styles.editor}>
      <Stack spacing={3}>
        <Typography variant="h2">Stageplot per sectie</Typography>
        <Typography color="text.secondary">
          Gebruik het canvas om vrij je stageplot te schetsen. Opslaan per sectie volgt hierna.
        </Typography>

        {sections.length === 0 ? (
          <Card variant="outlined" className={styles.summary}>
            <CardContent>
              <Typography color="text.secondary">
                Voeg eerst secties toe in stap 2 (type = sectie) om hier plots te maken.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={4}>
            {sections.map((section) => (
              <Card
                key={section.id}
                className={styles['stageplot-section']}
                sx={{ alignSelf: 'flex-start' }}
              >
                <CardContent className={styles['stageplot-section__content']}>
                  <Stack spacing={3}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      alignItems={{ md: 'center' }}
                      justifyContent="space-between"
                      gap={3}
                    >
                      <Stack spacing={0.5}>
                        <Typography variant="h2">{section.title}</Typography>
                        <Typography color="text.secondary">Maak meerdere plots voor deze sectie.</Typography>
                      </Stack>
                      <Button variant="outlined" onClick={() => addStagePlot(section.id)}>
                        Plot toevoegen
                      </Button>
                    </Stack>

                    <Stack spacing={3}>
                      {(stagePlotLayouts[section.id] ?? []).map((plotId, index) => {
                        if (!initialSnapshotsRef.current[plotId]) {
                          initialSnapshotsRef.current[plotId] = stagePlotDocuments[plotId]
                        }
                        const initialSnapshot = initialSnapshotsRef.current[plotId]

                        return (
                        <Card
                          key={plotId}
                          className={styles['tldraw-card']}
                          sx={{ width: { xs: '100%', lg: '100%' } }}
                        >
                          <CardContent className={styles['tldraw-card__content']} sx={{ p: 0 }}>
                            <div className={styles['tldraw-header']}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Plot {index + 1}
                              </Typography>
                            </div>
                            <div className={styles['tldraw-layout']}>
                              <div className={styles['tldraw-notes']}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Notities
                                </Typography>
                                <TextField
                                  value={stagePlotNotes[plotId] ?? ''}
                                  onChange={(event) => setStagePlotNote(plotId, event.target.value)}
                                  multiline
                                  minRows={10}
                                  placeholder="Schrijf je notities voor deze plot..."
                                  fullWidth
                                />
                              </div>
                              <div
                                className={styles['tldraw-canvas']}
                                style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
                              >
                                <Tldraw
                                  onMount={handleMount(plotId)}
                                  snapshot={initialSnapshot}
                                  cameraOptions={cameraOptions}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )})}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        <Stack direction="row" spacing={2}>
          <Button variant="text" onClick={() => navigate({ to: '/cues' })}>
            Terug naar cues
          </Button>
          <Button variant="contained" onClick={() => navigate({ to: '/export' })}>
            Naar export
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
