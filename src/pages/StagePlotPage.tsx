import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { PointerEvent } from 'react'
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import { StagePlotSection } from '../components/stage/StagePlotSection'
import { ShapeModal } from '../components/stage/ShapeModal'
import { STAGE_DEPTH_METERS, STAGE_WIDTH_METERS } from '../config/stage.config'
import { useAppStore } from '../store/useAppStore'
import type { StagePlot, StageShape } from '../types/app'
import styles from '../styles/app.module.css'

type DragState = {
  sectionId: string
  shapeId: string
  mode: 'move' | 'resize'
  offsetX?: number
  offsetY?: number
  rect: DOMRect
  startX?: number
  startY?: number
  startSize?: number
}

export const StagePlotPage = () => {
  const navigate = useNavigate()
  const lines = useAppStore((state) => state.lines)
  const stagePlots = useAppStore((state) => state.stagePlots)
  const shapeModalOpen = useAppStore((state) => state.shapeModalOpen)
  const shapeDraft = useAppStore((state) => state.shapeDraft)
  const activeSectionId = useAppStore((state) => state.activeSectionId)
  const editingShapeId = useAppStore((state) => state.editingShapeId)
  const enableStagePlot = useAppStore((state) => state.enableStagePlot)
  const disableStagePlot = useAppStore((state) => state.disableStagePlot)
  const openAddShapeModal = useAppStore((state) => state.openAddShapeModal)
  const openEditShapeModal = useAppStore((state) => state.openEditShapeModal)
  const removeShape = useAppStore((state) => state.removeShape)
  const saveShape = useAppStore((state) => state.saveShape)
  const setShapeDraft = useAppStore((state) => state.setShapeDraft)
  const setShapeModalOpen = useAppStore((state) => state.setShapeModalOpen)
  const setEditingShapeId = useAppStore((state) => state.setEditingShapeId)
  const updateStagePlots = useAppStore((state) => state.updateStagePlots)
  const updatePlotCanvasSize = useAppStore((state) => state.updatePlotCanvasSize)

  const dragStateRef = useRef<DragState | null>(null)

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

  const stageWidthTicks = useMemo(
    () => Array.from({ length: STAGE_WIDTH_METERS + 1 }, (_, index) => index - STAGE_WIDTH_METERS / 2),
    []
  )
  const stageDepthTicks = useMemo(
    () => Array.from({ length: STAGE_DEPTH_METERS + 1 }, (_, index) => index),
    []
  )

  useEffect(() => {
    updateStagePlots((prev) => {
      let changed = false
      const next: Record<string, StagePlot> = {}
      sections.forEach((section) => {
        if (prev[section.id]) {
          next[section.id] = prev[section.id]
        } else {
          next[section.id] = { enabled: false, shapes: [] }
          changed = true
        }
      })
      if (Object.keys(prev).length !== sections.length) {
        changed = true
      }
      return changed ? next : prev
    })
  }, [sections, updateStagePlots])

  const handleShapePointerMove = useCallback((event: PointerEvent) => {
    const dragState = dragStateRef.current
    if (!dragState) return
    const { sectionId, shapeId, mode, offsetX, offsetY, rect, startX, startY, startSize } = dragState
    updateStagePlots((prev) => {
      const section = prev[sectionId]
      if (!section) return prev
      const shapes = section.shapes.map((shape) => {
        if (shape.id !== shapeId) return shape
        if (mode === 'resize') {
          const delta = Math.max((event.clientX ?? 0) - (startX ?? 0), (event.clientY ?? 0) - (startY ?? 0))
          let nextSize = Math.max(30, Math.min(360, (startSize ?? 70) + delta))
          const maxSizeX = rect.width - shape.x
          const maxSizeY = rect.height - shape.y
          nextSize = Math.min(nextSize, maxSizeX, maxSizeY)
          return { ...shape, size: nextSize }
        }
        const rawX = (event.clientX ?? 0) - rect.left - (offsetX ?? 0)
        const rawY = (event.clientY ?? 0) - rect.top - (offsetY ?? 0)
        const maxX = Math.max(0, rect.width - shape.size)
        const maxY = Math.max(0, rect.height - shape.size)
        const x = Math.min(maxX, Math.max(0, rawX))
        const y = Math.min(maxY, Math.max(0, rawY))
        return { ...shape, x, y }
      })
      return {
        ...prev,
        [sectionId]: {
          ...section,
          shapes
        }
      }
    })
  }, [updateStagePlots])

  const endShapeDrag = useCallback(() => {
    dragStateRef.current = null
    window.removeEventListener('pointermove', handleShapePointerMove)
    window.removeEventListener('pointerup', endShapeDrag)
  }, [handleShapePointerMove])

  const startShapeMove = (event: PointerEvent<HTMLDivElement>, sectionId: string, shape: StageShape) => {
    if (event.button !== 0) return
    const canvas = event.currentTarget.closest('.plot-canvas')
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    updatePlotCanvasSize(sectionId, rect)
    event.preventDefault()
    event.stopPropagation()
    dragStateRef.current = {
      sectionId,
      shapeId: shape.id,
      mode: 'move',
      offsetX: event.clientX - rect.left - shape.x,
      offsetY: event.clientY - rect.top - shape.y,
      rect
    }
    window.addEventListener('pointermove', handleShapePointerMove)
    window.addEventListener('pointerup', endShapeDrag)
  }

  const startShapeResize = (
    event: PointerEvent<HTMLButtonElement>,
    sectionId: string,
    shape: StageShape
  ) => {
    const canvas = event.currentTarget.closest('.plot-canvas')
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    updatePlotCanvasSize(sectionId, rect)
    event.preventDefault()
    event.stopPropagation()
    dragStateRef.current = {
      sectionId,
      shapeId: shape.id,
      mode: 'resize',
      rect,
      startX: event.clientX,
      startY: event.clientY,
      startSize: shape.size ?? 70
    }
    window.addEventListener('pointermove', handleShapePointerMove)
    window.addEventListener('pointerup', endShapeDrag)
  }

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handleShapePointerMove)
      window.removeEventListener('pointerup', endShapeDrag)
    }
  }, [handleShapePointerMove, endShapeDrag])

  return (
    <Box className={styles.editor}>
      <Stack spacing={2}>
        <Typography variant="h2">Stageplot per sectie</Typography>
        <Typography color="text.secondary">
          Maak per sectie een stageplot met vormen die je kan slepen en schalen.
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
          <Stack spacing={2}>
            {sections.map((section, index) => (
              <StagePlotSection
                key={section.id}
                section={section}
                index={index}
                plot={stagePlots[section.id]}
                stageWidthTicks={stageWidthTicks}
                stageDepthTicks={stageDepthTicks}
                onEnable={enableStagePlot}
                onDisable={disableStagePlot}
                onAddShape={openAddShapeModal}
                onEditShape={openEditShapeModal}
                onRemoveShape={removeShape}
                onStartMove={startShapeMove}
                onStartResize={startShapeResize}
              />
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

      <ShapeModal
        open={shapeModalOpen}
        draft={shapeDraft}
        isEditing={Boolean(editingShapeId)}
        onClose={() => {
          setShapeModalOpen(false)
          setEditingShapeId(null)
        }}
        onDelete={
          editingShapeId && activeSectionId
            ? () => {
                removeShape(activeSectionId, editingShapeId)
                setShapeModalOpen(false)
                setEditingShapeId(null)
              }
            : undefined
        }
        onSave={saveShape}
        onDraftChange={setShapeDraft}
      />
    </Box>
  )
}
