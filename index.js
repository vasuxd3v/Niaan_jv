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

<<<<<<< HEAD
=======
const convert = {
  car: "JV || Vehicles",
  rim: "JV || Rims"
};

>>>>>>> 4718201b1614a8596e183e337354d3ceabbaf383
const creds = require("./creds.json");
const sheets = new GoogleSpreadsheet(
  "1M5sv4lnwe8wyhs8juPzaCdhd7t4Jc9d6aInmQhOiMns"
);

(async () => {
  await sheets.useServiceAccountAuth(creds); // LOAD
})();

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

  const rows = await sheets.sheetsByTitle[sheet].getRows();
  return rows.map((row) => {
    const data = row._rawData;
    // if(data[0] !== "") console.log(data);
    const headers = row._sheet.headerValues;
    const obj = {};
    data.forEach((o, i) =>
      o ? (obj[headers[i].toLowerCase()] = o.trim()) : null
    );
    obj.category = sheet.replace("JV || ", "");
    return obj;
  });
};

// (async() => {
//   console.log(await client.getItems("spoilers"))
// })()

Object.defineProperty(Array.prototype, "pager", {
  value: function (n) {
    return Array.from(Array(Math.ceil(this.length / n)), (_, i) =>
      this.slice(i * n, i * n + n)
    );
  },
});

<<<<<<< HEAD
fs.readdirSync("./handler").forEach((file) => {
  require(`./handler/${file}`);
});
=======
>>>>>>> 4718201b1614a8596e183e337354d3ceabbaf383
client.login(process.env.token);
