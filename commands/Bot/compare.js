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
    const items = client.items;

    const makeEmbed = (text, descrip) => {
      const embed = new MessageEmbed().setTitle(text).setColor("#27476e");
      if (descrip) embed.setDescription(descrip);
      return embed;
    };

    const thread = await interaction.channel?.threads.create({
      name: `${interaction.user.username}-thread`,
      type: "GUILD_PRIVATE_THREAD",
      reason: "Private compare required.",
    });

    await thread.members.add(interaction.user.id);

    await interaction.followUp({
      content: interaction.user.toString(),
      embeds: [makeEmbed(`Please move to your private thread ${thread}!`)],
      ephemeral: true,
    });

    const row = new MessageActionRow().addComponents([
      new MessageButton()
        .setCustomId("start")
        .setLabel("☑️ Get Started!")
        .setStyle("SUCCESS"),
    ]);

    const initial = await thread.send({
      content: interaction.user.toString(),
      embeds: [
        makeEmbed(
          `Hey! Welcome to your thread, get started by clicking the button below!!`
        ),
      ],
      components: [row],
    });

    try {
      const confirmation = await initial.awaitMessageComponent({
        filter: (i) =>
          i.user.id === interaction.user.id && i.customId === "start",
        time: 20000,
      });

      await confirmation.deferUpdate().catch((e) => null);
    } catch (e) {
      if (thread) await thread.delete();
      await interaction.followUp({
        content: interaction.user.toString(),
        embeds: [
          makeEmbed(`Your thread was deleted as you did not click the button!`),
        ],
        ephemeral: true,
      });
      return;
    }

    await thread.send({
      content: interaction.user.toString(),
      embeds: [
        makeEmbed(
          `Please send the first set of items!\nMake sure to seperate each item with a comma \`,\`!`
        ),
      ],
    });

    const collector = thread.createMessageCollector({
      filter: (m) => m.author.id === interaction.user.id,
      time: 60000,
      max: 2,
    });

    const lists = [];
    let err = false,
      derr = false,
      lerr = false;

    collector.on("collect", async (message) => {
      const seperated = message.content
        .toLowerCase()
        .split(",")
        .filter((m) => m);
      const founds = [];
      const list = seperated
        .map((c) => {
          const split = c.trim().split(" ");
          let amount,
            ltrim,
            lvl = false;

          let isHyper = split.includes("hyper");

          if (isHyper) {
            lvl = split.pop();
            if (isNaN(Number(lvl)) || Number(lvl) > 5 || Number(lvl) < 1)
              return (lerr = true);
          }

          let f1 = split[0];
          if (isNaN(Number(f1))) ltrim = split.join("_");
          else {
            amount = Number(f1);
            ltrim = split.slice(1, split.length).join("_");
          }
          if (founds.includes(ltrim)) return;

          const found = !isHyper
            ? items.find(
                (i) =>
                  (i.name.toLowerCase() === ltrim && i.name.endsWith(lvl)) ||
                  i.name.toLowerCase().includes(ltrim) ||
                  ltrim.includes(i.name.toLowerCase())
              )
            : items.find(
                (i) =>
                  i.name.toLowerCase().includes(ltrim) && i.name.endsWith(lvl)
              );

          if (!found) return (err = true);

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
        await thread.send({
          content: interaction.user.toString(),
          embeds: [
            makeEmbed(`You are only allowed to send a maximum of 8 items!`),
          ],
        });
        return collector.options.max++;
      }

      if (err) {
        await thread.send({
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
        await thread.send({
          content: interaction.user.toString(),
          embeds: [
            makeEmbed(`You are not allowed to provide duplicate items!!`),
          ],
        });
        derr = false;
        return collector.options.max++;
      } else if (lerr) {
        await thread.send({
          content: interaction.user.toString(),
          embeds: [
            makeEmbed(
              `Please provide the level of the hyper (Between 1-5)! Eg: \`Hyper_red 4\``
            ),
          ],
        });
        lerr = false;
        return collector.options.max++;
      }

      const fil = list
        .map((l) => {
          const { name } = l[1];
          const details = name.split("_");
          const [iname, color, _lvl, ilvl] = details;
          return !l[1]?.value ? `${iname} ${color} ${ilvl}` : null;
        })
        .filter((v) => v);

      if (fil.length > 0) {
        await thread.send({
          content: interaction.user.toString(),
          embeds: [
            makeEmbed(
              `The following items do not have a value in the database yet!`,
              `\`\`\`${fil.join(", ")}\`\`\``
            ),
          ],
        });
        return collector.options.max++;
      }

      if (lists.length === 0) {
        await thread.send({
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
          value = `${w1} And also ${d1}`;
        } else if (demand2 > demand1) {
          value = `${w1} But ${d2}`;
        } else {
          value = `${w1} And the demands are also the same for both.`;
        }
      } else if (cost2 > cost1) {
        if (demand2 > demand1) {
          value = `${w2} And also ${d1}`;
        } else if (demand1 > demand2) {
          value = `${w2} But ${d2}`;
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

      const finalData = {
        content: `Requested by: ${interaction.user.toString()}. This thread will be deleted in \`15\`seconds!`,
        embeds: [
          new MessageEmbed()
            .setDescription(`${st}\n${value}`)
            .setColor("#27476e"),
        ],
      };

      await thread.send(finalData);

      collector.stop();
      setTimeout(async () => {
        if (thread) await thread.delete();
        finalData.content = `Requested by: ${interaction.user.toString()}!`;
        finalData.components = [
          new MessageActionRow().addComponents([
            new MessageButton()
              .setLabel("Feedback")
              .setCustomId("feedback")
              .setStyle("PRIMARY"),
          ]),
        ];

        const feedback = await interaction.channel.send(finalData);
        const fcollector = feedback.createMessageComponentCollector({
          filter: (i) =>
            i.user.id === interaction.user.id && i.customId === "feedback",
          time: 15000,
          max: 1,
        });

        fcollector.on("collect", async (i) => {
          const modal = new Modal()
            .setTitle("Feedback form")
            .setCustomId("feedback")
            .addComponents([
              new MessageActionRow().addComponents([
                new TextInputComponent()
                  .setLabel("Feedback")
                  .setCustomId("feedbacktext")
                  .setPlaceholder("Your feedback.")
                  .setStyle("PARAGRAPH")
                  .setRequired(true),
              ]),
            ]);

          await i.showModal(modal);
        });

        fcollector.on("end", async (c, r) => {
          if (r === "time") {
            finalData.components[0].components[0].setDisabled(true);
            await feedback.edit(finalData);
          }
        });
      }, 15000);
    });

    collector.on("end", async (c, r) => {
      if (r === "time") {
        if (thread) await thread.delete();
        await interaction.followUp({
          content: interaction.user.toString(),
          embeds: [
            makeEmbed(
              "Your thread was deleted due to inactivity for `60` seconds!"
            ),
          ],
          ephemeral: true,
        });
      }
    });
  },
};
