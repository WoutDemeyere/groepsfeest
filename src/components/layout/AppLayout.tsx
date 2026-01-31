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
  const activeStep = useActiveStep()

  return (
    <Box className={styles.page}>
      <Box className={styles.page__bg} />
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
          <Toolbar
            sx={{
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'stretch', md: 'center' },
              gap: { xs: 1.5, md: 3 },
              py: 2
            }}
          >
            <Typography variant="h5">Toneelmaker</Typography>
            <Box sx={{ flex: 1 }}>
              <Stepper activeStep={activeStep} alternativeLabel nonLinear>
                {STEP_ROUTES.map((step) => (
                  <Step key={step.id}>
                    <StepButton onClick={() => navigate({ to: step.to })}>{step.label}</StepButton>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </Toolbar>
        </AppBar>

        <Box className={styles.workspace__content}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
