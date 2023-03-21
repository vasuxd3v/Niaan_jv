const client = require("../index");

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    await interaction.deferReply().catch((e) => null);

    let cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;

    let { options } = interaction;

    cmd.run(client, interaction, options);
  } else if (interaction.isAutocomplete()) {
    const search = interaction.options.getString("name");

    const items = client.items;
    let find = items.filter(
      (i) => i.name && i.name.toLowerCase().startsWith(search.toLowerCase())
    );

    if (find.size > 25) find = find.first(25);

    await interaction.respond(
      find.map((f) => {
        return {
          name: f.name,
          value: f.name.toLowerCase(),
        };
      })
    ).catch(e => {});
  }
});
