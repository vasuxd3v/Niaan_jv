const {
  MessageEmbed,
  CommandInteraction,
  CommandInteractionOptionResolver,
  Client,
} = require("discord.js");

module.exports = {
  name: "view",
  description: "View detail on any particular item!",
  options: [
    {
      name: "name",
      required: true,
      type: "STRING",
      description: "The name of item you are searching for.",
    },
  ],
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {CommandInteractionOptionResolver} options
   */
  run: async (client, interaction, options) => {
    const item = options.getString("name");

    const titles = await client.getTitles();
    const itemsPromise = await Promise.all(
      await titles.map(async (t) => await client.getItems(client.nameFormat(t)))
    );

    const items = []
      .concat(...itemsPromise)
      .filter((i) => i.name && i.name.toLowerCase() === item.toLowerCase());
    const found = items[0];
    if (!found)
      return await interaction.followUp({
        content: `${interaction.user}, this item does not exist! Use \`/show\` command to see the list of available items!!`,
        allowedMentions: {
          users: [interaction.user.id],
        },
      });

    const embed = new MessageEmbed().setTitle(found.name).setColor("#27476e");
    const vs = Object.entries(found);
    vs.forEach((v) => {
      const [k, n] = v;
      const format = k.charAt(0).toUpperCase() + k.slice(1).toLowerCase();
      embed.addFields([
        {
          name: format,
          value: `**\`${n}\`**`,
        },
      ]);
    });

    await interaction.followUp({
      content: interaction.user.toString(),
      embeds: [embed],
    });
  },
};
