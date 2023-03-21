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
          let amount, ltrim;
          let f1 = split[0];
          if (isNaN(Number(f1))) ltrim = split.join("_");
          else {
            amount = Number(f1);
            ltrim = split.slice(1, split.length).join("_");
          }
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

      let w1 = `The first set wins by ${format(cost1 - cost2)}!`;
      let w2 = `The second set wins by ${format(cost2 - cost1)}!`;
      let d1 = "**wins** by demand!";
      let d2 = "**lose** by demand!";

      if (cost1 > cost2) {
        if (demand1 > demand2) {
          value = `${w1} And the first set ${d1}`;
        } else if (demand2 > demand1) {
          value = `${w1} But the second set ${d2}`;
        } else {
          value = `${w1} And the demands are also the same for both.`;
        }
      } else if (cost2 > cost1) {
        if (demand2 > demand1) {
          value = `${w2} And the second set ${d1}`;
        } else if (demand1 > demand2) {
          value = `${w2} But the first set ${d2}`;
        } else {
          value = `${w2} And the demands are also the same for both.`;
        }
      } else {
        if (demand1 > demand2) {
          value = `Its a draw! But the first set ${d1}`;
        } else if (demand2 > demand1) {
          value = `Its a draw! But the second set ${d2}`;
        } else {
          value = `Its a draw! And the demands are also the same for both.`;
        }
      }

      await interaction.followUp({
        content: `Requested by: ${interaction.user.toString()}`,
        embeds: [
          new MessageEmbed()
            .setDescription(`${st}\n${value}`)
            .setColor("#27476e"),
        ],
      });

      collector.stop();
    });
  },
};
