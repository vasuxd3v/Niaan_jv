const client = require("../index");

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    await interaction.deferReply().catch((e) => null);

    let cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;

    let { options } = interaction;

    cmd.run(client, interaction, options);
  }
});
