const {
  Message,
  CommandInteraction,
  MessageOptions,
  Modal,
  MessageActionRow,
  TextInputComponent,
  MessageButton,
} = require("discord.js");
const client = require("../index");

module.exports = {
  /**
   *
   * @param {String[]} set
   * @returns {[Number, { value: String, demand: String }] | { title: String, text?: String }}
   */
  check: (set) => {
    const items = client.items;
    let err = false,
      lerr = false,
      derr = false;

    const founds = [];
    const list = set
      .map((c) => {
        const split = c.trim().split(" ");
        let amount,
          ltrim,
          lvl = false;

        let isHyper = split.includes("hyper");
        if (isHyper) {
          lvl = split.pop();
          if (isNaN(Number(lvl)) || Number(lvl) > 5 || Number(lvl) < 1)
            return (lerr = true);
        }

        let f1 = split[0];
        if (isNaN(Number(f1))) ltrim = split.join("_");
        else {
          amount = Number(f1);
          ltrim = split.slice(1, split.length).join("_");
        }
        if (founds.includes(ltrim)) return;

        const found = !isHyper
          ? items.find(
              (i) =>
                (i.name.toLowerCase() === ltrim && i.name.endsWith(lvl)) ||
                i.name.toLowerCase().includes(ltrim) ||
                ltrim.includes(i.name.toLowerCase())
            )
          : items.find(
              (i) =>
                i.name.toLowerCase().includes(ltrim) && i.name.endsWith(lvl)
            );

        if (!found) return (err = true);

        const dupes = set.filter((n) => {
          let sp = n.trim().split(" ");
          return sp[sp.length > 1 ? 1 : 0].toLowerCase() === ltrim;
        }).length;

        if (dupes > 1) {
          founds.push(ltrim);
          return (derr = true);
        } else return isNaN(amount) ? [1, found] : [amount, found];
      })
      .filter((l) => l);

    if (list.length > 8)
      return {
        title: `You are only allowed to send a maximum of 8 items!`,
      };

    if (err)
      return {
        title: `Please provide valid items! Use \`/show\` command for all available items!`,
      };
    if (derr)
      return {
        title: `You are not allowed to provide duplicate items!!`,
      };
    if (lerr)
      return {
        title: `Please provide the level of the hyper (Between 1-5)! Eg: \`Hyper_red 4\``,
      };

    const fil = list
      .map((l) => {
        const { name } = l[1];
        const details = name.split("_");
        const [iname, color, _lvl, ilvl] = details;
        return !l[1]?.value ? `${iname} ${color} ${ilvl}` : null;
      })
      .filter((v) => v);

    if (fil.length > 0)
      return {
        title: `The following items do not have a value in the database yet!`,
        text: `\`\`\`${fil.join(", ")}\`\`\``,
      };

    return list;
  },
  /**
   *
   * @param {[[[Number, { value: String, demand: String }]]]} sets
   */
  calc: (sets) => {
    const mapped = sets.map((l) => {
      return l.map((v) => {
        const [amount, item] = v;
        return {
          cost: amount * Number(item.value.replace("M", "")),
          demand: Number(item.demand),
        };
      });
    });

    const reduce = (t, v) =>
      t.reduce((prev, current) => {
        return Number(Number(prev + current[v]).toFixed(2));
      }, 0);

    const totals = mapped.map((t, i) => {
      let ob = {};
      ob[`cost${i + 1}`] = reduce(t, "cost");
      ob[`demand${i + 1}`] = reduce(t, "demand");
      return ob;
    });

    const { cost1, demand1 } = totals[0];
    const { cost2, demand2 } = totals[1];

    const map = (arr) =>
      arr.map((a) => `${a[0] > 1 ? `${a[0]} ` : ""}${a[1].name}`).join(", ");

    let st = `**First set (${cost1}M):** \`\`\`${map(
      sets[0]
    )}\`\`\`\n**Second set (${cost2}M):** \`\`\`${map(sets[1])}\`\`\``;

    let value;
    const format = (s) => `**\`${Number(s).toFixed(2)}M\`**`;

    let w1 = `The first set wins by ${format(cost1 - cost2)}!`;
    let w2 = `The second set wins by ${format(cost2 - cost1)}!`;
    let d1 = "**wins** by demand!";
    let d2 = "**lose** by demand!";

    if (cost1 > cost2) {
      if (demand1 > demand2) {
        value = `${w1} And also ${d1}`;
      } else if (demand2 > demand1) {
        value = `${w1} But ${d2}`;
      } else {
        value = `${w1} And the demands are also the same for both.`;
      }
    } else if (cost2 > cost1) {
      if (demand2 > demand1) {
        value = `${w2} And also ${d1}`;
      } else if (demand1 > demand2) {
        value = `${w2} But ${d2}`;
      } else {
        value = `${w2} And the demands are also the same for both.`;
      }
    } else {
      if (demand1 > demand2) {
        value = `Its a draw! But the first set ${d1}`;
      } else if (demand2 > demand1) {
        value = `Its a draw! But the second set ${d2}`;
      } else {
        value = `Its a draw! And the demands are also the same for both.`;
      }
    }

    return {
      st,
      value,
    };
  },
  /**
   *
   * @param {Message | CommandInteraction} context
   * @param {MessageOptions} finalData
   */
  feedback: async (context, finalData) => {
    finalData.components = [
      new MessageActionRow().addComponents([
        new MessageButton()
          .setLabel("Feedback")
          .setCustomId("feedback")
          .setStyle("PRIMARY"),
      ]),
    ];

    const feedback = await context.channel.send(finalData);
    const fcollector = feedback.createMessageComponentCollector({
      filter: (i) =>
        i.user.id === context?.user
          ? context.user.id
          : context.author.id && i.customId === "feedback",
      time: 15000,
      max: 1,
    });

    fcollector.on("collect", async (i) => {
      const modal = new Modal()
        .setTitle("Feedback form")
        .setCustomId("feedback")
        .addComponents([
          new MessageActionRow().addComponents([
            new TextInputComponent()
              .setLabel("Feedback")
              .setCustomId("feedbacktext")
              .setPlaceholder("Your feedback.")
              .setStyle("PARAGRAPH")
              .setRequired(true),
          ]),
        ]);

      await i.showModal(modal);
    });

    fcollector.on("end", async (c, r) => {
      finalData.components[0].components[0].setDisabled(true);
      await feedback.edit(finalData);
    });
  },
};
