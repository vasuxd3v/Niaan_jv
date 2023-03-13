const {
  MessageEmbed,
  CommandInteraction,
  CommandInteractionOptionResolver,
  Client,
  MessageButton,
  MessageActionRow,
} = require("discord.js");

module.exports = {
  name: "help",
  description: "Get information about available commands",
  options: [
    {
      name: "command",
      description: "Select a command to get more information",
      type: "STRING",
      required: true,
      choices: [
        {
          name: "Compare",
          value: "compare",
        },
        {
          name: "Show",
          value: "show",
        },
        {
          name: "View",
          value: "view",
        },
      ],
    },
  ],
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {CommandInteractionOptionResolver} options
   */
  run: async (client, interaction, options) => {
    const command = options.getString("command");

    switch (command) {
      case "compare":
        const compareEmbed = new MessageEmbed()
          .setTitle("Compare Command")
          .setDescription("**The Compare command**\nUse the `/compare` command: To start the comparison process, use the `/compare` command in your server's chat. This will initiate the comparison process and prompt you to enter the first set of items.\n **__Enter the first set__**: Once you've used the `/compare` command,Jailbreak Values will prompt you to enter the first set of items you want to compare. For example, if you want to compare two items, you would enter the names of those items.\n **__Enter the second set__**: After you've entered the first set of items, Jailbreak Values will prompt you to enter the second set of items. This could be the items that another user has, or it could be the items you want to compare the first set to. \n **__View your result__**: Once you've entered both sets of items, **Jailbreak Values** will compare them and display the result in your server's chat. This result will show you the differences between the two sets of items, including any items that are in one set but not the other. \n -------------------------------------------------------------------------------- \n **__Important Note__** :- You are allowed to enter 8 different items at once in each set. In case you have multiples of same item you can use `(number) {item name}` for example :- `3 brulee` \n You have you use a comma after entering an item. For example :-  `Torpedo, spinner, Brulee, Checker` or like  `2 torpedo, 4 Steed` \n -------------------------------------------------------------------------------- \n So that's it! With the /compare command and **Jailbreak Values**, you can easily compare trades and find the items you're looking for.")
          .setColor("#27476e");

        const watchTutorialButton = new MessageButton()
          .setCustomId("watch_tutorial")
          .setLabel("Watch Tutorial")
          .setStyle("PRIMARY");

        const actionRow = new MessageActionRow().addComponents(
          watchTutorialButton
        );

        await interaction.followUp({
          embeds: [compareEmbed],
          components: [actionRow],
        });
        break;
      case "show":
        const showEmbed = new MessageEmbed()
          .setTitle("Show Command")
          .setDescription("The **`/show`** command is a very usefull command for those playing **jailbreak**, as it provides an easy-to-use interface for viewing essential information about various in-game items. This feature is particularly useful for those who are new to the **tranding** or those who want to stay informed about the current state of the market.\n By using the `/show` command, players can quickly see the names of various jailbreak items, their current demand, and their prices in Brulee, a virtual currency used within the game. These items are categorized according to their type, making it simple for players to find the information they need.\n -------------------------------------------------------------------------------- \n One of the standout features of the `/show` command is its user-friendly design. Even those who are unfamiliar with the trading, in general, will find it easy to navigate and understand. This simplicity is essential, as it ensures that all players, regardless of their experience level, can access and utilize this critical **Jailbreak Values Bot**")
          .setColor("#27476e");
        await interaction.followUp({ embeds: [showEmbed] });
        break;
      case "view":
        const viewEmbed = new MessageEmbed()
          .setTitle("View Command")
          .setDescription("**The View Command**\n **__Use the `/view` command__**: To get information about a specific item, use the `/view` command in your server's chat. This will initiate the process and prompt you to enter the name of the item you want to view.\n **__Enter the item name__**: Once you've used the `/view` command, **Jailbreak Values** will prompt you to enter the name of the item you want to view. For example, if you want to view information about a particular item, you would enter the name of that item.\n **__View the response__**: After you've entered the item name, **Jailbreak Values** will respond with information about that item. This information will include the item's demand, value, and other relevant details.\n So that's it! With the `/view` command and **Jailbreak Values** , you can easily information about items and make informed decisions about trading and acquiring new items.")
          .setColor("#27476e");
        await interaction.followUp({ embeds: [viewEmbed] });
        break;
      default:
        const errorEmbed = new MessageEmbed()
          .setTitle("Invalid Command")
          .setDescription(
            "Please select a valid command: compare, show, or view"
          )
          .setColor("#ff0000");
        await interaction.followUp({ embeds: [errorEmbed] });
    }

    // Listen for the button click event
    const collector = interaction.channel.createMessageComponentCollector({
      componentType: "BUTTON",
      time: 60000, // 60 seconds
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.customId === "watch_tutorial") {
        const videoUrl =
          "https://cdn.discordapp.com/attachments/1074963439954427934/1075046232130588712/The_comparsion_command_tutorial_-_The_Jailbreak_Union.mp4";
        await buttonInteraction.reply({
          content: `Here's the video tutorial: ${videoUrl}`,
          ephemeral: true, // Only the user who clicked the button can see this message
        });
      }
    });
  },
};
