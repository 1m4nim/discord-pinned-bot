import { Client, GatewayIntentBits, ActivityType, TextChannel, Message } from "discord.js";
import * as dotenv from "dotenv";
import * as cron from "node-cron";

dotenv.config();

if (!process.env.DISCORD_BOT_TOKEN){
    console.error("❌ DISCORD_BOT_TOKEN is not set in the .env file!");
    process.exit(1);
  }
  
  const TOKEN = process.env.DISCORD_BOT_TOKEN!;

// REPORT_CHANNEL_IDS が未設定または空の場合でも空の配列になるようにし、空文字を除去
const REPORT_CHANNEL_IDS = process.env.REPORT_CHANNEL_IDS?.split(",")
    .map((id) => id.trim())
    .filter(id => id) || [];

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

client.on("error", (error) => {
  console.error("❌ Discord Client Error:", error);
});

client.on("shardError", (error, shardId) => {
  console.error(`❌ Discord Shard Error on Shard ${shardId}:`, error);
});

// 毎日午前9時にピン留めメッセージを取得して報告
cron.schedule("* * * *", async () => {
  if (!client.isReady()) {
    console.log("⏰ Cron job triggered, but client is not ready. Skipping.");
    return;
  }

  console.log("⏰ Cron job started: Fetching pinned messages...");

  let reportMessage = "**📌 今日のピン留めメッセージ一覧**\n";
  let messageCount = 0;

  for (const [guildId, guild] of client.guilds.cache) {
    for (const [channelId, channel] of guild.channels.cache) {
      if (channel instanceof TextChannel) {
        try {
          const pinnedMessages = await channel.messages.fetchPinned();
          if (pinnedMessages.size > 0) {
            messageCount += pinnedMessages.size;
            reportMessage += `\n**#${channel.name}** (${guild.name})\n`;
            pinnedMessages.forEach((msg) => {
              const contentPreview = msg.content.length > 100 ? msg.content.substring(0, 97) + "..." : msg.content;
              reportMessage += `- [${msg.author.username}]: ${contentPreview || "(コンテンツ無し)"} ([メッセージへ](${msg.url}))\n`;
            });
          }
        } catch (error) {
          console.error(`❌ Failed to fetch pinned messages for channel #${channel.name} (${channel.id}) in guild ${guild.name} (${guild.id}):`, error);
        }
      }
    }
  }

  if (messageCount === 0) {
    reportMessage += "\n*ピン留めされたメッセージはありませんでした。*";
  }

  const MAX_LENGTH = 2000;
  const messageParts: string[] = [];
  while (reportMessage.length > 0) {
    if (reportMessage.length <= MAX_LENGTH) {
      messageParts.push(reportMessage);
      break;
    } else {
      let splitIndex = reportMessage.lastIndexOf('\n', MAX_LENGTH);
      if (splitIndex === -1 || splitIndex === 0) {
        splitIndex = MAX_LENGTH;
      }
      messageParts.push(reportMessage.substring(0, splitIndex));
      reportMessage = reportMessage.substring(splitIndex).trim();
    }
  }

  console.log(`📬 Sending report to ${REPORT_CHANNEL_IDS.length} channels...`);
  for (const channelId of REPORT_CHANNEL_IDS) {
    try {
      const reportChannel = await client.channels.fetch(channelId);
      if (!reportChannel) {
        console.warn(`⚠️ Report channel with ID ${channelId} not found or fetch failed.`);
        continue;
      }

      if (reportChannel.isTextBased()) {
        for (const part of messageParts) {
          await reportChannel.send(part);
        }
        console.log(`✅ Report sent successfully to channel ${channelId}`);
      } else {
        console.warn(`⚠️ Configured report channel ${channelId} is not a text-based channel.`);
      }
    } catch (error) {
      console.error(`❌ Failed to send report to channel ${channelId}:`, error);
    }
  }

  console.log("✅ Cron job finished.");
}, {
  timezone: "Asia/Tokyo",
});

client.login(TOKEN).catch((err) => {
  console.error("❌ Bot login failed:", err);
  process.exit(1);
});

console.log("TOKEN:", TOKEN);
