import { jsx } from 'hono/jsx'
import { type Context } from 'hono'
import { WEBHOOK_URL_BASE, MAX_IDENTIFIER_LENGTH, MAX_IDENTIFIER_COUNT } from '../constants'
import type { WebhookConfig, IdList } from '../types'

export function homePage(c: Context) {
  return c.render(
    <div>
      <h1>DinkPlugin Webhook Filter</h1>
       <p>
         This service filters Discord webhook notifications from <a href="https://runelite.net/plugin-hub/show/dink">DinkPlugin</a>.
         Allowlist mode forwards players whose dink account hash or name appears in the list.
         Denylist mode blocks players whose dink account hash or name appears in the list.
         Configure to control which notifications reach your Discord server.
       </p>
      <div class="field">
        <a href="/new" class="button-link">
          <button>Create New Webhook Filter</button>
        </a>
      </div>
      <div class="field">
        <label htmlFor="secret_input" class="label-style">
          Access Existing Configuration
        </label>
        <form onsubmit="handleAccessSubmit(event)" class="form-style">
          <input
            type="text"
            id="secret_input"
            name="secret"
            placeholder="Enter your secret key"
            class="input-style"
          />
          <button type="submit">Go to Settings</button>
        </form>
      </div>
      <script dangerouslySetInnerHTML={{
        __html: `
          function handleAccessSubmit(e) {
            e.preventDefault();
            const secret = document.getElementById('secret_input').value.trim();
            if (secret) {
              window.location.href = '/settings/' + encodeURIComponent(secret);
            }
          }
        `
      }} />
      <h2>How It Works</h2>
      <p>
        1. <strong>Create</strong> a new webhook configuration (generates a secret key).<br />
        2. <strong>Configure</strong> your Discord webhook URL, identifier list (dink hashes and/or player names), and mode (allowlist or denylist).<br />
        3. <strong>Set</strong> the generated webhook URL in your DinkPlugin configuration.<br />
        4. <strong>Filter</strong> incoming webhooks to only forward notifications to Discord that match the specified configuration; others are silently dropped by this service.
      </p>
      <h2>Security</h2>
      <p>
        Your secret is shown only once at creation and never stored in plaintext.
        The secret is used to compute a hash that appears in the webhook URL.
        Only someone with the secret can modify the configuration.
      </p>
    </div>
  )
}

export function settingsPage(
  c: Context,
  secret: string,
  config: WebhookConfig,
  idListKeys: string
) {
  const webhookUrl = `${WEBHOOK_URL_BASE}/webhook/${config.secret_hash}`

  return c.render(
    <div>
      <h1>Webhook Filter Settings</h1>

      <div class="field">
        <label><strong>Secret Key</strong></label>
        <div class="secret-container">
          <div class="copy-wrapper">
            <div class="secret-wrapper" style="flex: 1;">
              <code class="secret-censored">
                ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
              </code>
              <code class="secret-plain" id="secret-text">{secret}</code>
            </div>
            <button class="copy-button" data-copy-target="secret-text" onclick="copyToClipboard('secret-text', this)">
              Copy
            </button>
          </div>
        </div>
        <small class="small-error">
          <strong>Treat this key as a password; it is required to modify the configuration below and we cannot provide it if lost.</strong> Hover over the censored text to reveal it. Copy and save it somewhere safe (or bookmark this page).
        </small>
      </div>

      <form method="post" action="/api/settings" onsubmit="return validateIdList()">
        <input type="hidden" name="secret" value={secret} />

        <div class="field">
          <label htmlFor="webhook_url">Discord Webhook URL</label>
          <input
            type="url"
            id="webhook_url"
            name="webhook_url"
            value={config.webhook_url}
            placeholder="https://discord.com/api/webhooks/..."
            required
          />
          <small>
            Enter your Discord channel's webhook URL. You can create a webhook via <code>Channel Settings &rarr; Integrations &rarr; Webhooks &rarr; New Webhook</code>
          </small>
        </div>

        <div class="field">
          <label htmlFor="mode">Filter Mode</label>
          <select id="mode" name="mode">
             <option value="allow" selected={config.mode === 'allow'}>
               Allow matching identifiers (allowlist; more secure)
             </option>
             <option value="deny" selected={config.mode === 'deny'}>
               Deny matching identifiers (denylist; easier)
             </option>
          </select>
           <small>
             <strong>Allow mode:</strong> Forwarded if the player's dink account hash <strong>or</strong> the player name appears in the list (case-insensitive).<br />
             <strong>Deny mode:</strong> Forwarded only if <strong>neither</strong> the player's dink account hash <strong>nor</strong> the player name appears in the list (case-insensitive).
           </small>
        </div>

        <div class="field">
          <label htmlFor="id_list">Identifiers (one per line)</label>
          <textarea
            id="id_list"
            name="id_list"
            rows="6"
            placeholder="abcdef1234567890&#10;John Doe"
            maxlength="65535"
            oninput="updateCharCount(this)"
            onkeydown="handleTabKey(event)"
          >{idListKeys}</textarea>
          <div id="id-list-counter" style="font-size: 0.85rem; color: #666; margin-top: 5px; text-align: right;">
            <span id="current-chars">{idListKeys.length}</span> / 65,535 max
          </div>
        </div>

        <script dangerouslySetInnerHTML={{
          __html: `
            function updateCharCount(textarea) {
              document.getElementById('current-chars').textContent = textarea.value.length;
            }
            function handleTabKey(e) {
              if (e.key === 'Tab') {
                e.preventDefault();
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                e.target.value = e.target.value.substring(0, start) + '\\n' + e.target.value.substring(end);
                e.target.selectionStart = e.target.selectionEnd = start + 1;
                updateCharCount(e.target);
              }
            }
            function validateIdList() {
              const textarea = document.getElementById('id_list');
              const lines = textarea.value.split('\\n');
              const MAX_IDENTIFIER_LENGTH = ${MAX_IDENTIFIER_LENGTH};
              const MAX_IDENTIFIER_COUNT = ${MAX_IDENTIFIER_COUNT};

              const nonEmptyLines = lines.filter(l => l.trim()).length;
              if (nonEmptyLines > MAX_IDENTIFIER_COUNT) {
                alert('Too many identifiers. Maximum is ' + MAX_IDENTIFIER_COUNT + ' (found ' + nonEmptyLines + ')');
                return false;
              }

              for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line && line.length > MAX_IDENTIFIER_LENGTH) {
                  alert('Line ' + (i + 1) + ' exceeds ' + MAX_IDENTIFIER_LENGTH + ' characters: ' + line.substring(0, 32) + '...');
                  return false;
                }
              }
              return true;
            }
            async function copyToClipboard(elementId, button) {
              const element = document.getElementById(elementId);
              if (!element) return;

              try {
                await navigator.clipboard.writeText(element.textContent);
                button.textContent = 'Copied!';
                button.classList.add('copied');
                setTimeout(() => {
                  button.textContent = 'Copy';
                  button.classList.remove('copied');
                }, 2000);
              } catch (err) {
                console.error('Failed to copy:', err);
                button.textContent = 'Failed';
                setTimeout(() => {
                  button.textContent = 'Copy';
                }, 2000);
              }
            }
          `
        }} />

        <div class="field">
          <button type="submit">Save Settings</button>
        </div>
      </form>

      <h2>Webhook URL</h2>
      <div class="webhook-url-container">
        <div class="copy-wrapper">
          <code class="webhook-url" id="webhook-text" style="flex: 1;">{webhookUrl}</code>
          <button class="copy-button" data-copy-target="webhook-text" onclick="copyToClipboard('webhook-text', this)">
            Copy
          </button>
        </div>
      </div>
      <p>
        <small>Use this URL as your webhook in DinkPlugin. This URL will not work for other Discord notification plugins, only Dink.</small>
      </p>

      <p>
        <a href="/" class="btn-secondary back-link">← Back to Home</a>
      </p>
    </div>
  )
}
