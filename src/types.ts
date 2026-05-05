export interface WebhookConfig {
  secret_hash: string
  webhook_url: string
  mode: 'allow' | 'deny'
  id_list: string | null
}

export interface IdList {
  [key: string]: boolean
}

export interface WebhookPayload {
  dinkAccountHash: string
  playerName: string
  [key: string]: unknown
}

export interface JsonResponse {
  error?: string
  status?: 'filtered' | 'forwarded'
}

export type Bindings = {
  DB: D1Database
}
