# DinkPlugin Webhook Filter

A simple proxy service that filters Discord webhook messages from DinkPlugin based on player allowlists and denylists.

## What It Does

This service sits between DinkPlugin and Discord, letting you control which players' messages get posted to your Discord channel. You can:

- **Allowlist mode**: Only players with specific dink account hashes are forwarded (recommended; more secure)
- **Denylist mode**: All players except those with specific names are forwarded (simpler; easier to bypass)

## Setup Guide

### Creating Your Webhook Filter

1. Visit your [deployed worker URL](https://dink-url-manager.gitprodigy.workers.dev/)
2. Click "Create New Webhook Filter"
3. Copy the webhook URL shown (it includes a secret code)
4. Enter your Discord channel's webhook URL
5. Choose your filter mode (allowlist or denylist)
6. Add player identifiers (one per line)
7. Save the configuration

### Configuration Options

| Field | Description |
|-------|-------------|
| **Discord Webhook URL** | The webhook URL from your Discord channel settings |
| **Filter Mode** | `allow` — only listed players are forwarded.<br>`deny` — all players except listed ones are forwarded |
| **Identifiers** | One identifier per line. For allow mode: dink account hashes (found in-game with `::DinkHash`). For deny mode: exact player names (case-sensitive). Maximum 1024 players. |

### Connect DinkPlugin

In your DinkPlugin configuration, set the webhook URL to:

```
https://dink-url-manager.gitprodigy.workers.dev/webhook/GENERATED_SECRET_HASH
```

That's it — DinkPlugin will now send messages through your filter automatically.

## How Filtering Works

When DinkPlugin sends a message, the service checks it against your list:

- **Allow mode**: The message is forwarded only if the player's dink account hash is in your list
- **Deny mode**: The message is forwarded unless the player's name is in your list

Messages that don't pass the filter are silently dropped.

## Troubleshooting

**Webhook not working**

- Verify your Discord webhook URL is correct
- Make sure DinkPlugin is using the full webhook URL (including the secret hash; but not the secret key)


**Filtering doesn't seem to work**

- For allow mode: confirm you've added the player's dink account hash (not their username)
- For deny mode: confirm you've added the exact player name (case-sensitive)


**Lost your secret?**

Navigate to `/new` to create a fresh configuration (if you can't find the old secret in your browser history) and update your DinkPlugin settings.
