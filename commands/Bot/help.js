const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ApplicationCommandOptionType,
  MessageFlags,
} = require("discord.js");

const embed = (title, description) =>
  new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: "Developer - spiteimagine" })
    .setColor("#27476e");

module.exports = {
  name: "help",
  description: "Get information about available commands",
  options: [
    {
      name: "command",
      description: "Select a command to get more information",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Compare", value: "compare" },
        { name: "Show", value: "show" },
        { name: "View", value: "view" },
      ],
    },
  ],
  run: async (client, context, options, isMessage) => {
    const command = options.getString("command");
    const user = isMessage ? context.author : context.user;

    if (command === "compare") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("watch_tutorial")
          .setLabel("Watch Tutorial")
          .setStyle(ButtonStyle.Primary)
      );

      const reply = await context.reply({
        embeds: [
          embed(
            "Compare Command",
            "**The Compare command**\n1.) Use the `/compare` command\n└── ●  Type **`/compare`** to start.\n \n2.) Private Thread\n└── ●  The bot will create a private thread for you.\n \n3.) Get Started\n└── ●  Move to that thread and click the **`Get Started`** button.\n \n 4.) Enter Items\n└── ●  Type the first set of items, separated by commas.\n└── ●  Then, type the second set of items.\n \n5.) Get Results\n└── ●  View your comparison results.\n \n**Using Prefix-Based Commands**\n \n``` ●  Use the prefix q. followed by the command.\n ●  Format: q.compare 'set1 items' to 'set2 items'\n ●  Example: q.compare torpedo to beam\n ●  Note: Use 'to' to separate the two sets.```"
          ),
        ],
        components: [row],
      });

      // collect on this reply only — the old code listened channel-wide and
      // picked up buttons from other users' messages
      const msg = typeof reply.fetch === "function" ? await reply.fetch() : reply;
      const collector = msg.createMessageComponentCollector({ time: 60000 });

      collector.on("collect", async (i) => {
        if (i.customId !== "watch_tutorial") return;
        await i.reply({
          content: "Here's the video tutorial: https://youtu.be/-B0s5agL9pU",
          flags: MessageFlags.Ephemeral,
        });
      });

      collector.on("end", async () => {
        row.components.forEach((b) => b.setDisabled(true));
        await msg.edit({ components: [row] }).catch(() => null);
      });
      return;
    }

    if (command === "show")
      return await context.reply({
        embeds: [
          embed(
            "Show Command",
            "The **`/show`** command: \n By using the `/show` command, players can quickly see the names of various jailbreak items, their current demand, and their prices in Brulee, a virtual currency. These items are categorized according to their type."
          ),
        ],
      });

    if (command === "view")
      return await context.reply({
        embeds: [
          embed(
            "View Command",
            "**The View Command**\n \n **__Use the `/view` command__**: \n To get information about a specific item."
          ),
        ],
      });

    await context.reply({
      content: user.toString(),
      embeds: [
        new EmbedBuilder()
          .setTitle("Invalid Command")
          .setDescription("Please select a valid command: compare, show, or view")
          .setColor("#ff0000"),
      ],
    });
  },
};
