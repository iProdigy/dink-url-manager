import type { Context } from 'hono'
import type { WebhookConfig } from '../types'

export async function getConfigByHash(c: Context, hash: string): Promise<WebhookConfig | null> {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM webhook_configs WHERE secret_hash = ?'
  ).bind(hash).run()

  return (results[0] as WebhookConfig) ?? null
}

export function jsonError(c: Context, message: string, status: number): Response {
  return c.json({ error: message }, status)
}
