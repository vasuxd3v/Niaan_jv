const {
  MessageEmbed,
  CommandInteraction,
  CommandInteractionOptionResolver,
  Client,
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
    let done = true;

    const items = await client.getItems("car");

    const makeEmbed = (text) => {
      return new MessageEmbed().setTitle(text).setColor("GOLD");
    };

    await interaction.followUp({
      content: interaction.user.toString(),
      embeds: [
        makeEmbed(
          `Please send the first set of items!\nMake sure to seperate each item with a comma \`,\`!`
        ),
      ],
    });

    const collector = interaction.channel.createMessageCollector({
      filter: (m) => m.author.id === interaction.user.id,
      time: 60000,
      max: 2,
    });

    const msgs = [];

    collector.on("collect", async (m) => {
      const list = m.content.split(",");
      const filter = list.map((f) => {
        if (
          !items.find(
            (item) =>
              item.name.toLowerCase() === f.replace(" ", "").toLowerCase()
          )
        )
          return false;
      });

      if (list.length > 8) {
        await interaction.followUp({
          content: interaction.user.toString(),
          embeds: [
            makeEmbed(`You are only allowed to send a maximum of 8 items!`),
          ],
        });
        return collector.options.max++;
      }

      if (filter.filter((fi) => fi === false).length > 0) {
        await interaction.followUp({
          content: interaction.user.toString(),
          embeds: [
            makeEmbed(
              `Please provide valid items! Use the above list!`
            ).setDescription(
              `\`\`\`${items.map((c) => c.name).join(", ")}\`\`\``
            ),
          ],
        });
        return collector.options.max++;
      }

      if (done) {
        done = false;
        await interaction.followUp({
          content: interaction.user.toString(),
          embeds: [makeEmbed(`Please send the second set of items!`)],
        });

        msgs.push(m);
        return collector.options.max++;
      } else {
        msgs.push(m);
        return collector.stop();
      }
    });

    collector.on("end", async (ms) => {
      const listOf = [];

      const mapped = msgs.map((m) => {
        let curr = [];
        const map = m.content.split(",").map((co) => {
          co = co.replace(" ", "").toLowerCase();
          const item = items.find((c) => c.name.toLowerCase() === co);
          if (!item) return;
          curr.push(item.name);
          return Number(item.cost.replace("M", ""));
        });

        listOf.push(curr);
        return map;
      });

      const totals = mapped.map((t) => {
        return t.reduce((prev, current) => {
          return Number(Number(prev + current).toFixed(2));
        }, 0);
      });

      const set1 = totals[0];
      const set2 = totals[1];
      let st = `**First set (${set1}M):** \`\`\`${listOf[0].join(
        ", "
      )}\`\`\`\n**Second set (${set2}M):** \`\`\`${listOf[1].join(", ")}\`\`\``;
      let t;
      const format = (s) => `**\`${Number(s).toFixed(2)}M\`**`;

      if (set1 > set2)
        t = `The first set is winning by ${format(set1 - set2)}!`;
      else if (set1 === set2) t = `It ends in a draw!`;
      else if (set1 < set2)
        t = `The second set is winning by ${format(set2 - set1)}!`;

      await interaction.followUp({
        content: interaction.user.toString(),
        embeds: [
          new MessageEmbed().setDescription(`${st}\n${t}`).setColor("GOLD"),
        ],
      });
    });
  },
};
