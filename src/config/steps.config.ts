export const STEP_ROUTES = [
  { id: 'play', label: 'Keuze groep', to: '/' },
  { id: 'script', label: 'Schrijven tekst', to: '/script' },
  { id: 'cues', label: "Plaatsen cue's op tekst", to: '/cues' },
  { id: 'stage', label: 'Stageplot', to: '/stageplot' },
  { id: 'export', label: 'Export', to: '/export' }
] as const

export type StepRoute = (typeof STEP_ROUTES)[number]
