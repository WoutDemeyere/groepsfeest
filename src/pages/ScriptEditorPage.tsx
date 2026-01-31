import { Box, Divider, Stack, Typography, Button } from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import { CharacterEditor } from '../components/script/CharacterEditor'
import { ScriptLinesEditor } from '../components/script/ScriptLinesEditor'
import { useAppStore } from '../store/useAppStore'
import styles from '../styles/app.module.css'

export const ScriptEditorPage = () => {
  const navigate = useNavigate()
  const characters = useAppStore((state) => state.characters)
  const lines = useAppStore((state) => state.lines)
  const draggedLineId = useAppStore((state) => state.draggedLineId)
  const dropTargetId = useAppStore((state) => state.dropTargetId)
  const addCharacter = useAppStore((state) => state.addCharacter)
  const updateCharacter = useAppStore((state) => state.updateCharacter)
  const removeCharacter = useAppStore((state) => state.removeCharacter)
  const addLine = useAppStore((state) => state.addLine)
  const updateLine = useAppStore((state) => state.updateLine)
  const removeLine = useAppStore((state) => state.removeLine)
  const moveLine = useAppStore((state) => state.moveLine)
  const setDraggedLineId = useAppStore((state) => state.setDraggedLineId)
  const setDropTargetId = useAppStore((state) => state.setDropTargetId)

  return (
    <Box className={styles.editor}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h2">Main editor</Typography>
        </Stack>

        <Divider />

        <CharacterEditor
          characters={characters}
          onAdd={addCharacter}
          onUpdate={updateCharacter}
          onRemove={removeCharacter}
        />

        <Divider />

        <ScriptLinesEditor
          lines={lines}
          characters={characters}
          draggedLineId={draggedLineId}
          dropTargetId={dropTargetId}
          onAdd={addLine}
          onUpdate={updateLine}
          onRemove={removeLine}
          onMove={moveLine}
          onDragStart={setDraggedLineId}
          onDragEnd={() => setDraggedLineId(null)}
          onDropTarget={setDropTargetId}
        />

        <Stack direction="row" spacing={2.5} sx={{ mt: 2 }}>
          <Button variant="text" onClick={() => navigate({ to: '/' })}>
            Terug naar keuze groep
          </Button>
          <Button variant="contained" onClick={() => navigate({ to: '/cues' })}>
            Naar cues plaatsen
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
