const client = require("../index");

//READY
client.on("ready", async () => {
  console.log(client.user.username + " is online!");

  // Update loop
  await update();
  setInterval(async () => {
    console.log("Spreadsheet: Data updated!");
    await update();
  }, 2 * 60000);
});

const update = async () => {
  const items = (
    await Promise.all(
      (
        await client.getTitles()
      ).map(async (t) => await client.getItems(client.nameFormat(t)))
    )
  ).flat();

  items.forEach((i) => {
    client.items.set(i.name, i);
  });
};
