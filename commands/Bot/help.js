const {
  MessageEmbed,
  CommandInteraction,
  CommandInteractionOptionResolver,
  Client,
  MessageButton,
  MessageActionRow,
  Message,
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
   * @param {CommandInteraction | Message} context
   * @param {CommandInteractionOptionResolver | String[]} options
   * @param {Boolean} isMessage
   */
  run: async (client, context, options, isMessage) => {
    const command = options.getString("command");

    switch (command) {
      case "compare":
        const compareEmbed = new MessageEmbed()
          .setTitle("Compare Command")
          .setDescription(
            "**The Compare command**\n1.) Use the `/compare` command\n└── ●  Type **`/compare`** to start.\n \n2.) Private Thread\n└── ●  The bot will create a private thread for you.\n \n3.) Get Started\n└── ●  Move to that thread and click the **`Get Started`** button.\n \n 4.) Enter Items\n└── ●  Type the first set of items, separated by commas.\n└── ●  Then, type the second set of items.\n \n5.) Get Results\n└── ●  View your comparison results.\n \n**Using Prefix-Based Commands**\n \n``` ●  Use the prefix q. followed by the command.\n ●  Format: q.compare 'set1 items' to 'set2 items'\n ●  Example: q.compare torpedo to beam\n ●  Note: Use 'to' to separate the two sets.```"
          )
          .setFooter({text: "Developer - spiteimagine"})
          .setColor("#27476e");

        const watchTutorialButton = new MessageButton()
          .setCustomId("watch_tutorial")
          .setLabel("Watch Tutorial")
          .setStyle("PRIMARY");

        const actionRow = new MessageActionRow().addComponents(
          watchTutorialButton
        );

        await context.reply({
          embeds: [compareEmbed],
          components: [actionRow],
        });
        break;
      case "show":
        const showEmbed = new MessageEmbed()
          .setTitle("Show Command")
          .setDescription(
            "The **`/show`** command: \n By using the `/show` command, players can quickly see the names of various jailbreak items, their current demand, and their prices in Brulee, a virtual currency. These items are categorized according to their type."
          )
          .setFooter({text: "Developer - spiteimagine"})
          .setColor("#27476e");
        await context.reply({ embeds: [showEmbed] });
        break;
      case "view":
        const viewEmbed = new MessageEmbed()
          .setTitle("View Command")
          .setDescription(
            "**The View Command**\n \n **__Use the `/view` command__**: \n To get information about a specific item."
          )
          .setFooter({text: "Developer - spiteimagine"})
          .setColor("#27476e");
        await context.reply({ embeds: [viewEmbed] });
        break;
      default:
        const errorEmbed = new MessageEmbed()
          .setTitle("Invalid Command")
          .setDescription(
            "Please select a valid command: compare, show, or view"
          )
          .setColor("#ff0000");
        await context.channel.send({ embeds: [errorEmbed] });
    }

    // Listen for the button click event
    const collector = context.channel.createMessageComponentCollector({
      componentType: "BUTTON",
      time: 60000, // 60 seconds
      max: 1,
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.customId === "watch_tutorial") {
        const videoUrl =
          "https://youtu.be/-B0s5agL9pU";
        await buttonInteraction.reply({
          content: `Here's the video tutorial: ${videoUrl}`,
          ephemeral: true,
        });
      }
    });
  },
};
