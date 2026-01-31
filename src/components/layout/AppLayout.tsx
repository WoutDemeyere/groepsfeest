import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { AppBar, Box, Step, StepButton, Stepper, Toolbar, Typography } from '@mui/material'
import { STEP_ROUTES } from '../../config/steps.config'
import styles from '../../styles/app.module.css'

const useActiveStep = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const stepIndex = STEP_ROUTES.findIndex((step) =>
    step.to === '/' ? pathname === '/' : pathname.startsWith(step.to)
  )
  return stepIndex === -1 ? 0 : stepIndex
}

export const AppLayout = () => {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const activeStep = useActiveStep()
  const isPlayRoute = pathname === '/'

  return (
    <Box className={styles.page}>
      <Box className={styles.page__bg} />

      {isPlayRoute ? (
        <Box className={styles.page__content}>
          <Outlet />
        </Box>
      ) : (
        <Box className={styles.workspace}>
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              background: 'rgba(12, 14, 32, 0.92)',
              borderBottom: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Toolbar sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1.5 }}>
              <Typography variant="h6">Toneelmaker</Typography>
              <Stepper activeStep={activeStep} alternativeLabel nonLinear>
                {STEP_ROUTES.map((step) => (
                  <Step key={step.id}>
                    <StepButton onClick={() => navigate({ to: step.to })}>{step.label}</StepButton>
                  </Step>
                ))}
              </Stepper>
            </Toolbar>
          </AppBar>

          <Box className={styles.workspace__content}>
            <Outlet />
          </Box>
        </Box>
      )}
    </Box>
  )
}
