const fs = require("fs");
const Discord = require("discord.js");
require("dotenv").config();
const config = require("./testconfig.json");

const client = new Discord.Client({
  intents: [
    "GUILDS",
    "GUILD_PRESENCES",
    "GUILD_MEMBERS",
    "GUILD_MESSAGES",
    "GUILD_MESSAGE_REACTIONS",
  ],
  partials: ["GUILD_MEMBER", "CHANNEL", "REACTION", "USER"],
});

module.exports = client;
client.commands = new Discord.Collection();

/* SPREADSHEET */
const { GoogleSpreadsheet } = require("google-spreadsheet");
const creds = require("./creds.json");
const sheets = new GoogleSpreadsheet(
  "1M5sv4lnwe8wyhs8juPzaCdhd7t4Jc9d6aInmQhOiMns"
);

(async () => {
  await sheets.useServiceAccountAuth(creds); // LOAD
})();

client.nameFormat = (n) => n.split(" || ")[1].toLowerCase();
client.config = config;

client.getTitles = async () => {
  await sheets.loadInfo();
  return Object.keys(sheets.sheetsByTitle);
};

client.getItems = async (item) => {
  await sheets.loadInfo();

  const sheet = (await client.getTitles()).find((t) =>
    t.toLowerCase().includes(item)
  );

  const rows = await sheets.sheetsByTitle[sheet]?.getRows();
  return rows?.map((row) => {
    const data = row._rawData;
    const headers = row._sheet.headerValues;
    const obj = {};
    data.forEach((o, i) =>
      o ? (obj[headers[i].toLowerCase()] = o.trim()) : null
    );
    obj.category = sheet.replace("JV || ", "");
    return obj;
  });
};

client.items = new Discord.Collection();

Object.defineProperty(Array.prototype, "pager", {
  value: function (n) {
    return Array.from(Array(Math.ceil(this.length / n)), (_, i) =>
      this.slice(i * n, i * n + n)
    );
  },
});

fs.readdirSync("./handler").forEach((file) => {
  require(`./handler/${file}`);
});

client.login(config.yes ? config.token : process.env.token);

