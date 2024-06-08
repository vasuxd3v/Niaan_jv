const fs = require("fs");
const Discord = require("discord.js");
require("dotenv").config();

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
const {JWT} = require('google-auth-library');
const creds = require("./creds.json");
const useServiceAuth = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = new GoogleSpreadsheet('1IH3zqEs1YPXVL8PXabMnCpd9XYDvDifV15_A24ZmQjY', useServiceAuth);

client.nameFormat = (n) => n.split(" || ")[1].toLowerCase();

client.getTitles = async () => {
  await sheets.loadInfo();
  return Object.keys(sheets.sheetsByTitle);
};

client.getItems = async (item) => {
  await sheets.loadInfo();

  const sheet = (await client.getTitles()).find((t) =>
    t.toLowerCase().includes(item)
  );

  const sheetObj = sheets.sheetsByTitle[sheet];
  const rows = await sheetObj.getRows();
  const headers = sheetObj.headerValues;

  return rows.map((row) => {
    const data = row._rawData;
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

client.login(process.env.token);