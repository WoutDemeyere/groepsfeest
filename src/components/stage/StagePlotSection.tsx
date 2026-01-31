import type { PointerEvent } from 'react'
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import type { PodiumPlot, StageShape } from '../../types/app'
import { STAGE_DEPTH_METERS, STAGE_WIDTH_METERS } from '../../config/stage.config'
import styles from '../../styles/app.module.css'

type PodiumPlotSectionProps = {
  section: { id: string; title: string }
  index: number
  plot?: PodiumPlot
  stageWidthTicks: number[]
  stageDepthTicks: number[]
  onEnable: (sectionId: string) => void
  onDisable: (sectionId: string) => void
  onAddShape: (sectionId: string, kind: 'circle' | 'square') => void
  onEditShape: (sectionId: string, shape: StageShape) => void
  onRemoveShape: (sectionId: string, shapeId: string) => void
  onStartMove: (event: PointerEvent<HTMLDivElement>, sectionId: string, shape: StageShape) => void
  onStartResize: (event: PointerEvent<HTMLButtonElement>, sectionId: string, shape: StageShape) => void
}

export const PodiumPlotSection = ({
  section,
  index,
  plot,
  stageWidthTicks,
  stageDepthTicks,
  onEnable,
  onDisable,
  onAddShape,
  onEditShape,
  onRemoveShape,
  onStartMove,
  onStartResize
}: PodiumPlotSectionProps) => {
  const enabled = plot?.enabled
  const shapes = plot?.shapes ?? []

  return (
    <Card key={section.id} variant="outlined" className={styles['plot-section']}>
      <CardContent>
        <Stack spacing={2}>
          {!enabled ? (
            <Box className={styles['plot-disabled']}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
              >
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Sectie {index + 1}
                  </Typography>
                  <Typography variant="h2">{section.title}</Typography>
                </Box>
                <Button size="small" variant="contained" onClick={() => onEnable(section.id)}>
                  Maak podiumplot
                </Button>
              </Stack>
              <Typography color="text.secondary">Nog geen podiumplot voor deze sectie.</Typography>
            </Box>
          ) : (
            <Box className={styles['plot-layout']}>
              <Box className={styles['plot-sidebar']}>
                <Typography variant="overline" color="text.secondary">
                  Sectie {index + 1}
                </Typography>
                <Typography variant="h2">{section.title}</Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => onAddShape(section.id, 'circle')}
                    >
                      Cirkel toevoegen
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => onAddShape(section.id, 'square')}
                    >
                      Vierkant toevoegen
                    </Button>
                  </Stack>
                  <Typography className={styles['plot-help']} color="text.secondary">
                    Sleep vormen om te verplaatsen. Gebruik de hoek om te schalen.
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onDisable(section.id)}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Verberg plot
                  </Button>
                </Stack>
              </Box>
              <Box className={styles['plot-center']}>
                <Box
                  className={styles['plot-canvas']}
                  style={{
                    '--plot-cols': STAGE_WIDTH_METERS + 1,
                    '--plot-rows': STAGE_DEPTH_METERS + 1,
                    '--plot-grid-cols': STAGE_WIDTH_METERS,
                    '--plot-grid-rows': STAGE_DEPTH_METERS
                  } as React.CSSProperties}
                >
                  <div className={`${styles['plot-axis']} ${styles['plot-axis--top']}`}>
                    {stageWidthTicks.map((tick) => (
                      <span
                        key={`top-${tick}`}
                        className={`${styles['plot-axis__tick']} ${tick === 0 ? styles['is-zero'] : ''}`}
                      >
                        {tick}m
                      </span>
                    ))}
                  </div>
                  <div className={`${styles['plot-axis']} ${styles['plot-axis--bottom']}`}>
                    {stageWidthTicks.map((tick) => (
                      <span
                        key={`bottom-${tick}`}
                        className={`${styles['plot-axis__tick']} ${tick === 0 ? styles['is-zero'] : ''}`}
                      >
                        {tick}m
                      </span>
                    ))}
                  </div>
                  <div className={`${styles['plot-axis']} ${styles['plot-axis--left']}`}>
                    {stageDepthTicks.map((tick) => (
                      <span key={`left-${tick}`} className={styles['plot-axis__tick']}>
                        {tick}m
                      </span>
                    ))}
                  </div>
                  <div className={styles['plot-canvas__label']}>PODIUM</div>
                  <div className={styles['plot-canvas__grid']} />
                  {shapes.map((shape) => (
                    <div
                      key={shape.id}
                      className={`${styles['plot-shape']} ${styles[`plot-shape--${shape.kind}`]} ${styles[`plot-shape--${shape.label}`]}`}
                      style={{
                        left: shape.x,
                        top: shape.y,
                        width: shape.size,
                        height: shape.size
                      }}
                      onPointerDown={(event) => onStartMove(event, section.id, shape)}
                      onDoubleClick={() => onEditShape(section.id, shape)}
                    >
                      <div className={styles['plot-shape__title']}>{shape.name || 'Object'}</div>
                      <div className={styles['plot-shape__label']}>{shape.label}</div>
                      <button
                        type="button"
                        className={styles['plot-resize-handle']}
                        onPointerDown={(event) => onStartResize(event, section.id, shape)}
                        aria-label="Vorm schalen"
                      />
                    </div>
                  ))}
                </Box>
                <div className={styles['plot-canvas__audience']}>PUBLIEK</div>
              </Box>
              <Box className={styles['plot-list-panel']}>
                <Typography variant="overline" color="text.secondary">
                  Vormen
                </Typography>
                {shapes.length === 0 ? (
                  <Typography color="text.secondary">Nog geen vormen geplaatst.</Typography>
                ) : (
                  <Stack spacing={1.5} className={styles['plot-list']}>
                    {shapes.map((shape) => (
                      <Box key={shape.id} className={styles['plot-list-item']}>
                        <Box className={styles['plot-list-info']}>
                          <Typography className={styles['plot-list-title']}>{shape.name || 'Object'}</Typography>
                          <Typography className={styles['plot-list-desc']} color="text.secondary">
                            {shape.description || '-'}
                          </Typography>
                          <Typography className={styles['plot-list-meta']} color="text.secondary">
                            {shape.label}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} className={styles['plot-list-actions']}>
                          <Button size="small" variant="text" onClick={() => onEditShape(section.id, shape)}>
                            Bewerk
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            color="error"
                            onClick={() => onRemoveShape(section.id, shape.id)}
                          >
                            Verwijder
                          </Button>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
