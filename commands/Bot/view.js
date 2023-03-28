const {
  MessageEmbed,
  CommandInteraction,
  CommandInteractionOptionResolver,
  Client,
  Message,
} = require("discord.js");

module.exports = {
  name: "view",
  description: "🔎 View details about a particular item.",
  options: [
    {
      name: "name",
      required: true,
      type: "STRING",
      description: "🔍 The name of the item you are searching for.",
      autocomplete: true,
    },
  ],
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction | Message} context
   * @param {CommandInteractionOptionResolver | String[]} options
   * @param {Boolean} isMessage
   */
  async run(client, context, options, isMessage) {
    console.log(isMessage);
    const details = {
      user: isMessage ? context.author : context.user,
    };

    const itemName = options.getString("name");
    const items = client.items;
    const foundItem = items.find(
      (i) =>
        i.name &&
        (i.name.toLowerCase() === itemName.toLowerCase() ||
          i.name.toLowerCase().includes(itemName.toLowerCase()) ||
          itemName.toLowerCase().includes(i.name.toLowerCase()))
    );

    if (!foundItem) {
      return await context.reply({
        content: `❌ ${details.user}, this item does not exist! Use \`/show\` command to see the list of available items!!`,
        allowedMentions: { users: [details.user.id] },
        ephemeral: true,
      });
    }

    const embed = new MessageEmbed()
      .setTitle(`🔎 ${foundItem.name}`)
      .setColor("#FCD12A")
      .setDescription(`Here are the details for **${foundItem.name}**:`);

    Object.entries(foundItem).forEach(([key, value]) => {
      if (key === "url") return;
      let formattedKey =
        key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
      let formattedValue = value;

      if (key.toLowerCase() === "demand" && value > 3) {
        formattedKey = `🔸 ${formattedKey}`;
        formattedValue = `**\`${value}\`**`;
        embed.setColor("#FF0000"); // set the embed color to red if demand is greater than 3
      } else {
        formattedKey = `🔹 ${formattedKey}`;
        formattedValue = `\`${value}\``;
      }

      embed.addFields({
        name: formattedKey,
        value: formattedValue,
      });
    });

    if (foundItem.demand > 3) {
      embed.setFooter({
        text: "Red color shows higher demand of item\nNote- demands are out of 5",
      }); // add a footer message to the embed
    } else {
      embed.setFooter({ text: "Note- demands are out of 5" });
    }

    if (foundItem.url) embed.setThumbnail(foundItem.url);

    await context.reply({
      content: `✅ ${details.user}, here are the details for **${foundItem.name}**:`,
      embeds: [embed],
    });
  },
};
