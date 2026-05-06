import { type Context } from 'hono'
import { sha256 } from '../utils/crypto'
import { getConfigByHash, jsonError } from '../utils/db'
import { parseIdList, idListToString, sanitizeIdentifier, isValidDiscordWebhookUrl } from '../utils/validation'
import { MAX_IDENTIFIER_LENGTH, MAX_IDENTIFIER_COUNT } from '../constants'
import type { IdList } from '../types'
import { settingsPage } from './home'

export async function settingsPageRoute(c: Context) {
  const secret = c.req.param('secret')
  const hash = await sha256(secret)

  const config = await getConfigByHash(c, hash)
  if (!config) return c.notFound()

  const idList = parseIdList(config.id_list)
  const idListKeys = idListToString(idList)

  return settingsPage(c, secret, config, idListKeys)
}

export async function settingsApiRoute(c: Context) {
  const body = await c.req.parseBody()
  const secret = body.secret as string
  const webhookUrl = body.webhook_url as string
  const mode = body.mode as 'allow' | 'deny'
  const idListRaw = body.id_list as string

  if (!secret || !webhookUrl || !mode) {
    return jsonError(c, 'Missing required fields', 400)
  }

  if (mode !== 'allow' && mode !== 'deny') {
    return jsonError(c, 'Invalid mode. Must be "allow" or "deny"', 400)
  }

  if (!isValidDiscordWebhookUrl(webhookUrl)) {
    return jsonError(c, 'Invalid Discord webhook URL format', 400)
  }

  try {
    const response = await fetch(webhookUrl, { method: 'HEAD' })
    if (response.status === 404) {
      return jsonError(c, 'Discord webhook URL not found (404)', 400)
    }
  } catch (err) {
    console.error('Webhook verification error:', err)
    return jsonError(c, 'Failed to verify Discord webhook URL', 500)
  }

  const hash = await sha256(secret)

  const idListArray = idListRaw
    .split('\n')
    .map(s => sanitizeIdentifier(s))
    .filter(s => s !== "")

  if (idListArray.length > MAX_IDENTIFIER_COUNT) {
    return jsonError(c, `Too many identifiers. Maximum is ${MAX_IDENTIFIER_COUNT}`, 400)
  }

  const idListObj: IdList = {}
  for (const rawId of idListArray) {
    if (!rawId) {
      return jsonError(c, 'Invalid identifier', 400)
    }
    if (rawId.length > MAX_IDENTIFIER_LENGTH) {
      return jsonError(c, `Identifier too long (max ${MAX_IDENTIFIER_LENGTH} chars): "${rawId.substring(0, MAX_IDENTIFIER_LENGTH / 2)}..."`, 400)
    }
    idListObj[rawId.toUpperCase()] = true
  }

  try {
    await c.env.DB.prepare(`
      UPDATE webhook_configs SET
        webhook_url = ?,
        mode = ?,
        id_list = ?
      WHERE secret_hash = ?
    `).bind(webhookUrl, mode, JSON.stringify(idListObj), hash).run()
  } catch (err) {
    console.error('Database error:', err)
    return jsonError(c, 'Failed to update settings', 500)
  }

  c.status(303)
  c.header('Location', `/settings/${secret}`)
  return c.text('Settings updated')
}
