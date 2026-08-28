const path = require("path");
const { readdirSync } = require("fs");
const { Events } = require("discord.js");
const client = require("../index");

const root = path.join(__dirname, "..");
const commands = [];

//SLASH COMMANDS
console.log("SLASH COMMANDS 🟢");
for (const dir of readdirSync(path.join(root, "commands"))) {
  const files = readdirSync(path.join(root, "commands", dir)).filter((f) =>
    f.endsWith(".js")
  );

  for (const cmd of files) {
    const file = require(path.join(root, "commands", dir, cmd));

    if (!file.name) {
      console.log(`Loaded Slash Command ❌ | ${cmd} (no command name)`);
      continue;
    }

    client.commands.set(file.name, file);
    commands.push({
      name: file.name,
      description: file.description || "No description.",
      options: file.options,
    });
    console.log(`Loaded Slash Command ✅ | ${file.name}`);
  }
}

console.log("-".repeat(30));

//EVENTS
console.log("EVENTS 🟢");
for (const event of readdirSync(path.join(root, "events"))) {
  require(path.join(root, "events", event));
  console.log("Loaded Event ✅ | " + event.replace(".js", ""));
}

console.log("-".repeat(30));

client.once(Events.ClientReady, async () => {
  try {
    // /show's category choices are the sheet tabs, so they're only known at runtime
    const show = commands.find((c) => c.name === "show");
    if (show) {
      show.options[0].choices = (await client.getTitles()).map((f) => ({
        name: client.nameFormat(f),
        value: client.nameFormat(f),
      }));
    }

    await client.application.commands.set(commands);
    console.log("Global commands set!");
  } catch (error) {
    console.error("Error setting global commands:", error);
  }
});
