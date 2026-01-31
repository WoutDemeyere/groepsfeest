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
import type { ShapeDraft } from '../../types/app'

type ShapeModalProps = {
  open: boolean
  draft: ShapeDraft
  isEditing: boolean
  onClose: () => void
  onDelete?: () => void
  onSave: () => void
  onDraftChange: (next: Partial<ShapeDraft>) => void
}

export const ShapeModal = ({
  open,
  draft,
  isEditing,
  onClose,
  onDelete,
  onSave,
  onDraftChange
}: ShapeModalProps) => (
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
    <DialogTitle>{isEditing ? 'Vorm bewerken' : 'Vorm toevoegen'}</DialogTitle>
    <DialogContent>
      <Stack spacing={2} sx={{ mt: 1 }}>
        <FormControl fullWidth>
          <InputLabel id="shape-kind">Vorm</InputLabel>
          <Select
            labelId="shape-kind"
            label="Vorm"
            value={draft.kind}
            onChange={(event) => onDraftChange({ kind: event.target.value as ShapeDraft['kind'] })}
          >
            <MenuItem value="circle">Cirkel</MenuItem>
            <MenuItem value="square">Vierkant</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Naam"
          value={draft.name}
          onChange={(event) => onDraftChange({ name: event.target.value })}
        />
        <TextField
          label="Beschrijving"
          value={draft.description}
          onChange={(event) => onDraftChange({ description: event.target.value })}
          multiline
          minRows={3}
        />
        <FormControl fullWidth>
          <InputLabel id="shape-label">Label</InputLabel>
          <Select
            labelId="shape-label"
            label="Label"
            value={draft.label}
            onChange={(event) => onDraftChange({ label: event.target.value as ShapeDraft['label'] })}
          >
            <MenuItem value="licht">Licht</MenuItem>
            <MenuItem value="decor">Decor</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </DialogContent>
    <DialogActions>
      {isEditing && onDelete && (
        <Button color="error" onClick={onDelete}>
          Verwijder
        </Button>
      )}
      <Button onClick={onClose}>Annuleer</Button>
      <Button variant="contained" onClick={onSave}>
        {isEditing ? 'Opslaan' : 'Toevoegen'}
      </Button>
    </DialogActions>
  </Dialog>
)
