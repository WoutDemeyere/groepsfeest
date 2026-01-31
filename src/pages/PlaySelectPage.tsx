import { useMemo } from 'react'
import {
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import { PLAYS } from '../config/plays.config'
import { SUMMARIES } from '../config/summaries.config'
import { useAppStore } from '../store/useAppStore'
import { usePlayImport } from '../hooks/usePlayImport'
import styles from '../styles/app.module.css'

export const PlaySelectPage = () => {
  const navigate = useNavigate()
  const selectedPlay = useAppStore((state) => state.selectedPlay)
  const setSelectedPlay = useAppStore((state) => state.setSelectedPlay)
  const handleImport = usePlayImport()

  const summary = useMemo(() => SUMMARIES[selectedPlay], [selectedPlay])

  return (
    <div className={styles.play}>
      <div className={styles.play__content}>
        <Stack spacing={1.5}>
          <Typography variant="overline" color="text.secondary">
            Toneelmaker
          </Typography>
          <Typography variant="h1">Start je toneeltje</Typography>
          <Typography color="text.secondary">
            Kies je groep en ga daarna verder in de editor.
          </Typography>
        </Stack>

        <Card className={styles.card}>
          <CardContent>
            <Stack spacing={2.5}>
              <FormControl fullWidth>
                <InputLabel id="play-label">Groep</InputLabel>
                <Select
                  labelId="play-label"
                  id="play"
                  label="Groep"
                  value={selectedPlay}
                  onChange={(event) => setSelectedPlay(event.target.value as string)}
                  sx={{
                    backgroundColor: 'rgba(12, 14, 32, 0.95)'
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: 'rgba(12, 14, 32, 0.98)'
                      }
                    }
                  }}
                >
                  {PLAYS.map((play) => (
                    <MenuItem key={play.id} value={play.id}>
                      {play.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button variant="outlined" component="label">
                  Importeer JSON
                  <input type="file" accept="application/json" hidden onChange={handleImport} />
                </Button>

                <Button variant="contained" onClick={() => navigate({ to: '/script' })}>
                  Naar schrijven
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined" className={styles.summary}>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="h2">Korte inhoud</Typography>
              <Typography color="text.secondary">{summary}</Typography>
            </Stack>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
