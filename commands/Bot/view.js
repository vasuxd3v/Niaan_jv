const { MessageEmbed, CommandInteraction, CommandInteractionOptionResolver, Client } = require("discord.js");

module.exports = {
  name: "view",
  description: "🔎 View details about a particular item.",
  options: [{
    name: "name",
    required: true,
    type: "STRING",
    description: "🔍 The name of the item you are searching for.",
  }],
  
  async run(client, interaction, options) {
    const itemName = options.getString("name");
    const titles = await client.getTitles();
    const itemPromises = titles.map(async (t) => await client.getItems(client.nameFormat(t)));
    const items = (await Promise.all(itemPromises)).flat();
    const foundItem = items.find(i => i.name && i.name.toLowerCase() === itemName.toLowerCase());
    
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
      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
      embed.addFields({ name: `🔹 ${formattedKey}`, value: `**\`${value}\`**` });
    });
    
    await interaction.followUp({
      content: `✅ ${interaction.user}, here are the details for **${foundItem.name}**:`,
      embeds: [embed],
    });
  }
};
