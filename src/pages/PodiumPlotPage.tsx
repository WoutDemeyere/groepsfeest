import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentProps } from 'react'
import { Box, Button, Card, CardContent, IconButton, Stack, TextField, Typography } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import { useNavigate } from '@tanstack/react-router'
import type { Editor, TLCameraOptions, TLEditorSnapshot } from 'tldraw'
import { Tldraw, createShapeId, toRichText } from 'tldraw'
import { useAppStore } from '../store/useAppStore'
import styles from '../styles/app.module.css'

const STAGE_RATIO = 12 / 9.5
const STAGE_WIDTH = 864
const STAGE_HEIGHT = STAGE_WIDTH / STAGE_RATIO
const CANVAS_PADDING = 24
const STAGE_X = CANVAS_PADDING
const STAGE_Y = CANVAS_PADDING
const STAGE_LABEL_OFFSET = 28
const NOTES_WIDTH = 350
const CANVAS_WIDTH = STAGE_WIDTH + CANVAS_PADDING * 2
const CANVAS_HEIGHT = STAGE_HEIGHT + STAGE_LABEL_OFFSET + 64

export const PodiumPlotPage = () => {
  const navigate = useNavigate()
  const tldrawLicenseKey = import.meta.env.VITE_TLDRAW_LICENSE_KEY
  const lines = useAppStore((state) => state.lines)
  const podiumPlotLayouts = useAppStore((state) => state.podiumPlotLayouts)
  const podiumPlotDocuments = useAppStore((state) => state.podiumPlotDocuments)
  const podiumPlotDocumentsVersion = useAppStore((state) => state.podiumPlotDocumentsVersion)
  const podiumPlotNotes = useAppStore((state) => state.podiumPlotNotes)
  const podiumPlotClipboard = useAppStore((state) => state.podiumPlotClipboard)
  const ensurePodiumPlotSections = useAppStore((state) => state.ensurePodiumPlotSections)
  const addPodiumPlot = useAppStore((state) => state.addPodiumPlot)
  const removePodiumPlot = useAppStore((state) => state.removePodiumPlot)
  const setPodiumPlotDocument = useAppStore((state) => state.setPodiumPlotDocument)
  const setPodiumPlotNote = useAppStore((state) => state.setPodiumPlotNote)
  const setPodiumPlotClipboard = useAppStore((state) => state.setPodiumPlotClipboard)
  const editorsRef = useRef<Map<string, Editor>>(new Map())
  const [visiblePlots, setVisiblePlots] = useState<Record<string, boolean>>({})

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

  const mountedPlotIds = useMemo(() => {
    const ordered: string[] = []
    Object.values(podiumPlotLayouts).forEach((plots) => {
      plots.forEach((plotId) => {
        if (visiblePlots[plotId]) ordered.push(plotId)
      })
    })
    return new Set(ordered.slice(0, 2))
  }, [podiumPlotLayouts, visiblePlots])

  useEffect(() => {
    ensurePodiumPlotSections(sections.map((section) => section.id))
  }, [ensurePodiumPlotSections, sections])

  useEffect(() => {
    const next: Record<string, boolean> = {}
    const allPlotIds: string[] = []
    Object.values(podiumPlotLayouts).forEach((plots) => {
      plots.forEach((plotId) => {
        next[plotId] = visiblePlots[plotId] ?? false
        allPlotIds.push(plotId)
      })
    })
    if (Object.keys(visiblePlots).length === 0) {
      allPlotIds.slice(0, 2).forEach((plotId) => {
        next[plotId] = true
      })
    }
    setVisiblePlots(next)

    const observer = new IntersectionObserver(
      (entries) => {
        setVisiblePlots((prev) => {
          const updated = { ...prev }
          entries.forEach((entry) => {
            const id = entry.target.getAttribute('data-plot-id')
            if (!id) return
            updated[id] = entry.isIntersecting
          })
          return updated
        })
      },
      { rootMargin: '200px 0px' }
    )

    const elements = Array.from(document.querySelectorAll('[data-plot-id]'))
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [podiumPlotLayouts])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const anchor = target.closest('a') as HTMLAnchorElement | null
      if (!anchor) return
      if (!anchor.getAttribute('href')?.startsWith('#')) return
      if (!anchor.closest(`.${styles['tldraw-canvas']}`)) return
      event.preventDefault()
      event.stopPropagation()
    }

    let lastScrollY = 0
    let shouldRestoreScroll = false
    let restoreTimeout: number | null = null
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (!target.closest(`.${styles['tldraw-canvas']}`)) return
      lastScrollY = window.scrollY
      shouldRestoreScroll = true
      if (restoreTimeout) {
        window.clearTimeout(restoreTimeout)
      }
      restoreTimeout = window.setTimeout(() => {
        shouldRestoreScroll = false
      }, 250)
    }

    const handleHashChange = () => {
      if (!window.location.hash) return
      const url = window.location.href.replace(window.location.hash, '')
      window.history.replaceState(null, '', url)
      window.scrollTo({ top: lastScrollY })
    }

    const handleScroll = () => {
      if (!shouldRestoreScroll) return
      if (Math.abs(window.scrollY - lastScrollY) < 2) return
      window.scrollTo({ top: lastScrollY })
    }

    const originalScrollIntoView = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = function (...args) {
      const el = this as HTMLElement
      if (
        el.closest(`.${styles['tldraw-canvas']}`) ||
        el.closest('.tlui') ||
        el.closest('.tldraw')
      ) {
        return
      }
      return originalScrollIntoView.apply(this, args as unknown as Parameters<Element['scrollIntoView']>)
    }

    document.addEventListener('click', handleClick, true)
    document.addEventListener('pointerdown', handlePointerDown, true)
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('pointerdown', handlePointerDown, true)
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('scroll', handleScroll)
      if (restoreTimeout) {
        window.clearTimeout(restoreTimeout)
      }
      Element.prototype.scrollIntoView = originalScrollIntoView
    }
  }, [])

  const cameraOptions = useMemo<TLCameraOptions>(
    () => ({
      isLocked: false,
      panSpeed: 1,
      zoomSpeed: 1,
      zoomSteps: [0.72],
      wheelBehavior: 'none',
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

  const latestDocumentsRef = useRef(podiumPlotDocuments)
  useEffect(() => {
    latestDocumentsRef.current = podiumPlotDocuments
  }, [podiumPlotDocuments])

  const lastAppliedVersionRef = useRef<string>('')

  useEffect(() => {
    if (!podiumPlotDocumentsVersion) return
    if (lastAppliedVersionRef.current === podiumPlotDocumentsVersion) return
    lastAppliedVersionRef.current = podiumPlotDocumentsVersion
    Object.entries(latestDocumentsRef.current).forEach(([plotId, snapshot]) => {
      const editor = editorsRef.current.get(plotId)
      if (!editor || !snapshot) return
      editor.loadSnapshot(snapshot as TLEditorSnapshot)
      ensureStageShapes(editor)
      editor.zoomToBounds(
        {
          x: STAGE_X,
          y: STAGE_Y,
          w: STAGE_WIDTH,
          h: STAGE_HEIGHT + STAGE_LABEL_OFFSET + 40
        },
        { immediate: true, targetZoom: 0.72, inset: 0 }
      )
    })
  }, [ensureStageShapes, podiumPlotDocumentsVersion])

  const handleMount = useCallback(
    (plotId: string) =>
      (editor: Parameters<NonNullable<ComponentProps<typeof Tldraw>['onMount']>>[0]) => {
        const snapshot = latestDocumentsRef.current[plotId]
        if (snapshot) {
          editor.loadSnapshot(snapshot as TLEditorSnapshot)
        }
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
        setPodiumPlotDocument(plotId, editor.getSnapshot() as TLEditorSnapshot)

        editorsRef.current.set(plotId, editor)
        let debounceTimer: ReturnType<typeof setTimeout> | null = null
        const handleChange = () => {
          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => {
            const snapshot = editor.getSnapshot()
            setPodiumPlotDocument(plotId, snapshot as TLEditorSnapshot)
          }, 500)
        }

        editor.on('change', handleChange)
        return () => {
          if (debounceTimer) clearTimeout(debounceTimer)
          const snapshot = editor.getSnapshot()
          setPodiumPlotDocument(plotId, snapshot as TLEditorSnapshot)
          editor.off('change', handleChange)
          editorsRef.current.delete(plotId)
          if (typeof editor.dispose === 'function') {
            editor.dispose()
          } else if (typeof (editor as { destroy?: () => void }).destroy === 'function') {
            editor.destroy?.()
          }
        }
      },
    [cameraOptions, ensureStageShapes, setPodiumPlotDocument]
  )

  const handleCopyPlot = (plotId: string) => {
    const editor = editorsRef.current.get(plotId)
    if (!editor) return
    const selection = Array.from(editor.getSelectedShapeIds())
    if (!selection.length) return
    const content = editor.getContentFromCurrentPage(selection)
    if (!content) return
    setPodiumPlotClipboard(content)
  }

  const handlePastePlot = async (plotId: string) => {
    const editor = editorsRef.current.get(plotId)
    if (!editor || !podiumPlotClipboard) return
    const resolved = await editor.resolveAssetsInContent(podiumPlotClipboard)
    if (!resolved) return
    editor.putContentOntoCurrentPage(resolved, { preservePosition: true, select: true })
  }

  return (
    <Box className={styles.editor}>
      <Stack spacing={3}>
        <Typography variant="h2">Podiumplot per sectie</Typography>
        <Typography color="text.secondary">
          Gebruik het canvas om vrij je podiumplot te schetsen. Opslaan per sectie volgt hierna.
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
                className={styles['podiumplot-section']}
                sx={{ alignSelf: 'flex-start' }}
              >
                <CardContent className={styles['podiumplot-section__content']}>
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
                      <Button variant="outlined" onClick={() => addPodiumPlot(section.id)}>
                        Plot toevoegen
                      </Button>
                    </Stack>

                    <Stack spacing={3}>
                      {(podiumPlotLayouts[section.id] ?? []).map((plotId, index) => {
                        return (
                        <Card
                          key={plotId}
                          className={styles['tldraw-card']}
                          sx={{ width: { xs: '100%', lg: '100%' } }}
                        >
                          <CardContent className={styles['tldraw-card__content']} sx={{ p: 0 }}>
                            <div className={styles['tldraw-header']}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle2" color="text.secondary">
                                  Plot {index + 1}
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopyPlot(plotId)}
                                    aria-label="Kopieer selectie"
                                  >
                                    <ContentCopyIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handlePastePlot(plotId)}
                                    disabled={!podiumPlotClipboard}
                                    aria-label="Plak selectie"
                                  >
                                    <ContentPasteIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => removePodiumPlot(section.id, plotId)}
                                    disabled={(podiumPlotLayouts[section.id] ?? []).length <= 1}
                                    aria-label="Verwijder plot"
                                  >
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              </Stack>
                            </div>
                            <div className={styles['tldraw-layout']}>
                              <div className={styles['tldraw-notes']}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Notities
                                </Typography>
                                <TextField
                                  value={podiumPlotNotes[plotId] ?? ''}
                                  onChange={(event) => setPodiumPlotNote(plotId, event.target.value)}
                                  multiline
                                  minRows={10}
                                  placeholder="Schrijf je notities voor deze plot..."
                                  fullWidth
                                />
                              </div>
                              <div
                                className={styles['tldraw-canvas']}
                                style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
                                data-plot-id={plotId}
                              >
                                {mountedPlotIds.has(plotId) ? (
                                  <Tldraw
                                    onMount={handleMount(plotId)}
                                    cameraOptions={cameraOptions}
                                    licenseKey={tldrawLicenseKey}
                                  />
                                ) : (
                                  <div style={{ width: '100%', height: '100%' }} />
                                )}
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
