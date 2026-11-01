const { SlashCommandBuilder } = require("discord.js");
const { cv2Reply, cv2DeferOptions, safeEdit } = require("../utils/embedBuilder");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Megmérem a válaszidőmet"),

  async execute(interaction, client) {
    await interaction.deferReply(cv2DeferOptions());
    const sent = await interaction.fetchReply();
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    let status = "🟢";
    if (latency > 500 || apiLatency > 500) status = "🔴";
    else if (latency > 200 || apiLatency > 200) status = "🟡";

    await safeEdit(
      interaction,
      cv2Reply({
        title: "🏓 Pong!",
        description: `${status} **Késleltetés:** \`${latency}ms\`\n🔷 **API:** \`${apiLatency}ms\``,
      }),
    );
  },
};
