import type { CueType } from '../types/app'

export const CUE_TYPES: CueType[] = ['licht', 'video', 'audio', 'decor', 'afbeelding']

export const CUE_TYPE_LABELS: Record<CueType, string> = {
  licht: 'Licht',
  video: 'Video',
  audio: 'Audio',
  decor: 'Decor',
  afbeelding: 'Afbeelding'
}

export const CUE_COLORS: Record<CueType | 'multi', string> = {
  licht: 'rgba(148, 197, 255, 0.45)',
  video: 'rgba(186, 148, 255, 0.45)',
  audio: 'rgba(140, 255, 209, 0.45)',
  decor: 'rgba(255, 201, 140, 0.45)',
  afbeelding: 'rgba(255, 161, 209, 0.45)',
  multi: 'rgba(200, 210, 255, 0.45)'
}

export const CUE_MARKER_COLORS: Record<CueType, string> = {
  licht: '#cfe0ff',
  video: '#e0ccff',
  audio: '#c9f2e6',
  decor: '#f2d3b2',
  afbeelding: '#ffd2e8'
}
