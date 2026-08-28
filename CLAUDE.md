# CLAUDE.md — Niaan JV bot

Discord bot that reads Jailbreak item values out of a Google Sheet and serves
them through slash commands + a `q.` prefix. Verified bot, ~177 guilds.

Migrated from discord.js **v13 → v14.27** (Aug 2026). Everything below reflects
the current code.

---

## 1. How it works

```
Google Sheet ──(service account, JWT)──► index.js ──► client.items (Collection)
                                              │              ▲
                                              │              │ refreshed every 2 min
                                              │         events/ready.js
                                              ▼
                                        handler/handler.js
                                     loads commands/ + events/
                                              │
                        ┌─────────────────────┴─────────────────────┐
                  events/interaction.js                     events/message.js
                  (slash, autocomplete, modal)              (q. prefix commands)
                                              │
                                     commands/Bot/*.js
                                              │
                                        dashboard.js
                                  (node:http, read-only web UI)
```

**The sheet.** One spreadsheet, one worksheet per category, each named
`JV || <Category>`. `client.nameFormat()` strips the `JV || ` prefix to get the
category slug. Rows are read via `row.toObject()` and lower-cased into
`{ name, value, demand, brulee, url?, category }`. `value` is a number of
millions written as e.g. `10` or `10M`.

**Caching.** `events/ready.js` pulls every category every 2 minutes into
`client.items`, keyed by item name. `/view`, `/compare` and autocomplete read
that cache (instant). `/show` hits the sheet live for the one category asked
for — `loadInfo()` is cached for 60s so this stays inside Discord's 3s ack
window, and `/show` also defers.

**Startup order.** `index.js` builds the client → `handler/handler.js` loads all
commands and events synchronously → on `clientReady` the handler fills in
`/show`'s category choices from the live sheet tabs and pushes the command set
globally. Global commands can take up to an hour to propagate on first change.

### Commands

| Command | Slash | Prefix | Notes |
|---|---|---|---|
| `/help <command>` | ✅ | `q.help compare` | Compare page has a "Watch Tutorial" button |
| `/show <category>` | ✅ | `q.show hypers` | Paginated 8/page, ⬅️➡️ buttons, idle 15s |
| `/view <name>` | ✅ (autocomplete) | `q.view torpedo` | Red embed when demand > 3 |
| `/compare` | ✅ | `q.compare a, b to c, d` | Slash form opens a private thread |

`/compare` slash flow: creates a private thread → "Get Started" button (20s) →
first item set → second item set → result → thread deleted after 30s → the
result is reposted in the parent channel with a **Feedback** button that opens a
modal, forwarded to `process.env.channel`.

Compare rules (`functions/compare.js`): max 8 items per set, comma-separated,
optional leading quantity (`3 beam`), no duplicates, hypers need a level 1–5
(`hyper_red 4`), and every item must have a value in the sheet.

---

## 2. Configuration

### Environment variables

| Var | Required | What |
|---|---|---|
| `token` | ✅ | Discord bot token |
| `GOOGLE_CREDENTIALS` | ✅¹ | Service-account JSON as a single-line string |
| `SHEET_ID` | – | Defaults to the existing sheet ID in `index.js` |
| `prefix` | – | Defaults to `q.` |
| `channel` | – | Channel ID that feedback modals are forwarded to |
| `DASHBOARD_TOKEN` | – | Enables the web dashboard. Unset = dashboard off |
| `PORT` | – | Dashboard port, defaults to `3000` |

¹ Locally you can drop a `creds.json` in the repo root instead — `index.js`
falls back to it. On a cloud host use `GOOGLE_CREDENTIALS`; there's no file to
mount. Escaped `\n` in `private_key` is handled.

`.env` example:

```
token=YOUR_BOT_TOKEN
prefix=q.
channel=123456789012345678
GOOGLE_CREDENTIALS={"type":"service_account","client_email":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n", ...}
```

### Discord developer portal

Under **Bot → Privileged Gateway Intents**, `MESSAGE CONTENT INTENT` must be
**on**. The `q.` prefix commands read `message.content`; without it every prefix
command silently does nothing. (`SERVER MEMBERS INTENT` is no longer needed —
the code never used it and it's been dropped from the intent list.)

Requested intents are now exactly: `Guilds`, `GuildMessages`, `MessageContent`.

### Google Sheets access

Share the spreadsheet with the service account's `client_email` as at least
**Viewer**. Enable the Google Sheets API on the project.

### The dashboard

`dashboard.js` serves a single read-only page on `PORT` using `node:http` — no
framework, no database, no build step. Start the bot and open the URL it logs:

```
Dashboard: http://localhost:3000/?key=<DASHBOARD_TOKEN>
```

Shows total servers, total users, items cached, uptime/ping/memory, every server
by name and member count, per-command totals, a 14-day usage chart, and a live
activity feed (including guild joins and leaves). It polls `/api/stats` every
10s; that endpoint returns the same data as JSON if you want it elsewhere.

Every request needs the token, as `?key=…` or `Authorization: Bearer …`,
compared in constant time. **With `DASHBOARD_TOKEN` unset the server never
starts** — it exposes server names and member counts, so it fails closed rather
than open.

Live figures (servers, users, guild list) come straight from `client.guilds.cache`
so nothing is stored. Only command counters persist, in `stats.json`: per-command
totals, per-day totals pruned to 30 days, and the last 50 activity entries.
Written at most once every 10s, gitignored. Delete it to reset analytics.

Guild names are rendered through an escape helper — they're attacker-controlled
across 177 servers and go into `innerHTML`.

---

## 3. Running it

```bash
npm install
npm test     # offline smoke test of the compare math — no login, no network
npm start
```

Node **20+** (discord.js 14.27 needs ≥18; 20 LTS or newer is what this is
tested on).

Expected boot output:

```
SLASH COMMANDS 🟢
Loaded Slash Command ✅ | compare | help | show | view
EVENTS 🟢
Loaded Event ✅ | interaction | message | ready
<BotName> is online!
Spreadsheet: N items cached.
Global commands set!
```

---

## 4. Deploying

Any always-on Node host works — this is a gateway (WebSocket) bot, so it cannot
run serverless (no Vercel/Lambda/Cloud Run-scale-to-zero).

**Railway / Render / Fly.io / a VPS:**

- Build: `npm ci`
- Start: `npm start`
- Set the env vars from §2. Paste the whole service-account JSON into
  `GOOGLE_CREDENTIALS` as one line.
- For the dashboard, set `DASHBOARD_TOKEN` and let the host assign `PORT`.
  `stats.json` lives on local disk, so on a host with an ephemeral filesystem
  analytics reset on redeploy — mount a volume if you care about the history.
- Run **exactly one** instance. Two instances = duplicate replies and a
  duplicate global-command push.

**PM2 on a VPS:**

```bash
pm2 start index.js --name niaan-jv
pm2 save && pm2 startup
```

`process.on("unhandledRejection")` / `uncaughtException` keep the process alive
on transient Discord or Sheets errors instead of dropping the bot in all 177
servers.

---

## 5. ⚠️ Rotate the old credentials

`creds.json` and `.env` were committed to this repo before being deleted — they
are still in git history (`git log --all -- creds.json .env`). Deleting the file
did not remove them.

Before going live:

1. **Delete the old service-account key** in Google Cloud Console → IAM →
   Service Accounts → Keys, and create a new one.
2. **Reset the bot token** in the Discord developer portal.
3. If the repo is public, treat both as fully compromised.

`.gitignore` now covers `.env`, `creds.json`, `.env2` and `testconfig.json`.

---

## 6. What changed in the v13 → v14 migration

**API renames** (the bulk of it):

| v13 | v14 |
|---|---|
| `"GUILDS"`, `"GUILD_MESSAGES"` | `GatewayIntentBits.Guilds`, `.GuildMessages` |
| `"GUILD_MEMBER"` partials | `Partials.Channel` |
| `MessageEmbed` | `EmbedBuilder` |
| `MessageActionRow` | `ActionRowBuilder` |
| `MessageButton` + `.setStyle("SUCCESS")` | `ButtonBuilder` + `ButtonStyle.Success` |
| `Modal` / `TextInputComponent` | `ModalBuilder` / `TextInputBuilder` |
| `.setStyle("PARAGRAPH")` | `TextInputStyle.Paragraph` |
| option `type: "STRING"` | `ApplicationCommandOptionType.String` |
| `"GUILD_PRIVATE_THREAD"` | `ChannelType.PrivateThread` |
| `interaction.isCommand()` | `interaction.isChatInputCommand()` |
| `ephemeral: true` | `flags: MessageFlags.Ephemeral` |
| `client.on("ready")` | `client.once(Events.ClientReady)` (`"ready"` is deprecated) |
| `row._rawData` + `headerValues` | `row.toObject()` (google-spreadsheet v5) |

**Bugs fixed along the way:**

- `handler.js` used `readdirSync(...).forEach(async …)`, so `commands` could
  still be empty when `ready` fired and pushed the command set. Loading is now
  synchronous; only the `/show` choices lookup is awaited, inside `ready`.
- `/compare` deferred its reply then used `followUp()`, leaving the original
  interaction stuck on "thinking…" forever. Now `editReply()`.
- `/show` did no defer but made a blocking Sheets call — past 3s Discord killed
  the interaction. Now defers, and `loadInfo()` is cached (it was being called
  twice per `getItems`).
- `/help`'s button collector listened on the whole **channel** with
  `componentType: "BUTTON"`, catching other users' buttons. Now scoped to its
  own reply message.
- A Sheets failure inside the 2-minute refresh loop or an unhandled command
  error took the whole process down. Both are caught now; the last good item
  cache survives a failed refresh.
- `nameFormat()` crashed on any worksheet whose title lacked `" || "` — adding
  one tab to the sheet would break startup. Now falls back to the raw title.

**Removed:**

- `chalk`, `googleapis`, `@google-cloud/local-auth` — unused or purely
  cosmetic. Four dependencies total now.
- `archive/compare2.js` — dead, referenced an undefined `interaction`.
- `Object.defineProperty(Array.prototype, "pager")` — replaced with
  `client.pager(arr, n)`. Patching a built-in prototype for one call site is a
  landmine.
- `GuildMembers` / `GuildMessageReactions` intents — never used, and
  `GuildMembers` is privileged.

---

## 7. Gotchas

- **Global commands propagate slowly.** After changing a command's name,
  description, or options, expect up to an hour. Nothing is wrong.
- **`/show` choices are baked at startup.** Add a worksheet to the sheet and the
  new category won't appear as a `/show` choice until the bot restarts (item
  data itself refreshes on the 2-minute loop).
- **Private threads need the right permissions.** `/compare` needs *Create
  Private Threads*, *Send Messages in Threads* and *Manage Threads* in the
  channel it's invoked from.
- **`q.compare` needs `to`.** `q.compare torpedo, beam to arachnid`.
- **Never run two instances.**
- **The dashboard is read-only.** No routes mutate anything; it's a viewer, not
  a control panel.
