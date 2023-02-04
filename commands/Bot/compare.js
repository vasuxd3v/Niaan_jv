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
    const titles = await client.getTitles();
    const itemsPromise = await Promise.all(
      titles.map(async (t) => await client.getItems(client.nameFormat(t)))
    );
    const items = [].concat(...itemsPromise).filter((i) => i.name);

    const makeEmbed = (text) => {
      return new MessageEmbed().setTitle(text).setColor("#27476e");
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
      time: 45000,
      max: 2,
    });

    const lists = [];
    let err = false;
    let derr = false;

    collector.on("collect", async (message) => {
      const seperated = message.content.split(",").filter((m) => m);
      const founds = [];
      const list = seperated
        .map((c) => {
          const split = c.trim().split(" ");
          const amount = Number(split[0]);
          const ltrim = isNaN(amount)
            ? split[0].trim().toLowerCase()
            : split[1].trim().toLowerCase();
          if (founds.includes(ltrim)) return;

          const found = items.find((i) => i.name.toLowerCase() === ltrim);
          if (!found) {
            err = true;
            return;
          }
          found.name = ltrim;

          const dupes = seperated.filter((n) => {
            let sp = n.trim().split(" ");
            return sp[sp.length > 1 ? 1 : 0].toLowerCase() === ltrim;
          }).length;

          if (dupes > 1) {
            founds.push(ltrim);
            return (derr = true);
          } else return isNaN(amount) ? [1, found] : [amount, found];
        })
        .filter((l) => l);

      if (list.length > 8) {
        await interaction.followUp({
          content: interaction.user.toString(),
          embeds: [
            makeEmbed(`You are only allowed to send a maximum of 8 items!`),
          ],
        });
        return collector.options.max++;
      }

      if (err) {
        await interaction.followUp({
          content: interaction.user.toString(),
          embeds: [
            makeEmbed(
              `Please provide valid items! Use \`/show\` command for all available items!`
            ),
          ],
        });
        err = false;
        return collector.options.max++;
      } else if (derr) {
        await interaction.followUp({
          content: interaction.user.toString(),
          embeds: [
            makeEmbed(`You are not allowed to provide duplicate items!!`),
          ],
        });
        derr = false;
        return collector.options.max++;
      }

      if (lists.length < 1) {
        await interaction.followUp({
          content: interaction.user.toString(),
          embeds: [makeEmbed(`Please send the second set of items!`)],
        });

        lists.push(list);
        return collector.options.max++;
      }

      const mapped = [lists[0], list].map((l) => {
        return l.map((value) => {
          const [amount, item] = value;
          return {
            cost: amount * Number(item.value.replace("M", "")),
            demand: amount * Number(item.demand),
          };
        });
      });

      const reduce = (t, v) =>
        t.reduce((prev, current) => {
          return Number(Number(prev + current[v]).toFixed(2));
        }, 0);

      const totals = mapped.map((t, i) => {
        let ob = {};
        ob[`cost${i + 1}`] = reduce(t, "cost");
        ob[`demand${i + 1}`] = reduce(t, "demand");
        return ob;
      });

      const { cost1, demand1 } = totals[0];
      const { cost2, demand2 } = totals[1];

      const map = (arr) =>
        arr.map((a) => `${a[0] > 1 ? `${a[0]} ` : ""}${a[1].name}`).join(", ");

      let st = `**First set (${cost1}M):** \`\`\`${map(
        lists[0]
      )}\`\`\`\n**Second set (${cost2}M):** \`\`\`${map(list)}\`\`\``;

      let value;
      const format = (s) => `**\`${Number(s).toFixed(2)}M\`**`;

      let w1 = `The first set is winning by ${format(cost1 - cost2)}!`;
      let w2 = `The second set is winning by ${format(cost2 - cost1)}!`;
      let d1 = "**winning** by demand!";
      let d2 = "**loosing** by demand!";

      if (cost1 > cost2 && demand1 > demand2) value = `${w1} And ${d1}`;
      if (cost1 > cost2 && demand2 > demand1) value = `${w1} But ${d2}`;
      if (cost2 > cost1 && demand2 > demand1) value = `${w2} And ${d1}`;
      if (cost2 > cost1 && demand1 > demand2) value = `${w2} But ${d2}`;
      if (cost1 === cost2 && demand1 > demand2)
        value = `Its a draw! But first set is ${d1}`;
      if (cost1 === cost2 && demand2 > demand1)
        value = `Its a draw! But second set is ${d1}`;

      await interaction.followUp({
        content: `Requested by: ${interaction.user.toString()}`,
        embeds: [
          new MessageEmbed()
            .setDescription(`${st}\n${value}`)
            .setColor("#27476e"),
        ],
      });
    });
  },
};
