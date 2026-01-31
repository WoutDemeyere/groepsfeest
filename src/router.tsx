import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { AppLayout } from './components/layout/AppLayout'
import { PlaySelectPage } from './pages/PlaySelectPage'
import { ScriptEditorPage } from './pages/ScriptEditorPage'
import { CueEditorPage } from './pages/CueEditorPage'
import { StagePlotPage } from './pages/StagePlotPage'
import { ExportPage } from './pages/ExportPage'

const rootRoute = createRootRoute({
  component: AppLayout
})

const playRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: PlaySelectPage
})

const scriptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/script',
  component: ScriptEditorPage
})

const cuesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cues',
  component: CueEditorPage
})

const stagePlotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stageplot',
  component: StagePlotPage
})

const exportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/export',
  component: ExportPage
})

const routeTree = rootRoute.addChildren([
  playRoute,
  scriptRoute,
  cuesRoute,
  stagePlotRoute,
  exportRoute
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent'
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
