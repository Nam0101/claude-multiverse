// The terminal's ultra row, drawn above the prompt while ultra is on: a spark, a golden shimmer running over ULTRA,
// then where Claude is and what it is doing. It moves on the terminal's own frame clock, so the session's state is
// written only when the words change.
import type { ClientModule } from 'claude-code'

type Row = { name: string; accent: string; doing: string }

// One cell wide each, so the row never shifts as the spark turns.
const SPARKS = ['✦', '✧', '⋆', '✧']
const WORD = 'ULTRA'
// The letter under the shimmer glows, its neighbours shine, the rest smoulder.
const GLOW = '#fff3c4'
const GOLD = '#f5c542'
const EMBER = '#b7791f'
const FRAME_MS = 110
// Frames the shimmer rests past the word before it runs again.
const REST = 6

const UltraRow: ClientModule<Row, number> = (row, surface) => {
  const { Box, Text } = surface.elements

  if (surface.state === undefined) {
    let frame = 0

    surface.every(FRAME_MS, () => surface.setState(++frame))
    // Marks the clock as started before its first tick, so a redraw in between starts no second one.
    surface.setState(0)
  }

  const frame = surface.state ?? 0
  const shimmer = frame % (WORD.length + REST)
  const letters = [...WORD].map((letter, index) => {
    const away = Math.abs(index - shimmer)

    return <Text color={away === 0 ? GLOW : away === 1 ? GOLD : EMBER}>{letter}</Text>
  })

  return (
    <Box flexDirection="row" gap={1}>
      <Text color={GOLD}>{SPARKS[frame % SPARKS.length]!}</Text>
      <Text bold>{letters}</Text>
      <Text color={row.accent}>{row.name}</Text>
      <Text dimColor>{`· Claude ${row.doing}`}</Text>
    </Box>
  )
}

export default UltraRow
