import { PLOT_CANVAS_BASE_WIDTH, STAGE_DEPTH_METERS, STAGE_WIDTH_METERS } from '../config/stage.config'
import type { StagePlot } from '../types/app'

const PLOT_CANVAS_BASE_HEIGHT = Math.round(
  (PLOT_CANVAS_BASE_WIDTH * STAGE_DEPTH_METERS) / STAGE_WIDTH_METERS
)

export const buildPlotPng = (plot?: StagePlot) => {
  const canvasWidth = Number(plot?.canvas?.width) || PLOT_CANVAS_BASE_WIDTH
  const canvasHeight = Number(plot?.canvas?.height) || PLOT_CANVAS_BASE_HEIGHT
  const scaleX = PLOT_CANVAS_BASE_WIDTH / canvasWidth
  const scaleY = PLOT_CANVAS_BASE_HEIGHT / canvasHeight
  const canvas = document.createElement('canvas')
  canvas.width = PLOT_CANVAS_BASE_WIDTH
  canvas.height = PLOT_CANVAS_BASE_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const grid = { left: 45, right: 18, top: 32, bottom: 32 }
  const gridWidth = canvas.width - grid.left - grid.right
  const gridHeight = canvas.height - grid.top - grid.bottom

  ctx.strokeStyle = '#e1e5f2'
  ctx.lineWidth = 1
  for (let i = 0; i <= STAGE_WIDTH_METERS; i += 1) {
    const x = grid.left + (gridWidth / STAGE_WIDTH_METERS) * i
    ctx.beginPath()
    ctx.moveTo(x, grid.top)
    ctx.lineTo(x, grid.top + gridHeight)
    ctx.stroke()
  }
  for (let i = 0; i <= STAGE_DEPTH_METERS; i += 1) {
    const y = grid.top + (gridHeight / STAGE_DEPTH_METERS) * i
    ctx.beginPath()
    ctx.moveTo(grid.left, y)
    ctx.lineTo(grid.left + gridWidth, y)
    ctx.stroke()
  }

  ctx.strokeStyle = '#c9cfe6'
  ctx.lineWidth = 2
  ctx.strokeRect(grid.left, grid.top, gridWidth, gridHeight)

  ctx.fillStyle = '#3a3f63'
  ctx.font = 'bold 12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('PODIUM', canvas.width / 2, grid.top - 10)
  ctx.fillText('PUBLIEK', canvas.width / 2, grid.top + gridHeight + 18)

  const shapes = Array.isArray(plot?.shapes) ? plot.shapes : []
  shapes.forEach((shape) => {
    const rawSize = Number(shape?.size ?? 70)
    const size = Math.max(12, rawSize * ((scaleX + scaleY) / 2))
    const x = Number(shape?.x ?? 0) * scaleX
    const y = Number(shape?.y ?? 0) * scaleY
    const fill = shape?.label === 'decor' ? '#f3d2a6' : '#cfe5ff'
    const stroke = shape?.label === 'decor' ? '#c79b5f' : '#6f96d8'

    ctx.fillStyle = fill
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2

    if (shape?.kind === 'square') {
      ctx.beginPath()
      ctx.rect(x, y, size, size)
      ctx.fill()
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }

    ctx.fillStyle = '#1b1c2b'
    ctx.font = 'bold 11px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const title = shape?.name || 'Object'
    ctx.fillText(title, x + size / 2, y + size / 2 - 6)
    ctx.font = '10px Arial'
    ctx.fillText(shape?.label || '', x + size / 2, y + size / 2 + 8)
  })

  return canvas.toDataURL('image/png')
}

export const getPlotCanvasBaseHeight = () => PLOT_CANVAS_BASE_HEIGHT
