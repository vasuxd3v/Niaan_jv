const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "view",
  description: "🔎 View details about a particular item.",
  options: [
    {
      name: "name",
      required: true,
      type: "STRING",
      description: "🔍 The name of the item you are searching for.",
    },
  ],

  async run(client, interaction, options) {
    const itemName = options.getString("name");
    const items = (
      await Promise.all(
        (
          await client.getTitles()
        ).map(async (t) => await client.getItems(client.nameFormat(t)))
      )
    ).flat();
    const foundItem = items.find(
      (i) =>
        i.name && i.name.toLowerCase() === itemName.toLowerCase()
    );

    if (!foundItem) {
      return await interaction.followUp({
        content: `❌ ${interaction.user}, this item does not exist! Use \`/show\` command to see the list of available items!!`,
        allowedMentions: { users: [interaction.user.id] },
      });
    }

    const embed = new MessageEmbed()
      .setTitle(`🔎 ${foundItem.name}`)
      .setColor("#FCD12A")
      .setDescription(`Here are the details for **${foundItem.name}**:`);

    Object.entries(foundItem).forEach(([key, value]) => {
      let formattedKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
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
      embed.setFooter("Red color shows higher demand of item\nNote- demands are out of 5"); // add a footer message to the embed
    } else {
      embed.setFooter("Note- demands are out of 5");
    }

    await interaction.followUp({
      content: `✅ ${interaction.user}, here are the details for **${foundItem.name}**:`,
      embeds: [embed],
    });
  },
};
