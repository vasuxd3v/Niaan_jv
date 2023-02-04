const {
  MessageEmbed,
  CommandInteraction,
  CommandInteractionOptionResolver,
  Client,
  MessageActionRow,
  MessageButton,
} = require("discord.js");

const mclient = require("../../index.js");

module.exports = {
  name: "show",
  description: "Show the list of items, that you can compare!",
  options: [
    {
      name: "category",
      type: "STRING",
      required: true,
      description: "The category of the items to show.",
    },
  ],
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {CommandInteractionOptionResolver} options
   */
  run: async (client, interaction, options) => {
    const category = options.getString("category");
    const items = await client.getItems(category);

    if (items.length === 0)
      return await interaction.followUp({
        content: "Theres currently no item available in this category!",
        ephemeral: true,
      });

    const pages = items.pager(8);
    const embeds = pages.map((p, i) => {
      const embed = new MessageEmbed()
        .setTitle(`List of items:`)
        .setDescription(
          p
            .map(
              (t) =>
                `**${t.name}**:\n» \`Cost\`: **\`${t.value}\`** | \`Brulee\`: **\`${t.brulee}\`** | \`Demand\`: **\`${t.demand}\`**`
            )
            .join("\n\n")
        )
        .setColor("GOLD")
        .setFooter({
          text: `Page: ${i + 1}/${pages.length}`,
        });

      return embed;
    });

    const components = [
      new MessageActionRow().setComponents(
        new MessageButton()
          .setStyle("DANGER")
          .setEmoji("⬅️")
          .setCustomId("left"),
        new MessageButton()
          .setStyle("SUCCESS")
          .setEmoji("➡️")
          .setCustomId("right")
      ),
    ];

    let page = 0;
    const msg = await interaction.followUp({
      embeds: [embeds[page]],
      components,
      fetchReply: true,
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      idle: 15000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();

      const { customId } = i;
      switch (customId) {
        case "right":
          page + 1 === embeds.length ? (page = 0) : page++;
          await msg.edit({
            embeds: [embeds[page]],
          });

          break;
        case "left":
          page === 0 ? (page = embeds.length - 1) : page--;
          await msg.edit({
            embeds: [embeds[page]],
          });

          break;
      }
    });
  },
};
