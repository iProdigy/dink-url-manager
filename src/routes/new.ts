import { type Context } from 'hono'
import { generateSecret } from '../utils/crypto'
import { jsonError } from '../utils/db'

export async function newConfigRoute(c: Context) {
  const { secret, hash } = await generateSecret()

  await c.env.DB.prepare(`
    INSERT INTO webhook_configs (secret_hash, webhook_url, mode)
    VALUES (?, ?, 'allow')
  `).bind(hash, '').run()

  c.status(303)
  c.header('Location', `/settings/${secret}`)
  return c.text('Config created')
}
