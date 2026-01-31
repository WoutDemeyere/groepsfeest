import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField
} from '@mui/material'
import { CUE_TYPES, CUE_TYPE_LABELS } from '../../config/cues.config'
import type { CueType } from '../../types/app'

type CueModalProps = {
  open: boolean
  cueType: CueType
  cueDescription: string
  cueFileName: string
  disabled: boolean
  onClose: () => void
  onTypeChange: (value: CueType) => void
  onDescriptionChange: (value: string) => void
  onFileNameChange: (value: string) => void
  onSave: () => void
}

export const CueModal = ({
  open,
  cueType,
  cueDescription,
  cueFileName,
  disabled,
  onClose,
  onTypeChange,
  onDescriptionChange,
  onFileNameChange,
  onSave
}: CueModalProps) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="sm"
    PaperProps={{
      sx: {
        backgroundColor: 'rgba(10, 12, 28, 0.94)',
        border: '1px solid rgba(255,255,255,0.12)'
      }
    }}
  >
    <DialogTitle>Cue toevoegen</DialogTitle>
    <DialogContent>
      <Stack spacing={2} sx={{ mt: 1 }}>
        <FormControl fullWidth>
          <InputLabel id="cue-type">Cue type</InputLabel>
          <Select
            labelId="cue-type"
            label="Cue type"
            value={cueType}
            onChange={(event) => onTypeChange(event.target.value as CueType)}
          >
            {CUE_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {CUE_TYPE_LABELS[type]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {(cueType === 'audio' || cueType === 'video') && (
          <TextField
            label="Bestandsnaam"
            value={cueFileName}
            onChange={(event) => onFileNameChange(event.target.value)}
            required={false}
            helperText="Optioneel, maar aanbevolen voor audio en video."
          />
        )}
        <TextField
          label="Beschrijving"
          value={cueDescription}
          onChange={(event) => onDescriptionChange(event.target.value)}
          multiline
          minRows={3}
        />
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Annuleer</Button>
      <Button variant="contained" onClick={onSave} disabled={disabled}>
        Cue toevoegen
      </Button>
    </DialogActions>
  </Dialog>
)
