// Read-only web dashboard. node:http + one page — no framework, no database.
// Live guild data comes straight out of the client cache; only command counters
// are persisted (stats.json) so analytics survive a restart.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const client = require("./index");

const TOKEN = process.env.DASHBOARD_TOKEN;
const PORT = Number(process.env.PORT || 3000);
const FILE = path.join(__dirname, "stats.json");
const KEEP_DAYS = 30;
const RECENT = 50;

/* ---------------------------------- stats --------------------------------- */

const blank = { commands: {}, daily: {}, recent: [] };
let stats = blank;
try {
  stats = { ...blank, ...JSON.parse(fs.readFileSync(FILE, "utf8")) };
} catch {
  /* first run */
}

let dirty = false;
const day = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);

const prune = () => {
  const cutoff = day(Date.now() - KEEP_DAYS * 86400000);
  for (const d of Object.keys(stats.daily)) if (d < cutoff) delete stats.daily[d];
};

setInterval(() => {
  if (!dirty) return;
  dirty = false;
  prune();
  fs.writeFile(FILE, JSON.stringify(stats), (e) =>
    e ? console.error("stats write failed:", e.message) : null
  );
}, 10000).unref();

const track = (name, meta = {}) => {
  stats.commands[name] = (stats.commands[name] || 0) + 1;
  stats.daily[day()] ||= {};
  stats.daily[day()][name] = (stats.daily[day()][name] || 0) + 1;
  stats.recent.unshift({ at: Date.now(), name, ...meta });
  stats.recent.splice(RECENT);
  dirty = true;
};

client.on("guildCreate", (g) => track("joined server", { guild: g.name }));
client.on("guildDelete", (g) => track("left server", { guild: g.name }));

/* ---------------------------------- data ---------------------------------- */

const snapshot = () => {
  const guilds = [...client.guilds.cache.values()]
    .map((g) => ({
      id: g.id,
      name: g.name,
      members: g.memberCount || 0,
      channels: g.channels.cache.size,
      joined: g.joinedTimestamp,
    }))
    .sort((a, b) => b.members - a.members);

  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = day(Date.now() - i * 86400000);
    const total = Object.values(stats.daily[d] || {}).reduce((a, b) => a + b, 0);
    days.push({ day: d, total });
  }

  return {
    bot: client.user ? client.user.tag : "connecting…",
    servers: guilds.length,
    users: guilds.reduce((a, g) => a + g.members, 0),
    items: client.items.size,
    ping: Math.max(0, Math.round(client.ws.ping)),
    uptime: Math.round(process.uptime()),
    memory: Math.round(process.memoryUsage().rss / 1048576),
    guilds,
    commands: Object.entries(stats.commands).sort((a, b) => b[1] - a[1]),
    days,
    recent: stats.recent,
  };
};

/* --------------------------------- server --------------------------------- */

const authed = (given) => {
  const a = Buffer.from(String(given || ""));
  const b = Buffer.from(TOKEN);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

if (!TOKEN) {
  console.log(
    "Dashboard disabled: set DASHBOARD_TOKEN to enable it (it exposes server names and member counts)."
  );
} else {
  http
    .createServer((req, res) => {
      const url = new URL(req.url, "http://localhost");
      const key =
        url.searchParams.get("key") ||
        (req.headers.authorization || "").replace(/^Bearer /, "");

      if (!authed(key)) {
        res.writeHead(401, { "content-type": "text/plain" });
        return res.end("Unauthorized — append ?key=DASHBOARD_TOKEN");
      }

      if (url.pathname === "/api/stats") {
        res.writeHead(200, { "content-type": "application/json" });
        return res.end(JSON.stringify(snapshot()));
      }

      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(page(key));
    })
    .listen(PORT, () =>
      console.log(`Dashboard: http://localhost:${PORT}/?key=${TOKEN}`)
    );
}

/* ---------------------------------- page ---------------------------------- */

const page = (key) => `<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Niaan JV — Dashboard</title>
<style>
  :root{--bg:#0e1116;--card:#161b22;--line:#242c38;--fg:#e6edf3;--dim:#8b949e;--accent:#27476e;--hi:#4c8bf5}
  *{box-sizing:border-box}
  body{margin:0;padding:24px;background:var(--bg);color:var(--fg);font:14px/1.5 ui-sans-serif,system-ui,-apple-system,sans-serif}
  h1{font-size:18px;margin:0 0 2px}
  .sub{color:var(--dim);font-size:13px;margin-bottom:20px}
  .grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:20px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
  .k{color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:.06em}
  .v{font-size:26px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums}
  .cols{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(330px,1fr))}
  h2{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--dim);margin:0 0 12px}
  table{width:100%;border-collapse:collapse}
  td{padding:6px 0;border-bottom:1px solid var(--line);vertical-align:top}
  tr:last-child td{border-bottom:0}
  td.n{text-align:right;color:var(--dim);font-variant-numeric:tabular-nums;white-space:nowrap;padding-left:12px}
  .scroll{max-height:420px;overflow:auto}
  .bars{display:flex;align-items:flex-end;gap:4px;height:110px}
  .bar{flex:1;background:var(--hi);border-radius:3px 3px 0 0;min-height:2px;opacity:.85}
  .bar:hover{opacity:1}
  .axis{display:flex;justify-content:space-between;color:var(--dim);font-size:11px;margin-top:6px}
  .who{color:var(--dim);font-size:12px}
  .empty{color:var(--dim)}
</style>
<h1>Niaan JV</h1>
<div class="sub" id="sub">loading…</div>
<div class="grid" id="tiles"></div>
<div class="cols">
  <div class="card"><h2>Commands used per day (14d)</h2><div class="bars" id="bars"></div><div class="axis" id="axis"></div></div>
  <div class="card"><h2>Command totals</h2><table id="cmds"></table></div>
  <div class="card"><h2>Servers</h2><div class="scroll"><table id="guilds"></table></div></div>
  <div class="card"><h2>Recent activity</h2><div class="scroll"><table id="recent"></table></div></div>
</div>
<script>
const KEY = ${JSON.stringify(key)};
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num = n => n.toLocaleString();
const dur = s => [Math.floor(s/86400)+'d', Math.floor(s%86400/3600)+'h', Math.floor(s%3600/60)+'m'].join(' ');
const ago = t => { const s=(Date.now()-t)/1000;
  return s<60?'just now':s<3600?Math.floor(s/60)+'m ago':s<86400?Math.floor(s/3600)+'h ago':Math.floor(s/86400)+'d ago'; };
const rows = (el, data, empty) => el.innerHTML = data.length
  ? data.map(r => '<tr><td>'+r[0]+'</td><td class="n">'+r[1]+'</td></tr>').join('')
  : '<tr><td class="empty">'+empty+'</td></tr>';

async function load(){
  const d = await (await fetch('/api/stats?key='+encodeURIComponent(KEY))).json();

  sub.textContent = d.bot + ' · up ' + dur(d.uptime) + ' · ' + d.ping + 'ms · ' + d.memory + 'MB';

  tiles.innerHTML = [['Servers',num(d.servers)],['Users',num(d.users)],['Items cached',num(d.items)],
    ['Commands run',num(d.commands.reduce((a,c)=>a+c[1],0))]]
    .map(([k,v]) => '<div class="card"><div class="k">'+k+'</div><div class="v">'+v+'</div></div>').join('');

  const max = Math.max(1, ...d.days.map(x=>x.total));
  bars.innerHTML = d.days.map(x =>
    '<div class="bar" style="height:'+Math.max(2,x.total/max*100)+'%" title="'+x.day+': '+x.total+'"></div>').join('');
  axis.innerHTML = '<span>'+d.days[0].day.slice(5)+'</span><span>'+d.days.at(-1).day.slice(5)+'</span>';

  rows(cmds, d.commands.map(([n,c]) => [esc(n), num(c)]), 'no commands run yet');
  rows(guilds, d.guilds.map(g => [esc(g.name), num(g.members)+' users']), 'no servers');
  rows(recent, d.recent.map(r => [
    esc(r.name) + (r.guild ? ' <span class="who">· '+esc(r.guild)+'</span>' : '')
                + (r.user  ? ' <span class="who">· '+esc(r.user)+'</span>'  : ''),
    ago(r.at)]), 'nothing yet');
}
load(); setInterval(load, 10000);
</script>`;

module.exports = { track };
