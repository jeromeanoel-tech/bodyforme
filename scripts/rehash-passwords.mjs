/**
 * Re-hashes all ADMIN_CREDENTIALS passwords from cost 10 → cost 8.
 * Run: node scripts/rehash-passwords.mjs
 *
 * Paste each staff member's CURRENT password when prompted.
 * Copy the output JSON into your ADMIN_CREDENTIALS env var on Vercel.
 */
import bcrypt from 'bcryptjs'
import readline from 'readline'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = q => new Promise(res => rl.question(q, res))

const CREDENTIALS = JSON.parse(process.env.ADMIN_CREDENTIALS ?? '[]')

if (!CREDENTIALS.length) {
  console.error('Set ADMIN_CREDENTIALS env var first, e.g.:')
  console.error('  ADMIN_CREDENTIALS=\'[...]\' node scripts/rehash-passwords.mjs')
  process.exit(1)
}

const results = []

for (const user of CREDENTIALS) {
  const alreadyFast = !user.passwordHash.startsWith('$2b$10$') && !user.passwordHash.startsWith('$2a$10$')
  if (alreadyFast) {
    console.log(`${user.username}: already fast, skipping`)
    results.push(user)
    continue
  }

  const pw = await ask(`Password for ${user.name} (${user.username}): `)
  const ok = await bcrypt.compare(pw, user.passwordHash)
  if (!ok) {
    console.error(`  Wrong password for ${user.username} — keeping existing hash`)
    results.push(user)
  } else {
    const newHash = await bcrypt.hash(pw, 8)
    console.log(`  Re-hashed ${user.username} at cost 8`)
    results.push({ ...user, passwordHash: newHash })
  }
}

rl.close()
console.log('\n--- Paste this into ADMIN_CREDENTIALS on Vercel ---\n')
console.log(JSON.stringify(results))
