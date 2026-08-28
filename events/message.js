const { Events } = require("discord.js");
const client = require("../index");
const { track } = require("../dashboard");

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  let prefix = process.env.prefix || 'q.'; // Ensure prefix is defined
  if (message.mentions.users.first()?.id === client.user.id)
    prefix = client.user.toString();

  if (!message.content.startsWith(prefix)) return; // Only proceed if the message starts with the prefix

  let args = message.content.slice(prefix.length).trim().split(/ +/); // Slice off the prefix
  const cmd = args.shift().toLowerCase(); // Get the command name

  const command =
    client.commands.get(cmd) ||
    client.commands.find((cm) => cm.aliases && cm.aliases.includes(cmd));

  if (!command) return; // If command does not exist, exit

  if (command.options) {
    if (command.options.length > 0) {
      let info = {
        err: false,
        msg: "",
      };

      args = command.options.map((c, i) => {
        let { name, type } = c;
        let value = args[i];
        if (!value) {
          info.err = true;
          info.msg = `\`${name}\` argument can not be empty!`;
        }

        return {
          name,
          type,
          value,
        };
      });

      if (info.err) return await message.reply(info.msg);
    }

    const options = {
      getString: (n) => {
        return args.find((a) => a?.name === n)?.value;
      },
    };

    await run(command, message, options);
  } else {
    await run(command, message, args);
  }
});

const run = async (command, message, options) => {
  track(`${process.env.prefix || "q."}${command.name}`, {
    user: message.author.username,
    guild: message.guild?.name,
  });

  try {
    await command.run(client, message, options, true);
  } catch (e) {
    console.error(`Prefix command ${command.name} failed:`, e);
    await message.reply("Something went wrong running that command.").catch(() => {});
  }
};
