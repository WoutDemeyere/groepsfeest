import { IconButton, Stack, TextField, Typography, Button } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import AddIcon from '@mui/icons-material/Add'
import type { Character } from '../../types/app'

type CharacterEditorProps = {
  characters: Character[]
  onAdd: () => void
  onUpdate: (id: string, field: keyof Character, value: string) => void
  onRemove: (id: string) => void
}

export const CharacterEditor = ({ characters, onAdd, onUpdate, onRemove }: CharacterEditorProps) => (
  <Stack spacing={1}>
    <Typography variant="h2">Personages</Typography>
    <Typography color="text.secondary">
      Geef elk personage een naam en koppel eventueel de speler. Dit verschijnt mee in de PDF.
    </Typography>
    {characters.map((character) => (
      <Stack
        key={character.id}
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ alignItems: { sm: 'center' } }}
      >
        <TextField
          label="Personage"
          value={character.name}
          onChange={(event) => onUpdate(character.id, 'name', event.target.value)}
          sx={{ flexBasis: { sm: 180 }, flexGrow: 0 }}
        />
        <TextField
          label="Gekoppelde persoon"
          value={character.person}
          onChange={(event) => onUpdate(character.id, 'person', event.target.value)}
          sx={{ flexBasis: { sm: 220 }, flexGrow: 0, alignSelf: { sm: 'flex-start' } }}
        />
        <IconButton
          onClick={() => onRemove(character.id)}
          sx={{
            color: 'rgba(255,255,255,0.7)',
            '&:hover': { color: '#ff5c70' }
          }}
          aria-label="Verwijder personage"
        >
          <DeleteOutlineIcon />
        </IconButton>
      </Stack>
    ))}
    <Button variant="outlined" startIcon={<AddIcon />} onClick={onAdd} sx={{ alignSelf: 'flex-start' }}>
      Personage toevoegen
    </Button>
  </Stack>
)
