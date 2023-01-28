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
fs.readdirSync("./handler").forEach((file) => {
  require(`./handler/${file}`);
});

/* SPREADSHEET */
const { GoogleSpreadsheet } = require("google-spreadsheet");

const convert = {
  car: "JV || Vehicles",
  rim: "JV || Rims"
};

const creds = require("./creds.json");
const sheets = new GoogleSpreadsheet(
  //"1mmR4448P7jtQFhavvjVyw89laDFYt9RCrGq49-NMC48"
  "1M5sv4lnwe8wyhs8juPzaCdhd7t4Jc9d6aInmQhOiMns"
);

client.getItems = async (item) => {
  await sheets.useServiceAccountAuth(creds);

  await sheets.loadInfo();
  const rows = await sheets.sheetsByTitle[convert[item]].getRows();
  return rows.map((row) => {
    const [a, name, b, cost] = row._rawData;
    return {
      name: name ? name.replaceAll(" ", "") : name,
      cost,
    };
  }).filter((r) => r.name && r.cost);
};

Object.defineProperty(Array.prototype, "pager", {
  value: function (n) {
    return Array.from(Array(Math.ceil(this.length / n)), (_, i) =>
      this.slice(i * n, i * n + n)
    );
  },
});

// easy json convert
const costs = fs.readFileSync("./costs.txt").toString().split("\r\n");
const cars = fs.readFileSync("./cars.txt").toString().split("\r\n");

cars.forEach((car, i) => {
  fs.appendFileSync(
    "./end.txt",
    `{ "name": "${car}", "cost": "${costs[i]}" },\n`,
    "utf-8"
  );
});

client.login(process.env.token);
