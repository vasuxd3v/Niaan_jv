const client = require("../index");

//READY
client.on("ready", async () => {
  console.log(client.user.username + " is online!");
});

