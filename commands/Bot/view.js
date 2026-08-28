const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");

module.exports = {
  name: "view",
  description: "🔎 View details about a particular item.",
  options: [
    {
      name: "name",
      required: true,
      type: ApplicationCommandOptionType.String,
      description: "🔍 The name of the item you are searching for.",
      autocomplete: true,
    },
  ],
  async run(client, context, options, isMessage) {
    const user = isMessage ? context.author : context.user;

    const itemName = options.getString("name");
    const items = client.items;
    let foundItem = items.find(
      (i) => i.name.toLowerCase() === itemName.toLowerCase()
    );
    if (!foundItem)
      foundItem = items.find(
        (i) =>
          i.name.toLowerCase().includes(itemName.toLowerCase()) ||
          itemName.toLowerCase().includes(i.name.toLowerCase())
      );

    if (!foundItem) {
      return await context.reply({
        content: `❌ ${user}, this item does not exist! Use \`/show\` command to see the list of available items!!`,
        allowedMentions: { users: [user.id] },
      });
    }

    const embed = new EmbedBuilder()
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

    embed.setFooter({
      text:
        (foundItem.demand > 3
          ? "Red color shows higher demand of item\n"
          : "") + "Note- demands are out of 5\nDeveloper - spiteimagine",
    });

    if (foundItem.url) embed.setThumbnail(foundItem.url);

    await context.reply({
      content: `✅ ${user}, here are the details for **${foundItem.name}**:`,
      embeds: [embed],
    });
  },
};
