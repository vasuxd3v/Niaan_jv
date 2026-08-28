const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ApplicationCommandOptionType,
} = require("discord.js");

module.exports = {
  name: "show",
  // Sheets round trip can outlast Discord's 3s ack window.
  defer: true,
  description: "Show the list of items, that you can compare!",
  options: [
    {
      name: "category",
      type: ApplicationCommandOptionType.String,
      required: true,
      description: "The category of the items to show.",
    },
  ],
  run: async (client, context, options, isMessage) => {
    const category = options.getString("category");
    const items = await client.getItems(category);

    const user = isMessage ? context.author : context.user;
    // after deferReply() the follow-up has to be an edit, not a fresh reply
    const send = (data) =>
      !isMessage && (context.deferred || context.replied)
        ? context.editReply(data)
        : context.reply(data);

    if (items.length === 0)
      return await send({
        content: "Theres currently no item available in this category!",
      });

    const pages = client.pager(items, 8);
    const embeds = pages.map((p, i) =>
      new EmbedBuilder()
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
        })
    );

    const components = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Danger)
          .setEmoji("⬅️")
          .setCustomId("left"),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Success)
          .setEmoji("➡️")
          .setCustomId("right")
      ),
    ];

    let page = 0;
    const reply = await send({ embeds: [embeds[page]], components });
    // interaction replies come back as InteractionResponse, prefix replies as Message
    const msg = typeof reply.fetch === "function" ? await reply.fetch() : reply;

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === user.id,
      idle: 15000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();

      if (i.customId === "right")
        page = page + 1 === embeds.length ? 0 : page + 1;
      else if (i.customId === "left")
        page = page === 0 ? embeds.length - 1 : page - 1;

      await msg.edit({ embeds: [embeds[page]] }).catch(() => null);
    });

    collector.on("end", async () => {
      components[0].components.forEach((b) => b.setDisabled(true));
      await msg.edit({ components }).catch(() => null);
    });
  },
};
