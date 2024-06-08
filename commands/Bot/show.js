const {
  MessageEmbed,
  CommandInteraction,
  CommandInteractionOptionResolver,
  Client,
  MessageActionRow,
  MessageButton,
} = require("discord.js");

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
   * @param {CommandInteraction} context
   * @param {CommandInteractionOptionResolver | String[]} options
   * @param {Boolean} isMessage
   */
  run: async (client, context, options, isMessage) => {
    const category = options.getString("category");
    const items = await client.getItems(category);
    
    const details = {
      user: isMessage ? context.author : context.user,
    };

    if (items.length === 0)
      return await context.reply({
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
        .setColor("#27476e")
        .setFooter({
          text: `Page: ${i + 1}/${pages.length}\nDeveloper - spiteimagine`,
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
    const msg = await context.reply({
      embeds: [embeds[page]],
      components,
      fetchReply: true,
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === details.user.id,
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
