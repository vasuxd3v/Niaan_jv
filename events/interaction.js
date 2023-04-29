const { MessageEmbed } = require("discord.js");
const client = require("../index");

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    let cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;

    if (cmd.defer)
      await interaction.deferReply({ ephemeral: true }).catch((e) => null);

    let { options } = interaction;

    cmd.run(client, interaction, options);
  } else if (interaction.isAutocomplete()) {
    const search = interaction.options.getString("name");

    const items = client.items;
    let find = items.filter(
      (i) => i.name && i.name.toLowerCase().startsWith(search.toLowerCase())
    );

    if (find.size > 25) find = find.first(25);

    await interaction
      .respond(
        find.map((f) => {
          return {
            name: f.name,
            value: f.name.toLowerCase(),
          };
        })
      )
      .catch((e) => {});
  } else if (interaction.isModalSubmit()) {
    const { fields, customId } = interaction;
    if (customId === "feedback") {
      const feedback = fields.getTextInputValue("feedbacktext");
      const privateChannel = await client.channels.fetch(process.env.channel);

      await interaction.reply({
        content: "Your feedback has been successfully sent! Thank you so much!",
        ephemeral: true,
      });

      await privateChannel.send({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: interaction.user.username,
              iconURL: interaction.user.displayAvatarURL(),
            })
            .setTitle("New Feedback!")
            .setDescription(`\`\`\`${feedback}\`\`\``)
            .setColor("#27476e"),
        ],
      });
    }
  }
});
