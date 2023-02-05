const chalk = require("chalk");
const fs = require("fs");
const { readdirSync } = fs;
const client = require("../index");

const commands = [];

//SLASH COMMANDS
console.log(chalk.blue.bold("SLASH COMMANDS 🟢"));
readdirSync("./commands").forEach(async (dir) => {
  const cmds = readdirSync(`./commands/${dir}/`).filter((file) =>
    file.endsWith(".js")
  );

  cmds.map(async (cmd) => {
    let file = require(`../commands/${dir}/${cmd}`);

    let name = file.name || "No command name.";
    let description = file.description || "No description.";

    const data = {
      name,
      description,
      options: file.options,
    };

    let option = name === "No command name." ? "❌" : "✅";

    console.log(`Loaded Slash Command ${option} | ${name}`);

    if (option === "✅") {
      if (name === "show")
        data.options[0].choices = (await client.getTitles()).map((f) => {
          return {
            name: client.nameFormat(f),
            value: client.nameFormat(f),
          };
        });

      client.commands.set(name, {
        ...data,
        run: file.run,
      });

      commands.push(data);
    }
  });
});

client.on("ready", async () => {
  const g = await client.guilds.fetch("1048657710633197648");
  await g.commands.set(commands);
  console.log(chalk.green.blue.bold("Commands set!"));
});

console.log("-".repeat(30));

//EVENTS
console.log(chalk.yellow.bold("EVENTS 🟢"));
readdirSync("./events").forEach(async (event) => {
  const eventName = event.replace(".js", "");
  require(`../events/${event}`);
  console.log("Loaded Event ✅ | " + eventName);
});

console.log("-".repeat(30));
