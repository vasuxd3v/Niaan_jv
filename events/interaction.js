const { EmbedBuilder, Events, MessageFlags } = require("discord.js");
const client = require("../index");
const { track } = require("../dashboard");

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;

    if (cmd.defer) {
      await interaction
        .deferReply(cmd.ephemeral ? { flags: MessageFlags.Ephemeral } : {})
        .catch(() => null);
    }

    track(`/${interaction.commandName}`, {
      user: interaction.user.username,
      guild: interaction.guild?.name,
    });

    try {
      await cmd.run(client, interaction, interaction.options);
    } catch (e) {
      console.error(`Command ${interaction.commandName} failed:`, e);
      const fail = {
        content: "Something went wrong running that command.",
        flags: MessageFlags.Ephemeral,
      };
      await (interaction.deferred || interaction.replied
        ? interaction.followUp(fail)
        : interaction.reply(fail)
      ).catch(() => null);
    }
  } else if (interaction.isAutocomplete()) {
    const search = interaction.options.getString("name") || "";

    let find = client.items.filter(
      (i) => i.name && i.name.toLowerCase().startsWith(search.toLowerCase())
    );

    if (find.size > 25) find = find.first(25);

    await interaction
      .respond(
        find.map((f) => ({
          name: f.name,
          value: f.name.toLowerCase(),
        }))
      )
      .catch(() => {});
  } else if (interaction.isModalSubmit()) {
    const { fields, customId } = interaction;
    if (customId === "feedback") {
      const feedback = fields.getTextInputValue("feedbacktext");

      await interaction.reply({
        content: "Your feedback has been successfully sent! Thank you so much!",
        flags: MessageFlags.Ephemeral,
      });

      if (!process.env.channel) return;
      const privateChannel = await client.channels
        .fetch(process.env.channel)
        .catch(() => null);
      if (!privateChannel) return;

      await privateChannel.send({
        embeds: [
          new EmbedBuilder()
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
