const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

module.exports = client;
client.commands = new Collection();
client.items = new Collection();

/* SPREADSHEET */
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");

// creds come from GOOGLE_CREDENTIALS (raw JSON, for hosts with no filesystem)
// or ./creds.json locally.
const creds = process.env.GOOGLE_CREDENTIALS
  ? JSON.parse(process.env.GOOGLE_CREDENTIALS)
  : require("./creds.json");

const auth = new JWT({
  email: creds.client_email,
  key: creds.private_key.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = new GoogleSpreadsheet(
  process.env.SHEET_ID || "1IH3zqEs1YPXVL8PXabMnCpd9XYDvDifV15_A24ZmQjY",
  auth
);

// loadInfo() is a network round trip and used to run 2x per getItems(); cache it
// so a slash command doesn't blow the 3s interaction ack window.
let loadedAt = 0;
const load = async () => {
  if (Date.now() - loadedAt < 60_000) return;
  await sheets.loadInfo();
  loadedAt = Date.now();
};

client.nameFormat = (n) => (n.split(" || ")[1] || n).toLowerCase();

client.getTitles = async () => {
  await load();
  return Object.keys(sheets.sheetsByTitle);
};

client.getItems = async (item) => {
  const sheet = (await client.getTitles()).find((t) =>
    t.toLowerCase().includes(item)
  );
  if (!sheet) return [];

  const sheetObj = sheets.sheetsByTitle[sheet];
  const rows = await sheetObj.getRows();

  return rows.map((row) => {
    const obj = {};
    for (const [key, value] of Object.entries(row.toObject())) {
      if (value) obj[key.toLowerCase()] = String(value).trim();
    }
    obj.category = sheet.replace("JV || ", "");
    return obj;
  });
};

client.pager = (arr, n) =>
  Array.from(Array(Math.ceil(arr.length / n)), (_, i) =>
    arr.slice(i * n, i * n + n)
  );

for (const file of fs.readdirSync(path.join(__dirname, "handler"))) {
  require(path.join(__dirname, "handler", file));
}

require("./dashboard");

// A crash here takes the bot down in every server it's in; log and stay up.
process.on("unhandledRejection", (e) => console.error("Unhandled rejection:", e));
process.on("uncaughtException", (e) => console.error("Uncaught exception:", e));

client.login(process.env.token || process.env.TOKEN);
