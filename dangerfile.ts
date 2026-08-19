import { danger, schedule, warn } from 'danger'

const modifiedFiles = danger.git.modified_files
const createdFiles = danger.git.created_files
const deletedFiles = danger.git.deleted_files
const allChangedFiles = [...modifiedFiles, ...createdFiles, ...deletedFiles]

const SENSITIVE_PATH_PATTERNS = [/^src\/features\/settlements\//, /^src\/features\/bets\/api\/bets\.resolve/]

const touchesSensitivePath = allChangedFiles.some(file =>
  SENSITIVE_PATH_PATTERNS.some(pattern => pattern.test(file))
)
const touchesTests = allChangedFiles.some(file => file.startsWith('__tests__/'))

if (touchesSensitivePath && !touchesTests) {
  warn(
    'PR zmienia logikę rozliczeń (`src/features/settlements/` lub `src/features/bets/api/bets.resolve*`) bez zmian w `__tests__/`. Rozważ dodanie lub aktualizację testów.'
  )
}

const totalChangedLines = (danger.github?.pr.additions ?? 0) + (danger.github?.pr.deletions ?? 0)

if (totalChangedLines > 500) {
  warn(`PR zmienia ${totalChangedLines} linii (>500). Rozważ podział na mniejsze PR-y.`)
}

schedule(async () => {
  const changedTsFiles = [...modifiedFiles, ...createdFiles].filter(file => /\.(ts|tsx)$/.test(file))

  for (const file of changedTsFiles) {
    const diff = await danger.git.diffForFile(file)
    if (diff?.added.includes('console.log(')) {
      warn(`\`${file}\` zawiera \`console.log(\` — usuń przed mergem.`)
    }
  }
})
