const { Events } = require("discord.js");
const client = require("../index");

//READY
client.once(Events.ClientReady, async () => {
  console.log(client.user.username + " is online!");

  // Update loop
  await update();
  setInterval(update, 2 * 60000);
});

const update = async () => {
  try {
    const titles = await client.getTitles();
    const items = (
      await Promise.all(
        titles.map((t) => client.getItems(client.nameFormat(t)))
      )
    ).flat();

    items.forEach((i) => {
      if (i.name) client.items.set(i.name, i);
    });
    console.log(`Spreadsheet: ${client.items.size} items cached.`);
  } catch (e) {
    // keep the last good cache rather than dying on a transient Sheets error
    console.error("Spreadsheet update failed:", e.message);
  }
};
