const {
  MessageEmbed,
  CommandInteraction,
  CommandInteractionOptionResolver,
  Client,
  MessageActionRow,
  MessageButton,
  Message,
} = require("discord.js");
const compare = require("../../functions/compare");

module.exports = {
  name: "compare",
  defer: true,
  description: "Compare your items!",
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction | Message} context
   * @param {CommandInteractionOptionResolver | String[]} options
   * @param {Boolean} isMessage
   */
  run: async (client, context, options, isMessage) => {
    const makeEmbed = (text, descrip) => {
      const embed = new MessageEmbed().setTitle(text).setColor("#27476e");
      if (descrip) embed.setDescription(descrip);
      return embed;
    };

    if (isMessage) {
      const seperateIndex = options.findIndex((o) => o === "to");
      if (seperateIndex === -1)
        return await context.reply({
          content: context.author.toString(),
          embeds: [
            makeEmbed(
              `You must seperate the two sets by using \`to\`!\nEg: \`q.compare torpedo to arachnid\``
            ),
          ],
        });

      const set1 = options.slice(0, seperateIndex).join(" ").split(",");
      const set2 = options
        .slice(seperateIndex + 1, options.length)
        .join(" ")
        .split(",");

      const list1 = compare.check(set1);
      const list2 = compare.check(set2);

      if (list1?.title)
        return await context.channel.send({
          content: context.author.toString(),
          embeds: [makeEmbed(list1.title, list1?.text ? list1.text : "")],
        });
      if (list2?.title)
        return await context.channel.send({
          content: context.author.toString(),
          embeds: [makeEmbed(list2.title, list2?.text ? list2.text : "")],
        });

      const lists = [list1, list2];
      const { st, value } = compare.calc(lists);

      return await compare.feedback(context, {
        content: `Requested by: ${context.author.toString()}!`,
        embeds: [
          new MessageEmbed()
            .setDescription(`${st}\n${value}`)
            .setColor("#27476e"),
        ],
      });
    } else {
      if (
        !context.channel.threads ||
        context.guild.channels.cache.find(
          (c) =>
            c.type === "GUILD_PRIVATE_THREAD" &&
            c.name === `${context.user.username}-thread`
        )
      )
        return await context.followUp({
          content: context.user.toString(),
          embeds: [makeEmbed(`You can not start the process again!!`)],
          ephemeral: true,
        });

      const thread = await context.channel?.threads.create({
        name: `${context.user.username}-thread`,
        type: "GUILD_PRIVATE_THREAD",
        reason: "Private compare required.",
      });

      await thread.members.add(context.user.id);

      await context.followUp({
        content: context.user.toString(),
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
        content: context.user.toString(),
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
            i.user.id === context.user.id && i.customId === "start",
          time: 20000,
        });

        await confirmation.deferUpdate().catch(() => null);
      } catch (e) {
        if (thread) await thread.delete();
        await context.channel.send({
          content: context.user.toString(),
          embeds: [
            makeEmbed(
              `Your thread was deleted as you did not click the button!`
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      await thread.send({
        content: context.user.toString(),
        embeds: [
          makeEmbed(
            `Please send the first set of items!\nMake sure to seperate each item with a comma \`,\`!`
          ),
        ],
      });

      const collector = thread.createMessageCollector({
        filter: (m) => m.author.id === context.user.id,
        time: 60000,
        max: 2,
      });

      const lists = [];
      collector.on("collect", async (message) => {
        const seperated = message.content
          .toLowerCase()
          .split(",")
          .filter((m) => m);

        const list = compare.check(seperated);
        if (list?.title) {
          await thread.send({
            content: context.user.toString(),
            embeds: [makeEmbed(list.title, list?.text ? list.text : "")],
          });
          return collector.options.max++;
        }

        if (lists.length === 0) {
          await thread.send({
            content: context.user.toString(),
            embeds: [makeEmbed(`Please send the second set of items!`)],
          });

          lists.push(list);
          return collector.options.max++;
        }

        const { st, value } = compare.calc([lists[0], list]);

        const finalData = {
          content: `Requested by: ${context.user.toString()}. This thread will be deleted in \`15\`seconds!`,
          embeds: [
            new MessageEmbed()
              .setDescription(`${st}\n${value}`)
              .setColor("#27476e")
              .setFooter({ text: 'Developer - spiteimagine'}),
          ],
        };

        await thread.send(finalData);

        collector.stop();
        setTimeout(async () => {
          if (thread) await thread.delete();
          finalData.content = `Requested by: ${context.user.toString()}!`;

          await compare.feedback(context, finalData);
        }, 30000);
      });

      collector.on("end", async (c, r) => {
        if (r === "time") {
          if (thread) await thread.delete();
          await context.channel.send({
            content: context.user.toString(),
            embeds: [
              makeEmbed(
                "Your thread was deleted due to inactivity for `60` seconds!"
              ),
            ],
            ephemeral: true,
          });
        }
      });
    }
  },
};
