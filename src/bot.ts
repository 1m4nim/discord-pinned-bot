import { Client, GatewayIntentBits, ActivityType, TextChannel, Message } from "discord.js";
import dotenv from "dotenv";
import cron from "node-cron";

dotenv.config();

const TOKEN = process.env.DISCORD_BOT_TOKEN!;
const REPORT_CHANNEL_IDS = process.env.REPORT_CHANNEL_IDS?.split(",").map((id) => id.trim()) || [];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
  ],
});

client.once("ready", () => {
  console.log(`✅ Bot is online as ${client.user?.tag}`);

  client.user?.setPresence({
    status: "online",
    activities: [
      {
        name: "ピン留めメッセージを監視中",
        type: ActivityType.Watching,
      },
    ],
  });
});

client.on("messageCreate", (message: Message) => {
  if (message.author.bot) return;
  if (message.content === "!ping") {
    message.reply("🏓 Pong!");
  }
});

client.on("disconnect", () => {
  console.log("⚠️ Bot が切断されました。再接続します...");
  client.login(TOKEN);
});

const schedules = ["0 9 * * *"]; // 例: 毎朝9時
schedules.forEach((schedule) => {
  cron.schedule(schedule, async () => {
    let reportMessage = "**📌 今日のピン留めメッセージ一覧**\n";
    for (const [id, channel] of client.channels.cache) {
      if (channel instanceof TextChannel) {
        const pinnedMessages = await channel.messages.fetchPinned();
        if (pinnedMessages.size > 0) {
          reportMessage += `\n**#${channel.name}**\n`;
          pinnedMessages.forEach((msg) => {
            reportMessage += `- [${msg.author.username}] ${msg.content}\n`;
          });
        }
      }
    }
    if (reportMessage.length > 2000) {
      reportMessage = reportMessage.slice(0, 1997) + "...";
    }
    for (const channelId of REPORT_CHANNEL_IDS) {
      const reportChannel = client.channels.cache.get(channelId);
      if (reportChannel && reportChannel.isTextBased()) {
        await reportChannel.send(reportMessage);
      }
    }
  });
});

client.login(TOKEN).catch((err) => {
  console.error("❌ ログインエラー:", err);
});
