const {
  MessageEmbed,
  CommandInteraction,
  CommandInteractionOptionResolver,
  Client,
  MessageActionRow,
  MessageButton,
  Modal,
  TextInputComponent,
} = require("discord.js");

module.exports = {
  name: "compare",
  description: "Compare your items!",
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {CommandInteractionOptionResolver} options
   */
  run: async (client, interaction, options) => {
    const titles = await client.getTitles();
    const itemsPromise = await Promise.all(
      titles.map(async (t) => await client.getItems(client.nameFormat(t)))
    );
    const items = [].concat(...itemsPromise).filter((i) => i.name);

    const makeEmbed = (text) => {
      return new MessageEmbed().setTitle(text).setColor("#27476e");
    };

    const thread = await interaction.channel.threads.create({
      name: `${interaction.user.username}-thread`,
      type: "GUILD_PRIVATE_THREAD",
    });

    await interaction.followUp({
      content: interaction.user.toString(),
      embeds: [makeEmbed(`Please move to your private thread ${thread}!`)],
    });

    const qns = [
      `Hey! Welcome to your thread, use the button below to enter the first set of items!`,
    ];

    const rows = qns.map((q, i) => {
      return [
        new MessageActionRow().addComponents([
          new MessageButton()
            .setCustomId(`set${i + 1}`)
            .setLabel("Enter items")
            .setStyle("SUCCESS"),
        ]),
        new Modal()
          .setTitle("Set 1 items")
          .setCustomId(`set${i + 1}modal`)
          .setComponents([
            new MessageActionRow().addComponents([
              new TextInputComponent()
                .setLabel("Items")
                .setPlaceholder("Your items")
                .setRequired(true)
                .setStyle("SHORT")
                .setCustomId(`set${i + 1}text`),
            ]),
          ]),
      ];
    });

    let count = 0;
    const collect = async () => {
      const row = rows[count];
      const msg = await thread.send({
        content: interaction.user.toString(),
        embeds: [makeEmbed(qns[count])],
        components: [row[0]],
      });

      const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 15000,
        max: 1,
      });

      collector.on("collect", async (i) => {
        i.showModal(row[1]);
        count++;
        await collect();
      });
    };

    await collect();

    //Inactive timeout
    // setTimeout(async () => {
    //   if (
    //     thread.messages.cache.filter((m) => m.author.id === interaction.user.id)
    //       .size < 1
    //   ) {
    //     await thread.delete();
    //     await interaction.followUp({
    //       content: interaction.user.toString(),
    //       embeds: [
    //         makeEmbed(
    //           `Your thread was deleted as you were inactive for \`60\` seconds!`
    //         ),
    //       ],
    //     });
    //   }
    // }, 60000);
  },
};
