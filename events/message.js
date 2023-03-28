const client = require("../index");
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  let prefix = process.env.prefix;
  if (message.mentions.users.first()?.id === client.user.id)
    prefix = client.user.toString();

  let args = message.content.split(" ");
  const first = args.shift();
  const cmd =
    first === client.user.toString()
      ? args.shift()
      : first.replace(prefix, "").toLowerCase();

  const command =
    client.commands.get(cmd) ||
    client.commands.find((cm) => cm.aliases && cm.aliases.includes(cmd));

  if (!command) return;
  if (command?.options) {
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

    command.run(client, message, options, true);
  } else command.run(client, message, args, true);
});
