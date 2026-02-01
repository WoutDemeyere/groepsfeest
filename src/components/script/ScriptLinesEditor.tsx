import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import AddIcon from '@mui/icons-material/Add'
import type { Character, ScriptLine } from '../../types/app'

type ScriptLinesEditorProps = {
  lines: ScriptLine[]
  characters: Character[]
  draggedLineId: string | null
  dropTargetId: string | null
  onAdd: () => void
  onUpdate: (id: string, field: keyof ScriptLine | 'type', value: string) => void
  onRemove: (id: string) => void
  onMove: (fromId: string | null, toId: string | null) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDropTarget: (id: string | null) => void
}

export const ScriptLinesEditor = ({
  lines,
  characters,
  draggedLineId,
  dropTargetId,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
  onDragStart,
  onDragEnd,
  onDropTarget
}: ScriptLinesEditorProps) => (
  <Stack
    spacing={2}
    sx={{
      '& .MuiInputBase-input': { fontSize: '1.05rem' },
      '& .MuiInputLabel-root': { fontSize: '1rem' },
      '& .MuiSelect-select': { fontSize: '1.05rem' },
      '& .MuiFormHelperText-root': { fontSize: '0.9rem' },
      '& .MuiTypography-root': { fontSize: '1.05rem' },
      '& .MuiButton-root': { fontSize: '0.95rem' },
      '& .MuiIconButton-root': { fontSize: '1rem' }
    }}
  >
    <Typography variant="h2">Tekstlijnen</Typography>
    <Typography color="text.secondary">
      Gebruik type "sectie" om scenes te markeren. Die komen later terug in de podiumplots.
    </Typography>
    {lines.map((line, index) => (
      <Stack
        key={line.id}
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          alignItems: { sm: 'center' },
          position: 'relative',
          borderRadius: 1.5,
          transition: 'background-color 0.2s ease',
          padding: { xs: '12px 12px', sm: '14px 16px' },
          border: '1px solid rgba(255,255,255,0.08)',
          backgroundColor:
            dropTargetId === line.id ? 'rgba(124, 139, 255, 0.12)' : 'rgba(10, 12, 28, 0.5)',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            right: 0,
            top: -6,
            height: 2,
            borderRadius: 999,
            background:
              dropTargetId === line.id
                ? 'linear-gradient(90deg, transparent, rgba(124,139,255,0.9), transparent)'
                : 'transparent',
            transition: 'opacity 0.2s ease'
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          onDropTarget(line.id)
        }}
        onDrop={() => {
          onMove(draggedLineId, line.id)
          onDragEnd()
          onDropTarget(null)
        }}
      >
        <IconButton
          draggable={index !== 0}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move'
            onDragStart(line.id)
          }}
          onDragEnd={() => {
            onDragEnd()
            onDropTarget(null)
          }}
          sx={{
            cursor: index === 0 ? 'default' : 'grab',
            color: 'rgba(255,255,255,0.55)',
            '&:hover': { color: '#ffffff' },
            opacity: index === 0 ? 0.35 : 1
          }}
          aria-label="Versleep regel"
          disabled={index === 0}
        >
          <DragIndicatorIcon />
        </IconButton>
        {line.type !== 'sectie' && (
          <TextField
            label=" "
            value={index + 1}
            InputProps={{ readOnly: true }}
            inputProps={{ tabIndex: -1 }}
            sx={{
              width: { sm: 90 },
              '& .MuiOutlinedInput-root': {
                pointerEvents: 'none',
                '& fieldset': {
                  borderColor: 'transparent'
                }
              },
              '& .MuiInputBase-input': {
                textAlign: 'center',
                padding: '8px 0'
              }
            }}
          />
        )}
        {line.type === 'tekst' ? (
          <FormControl sx={{ minWidth: { sm: 180 } }}>
            <InputLabel id={`character-${line.id}`}>Personage</InputLabel>
            <Select
              labelId={`character-${line.id}`}
              label="Personage"
              value={line.characterId}
              onChange={(event) => onUpdate(line.id, 'characterId', event.target.value as string)}
            >
              <MenuItem value="">Geen</MenuItem>
              {characters.map((character) => (
                <MenuItem key={character.id} value={character.id}>
                  {character.name || 'Onbenoemd'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Box sx={{ minWidth: { sm: 180 } }} />
        )}
        {line.type === 'sectie' ? (
          <TextField
            label="Sectienaam"
            value={line.text}
            onChange={(event) => onUpdate(line.id, 'text', event.target.value)}
            placeholder="Bijv. Scene 2 - De bakkerij"
            fullWidth
          />
        ) : (
          <TextField
            label="Tekst"
            value={line.text}
            onChange={(event) => onUpdate(line.id, 'text', event.target.value)}
            multiline
            minRows={1}
            maxRows={6}
            fullWidth
            placeholder={
              line.type === 'actie'
                ? 'Bijv. Dansers komen op, licht dimt...'
                : 'Dialoog of tekst...'
            }
          />
        )}
        <FormControl sx={{ minWidth: { sm: 140 } }}>
          <InputLabel id={`type-${line.id}`}>Type</InputLabel>
          <Select
            labelId={`type-${line.id}`}
            label="Type"
            value={line.type}
            onChange={(event) => onUpdate(line.id, 'type', event.target.value as string)}
          >
            <MenuItem value="tekst">Tekst</MenuItem>
            <MenuItem value="actie">Actie</MenuItem>
            <MenuItem value="sectie">Sectie</MenuItem>
          </Select>
        </FormControl>
        <IconButton
          onClick={() => onRemove(line.id)}
          sx={{
            color: 'rgba(255,255,255,0.7)',
            '&:hover': { color: '#ff5c70' },
            opacity: index === 0 ? 0.35 : 1
          }}
          aria-label="Verwijder regel"
          disabled={index === 0}
        >
          <DeleteOutlineIcon />
        </IconButton>
      </Stack>
    ))}
    <Button
      variant="outlined"
      startIcon={<AddIcon />}
      onClick={onAdd}
      sx={{ alignSelf: 'flex-start' }}
    >
      Regel toevoegen
    </Button>
  </Stack>
)
