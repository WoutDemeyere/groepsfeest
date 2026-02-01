import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { AppLayout } from './components/layout/AppLayout'
import { PlaySelectPage } from './pages/PlaySelectPage'
import { ScriptEditorPage } from './pages/ScriptEditorPage'
import { CueEditorPage } from './pages/CueEditorPage'
import { PodiumPlotPage } from './pages/PodiumPlotPage'
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

const podiumPlotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/podiumplot',
  component: PodiumPlotPage
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
  podiumPlotRoute,
  exportRoute
])

export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL.replace(/\/$/, ''),
  defaultPreload: 'intent'
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
