import { Client, GatewayIntentBits, ActivityType, TextChannel, Message } from "discord.js";
import * as dotenv from "dotenv";
import * as cron from "node-cron";

// .envファイルから環境変数をロード
dotenv.config(); // ← このすぐ下で確認

// ★★★ デバッグ用に追加 ★★★
console.log("--- Debug Start ---");
console.log("Attempting to load DISCORD_BOT_TOKEN from .env");
// process.envの内容を表示する際はトークンがログに出力されるため注意
// console.log("Raw process.env.DISCORD_BOT_TOKEN:", process.env.DISCORD_BOT_TOKEN);
// 代わりに、トークンが読み込めたかどうかの確認
if (process.env.DISCORD_BOT_TOKEN) {
    console.log("DISCORD_BOT_TOKEN seems loaded from .env (length check only).");
} else {
    console.log("DISCORD_BOT_TOKEN is UNDEFINED or empty in process.env.");
}
// ★★★ ここまで ★★★

// .envファイルからBotのトークンを取得
if (!process.env.DISCORD_BOT_TOKEN) {
  console.error("❌ DISCORD_BOT_TOKEN is not set in the .env file or not loaded correctly!"); // エラーメッセージを少し変更
  process.exit(1);
}
// トークン自体をログに出さないように注意
const TOKEN = process.env.DISCORD_BOT_TOKEN!;

// ★★★ デバッグ用に追加 ★★★
// トークンが変数に代入されたことを確認（トークン自体はログに出さない）
console.log("Token variable has been assigned.");
// console.log("Token to be used for login:", TOKEN); // トークンそのものをログに出力するのは避ける
// ★★★ ここまで ★★★


// REPORT_CHANNEL_IDS が未設定または空の場合でも空の配列になるようにし、空文字を除去
const REPORT_CHANNEL_IDS = process.env.REPORT_CHANNEL_IDS?.split(",")
  .map((id) => id.trim())
  .filter(id => id) || [];

if (REPORT_CHANNEL_IDS.length === 0) {
  console.warn("⚠️ No report channels configured. Skipping report sending.");
}

// Botのインスタンスを作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
  ]
});

// Botがオンラインになったとき
client.once("ready", () => {
  console.log(`✅ Bot is online as ${client.user?.tag}`);

  // 毎日午前9時にピン留めメッセージを取得して報告 (タイムゾーンオプションは削除されたまま)
  // 元のcron式は "30 7 * * *" でしたが、テストでなければ "0 9 * * *" に戻してください
  cron.schedule("*/1 * * * *", async () => { // ← タイムゾーンオプションは削除されたままです
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

        // reportChannel が TextChannel であるか確認
        if (reportChannel instanceof TextChannel) {
          // TextChannel の場合に send を実行
          for (const part of messageParts) {
            try {
              await reportChannel.send(part);
            } catch (err) {
              console.error(`❌ Failed to send message part to channel ${channelId}:`, err);
            }
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
  });

  client.user?.setPresence({
    status: "online",
    activities: [
      {
        name: "ピン留めメッセージを監視中",
        type: ActivityType.Watching,
      }
    ]
  });
});

// !ping コマンドに応答
client.on("messageCreate", (message: Message) => {
  if (message.author.bot) return;
  if (message.content === "!ping") {
    message.reply("🏓 Pong!");
  }
});

// エラーハンドリング
client.on("error", (error) => {
  console.error("❌ Discord Client Error:", error);
});

client.on("shardError", (error, shardId) => {
  console.error(`❌ Discord Shard Error on Shard ${shardId}:`, error);
});

// Botのログイン
console.log("Attempting to login..."); // ★★★ デバッグ用に追加 ★★★
console.log("--- Debug End ---"); // ★★★ デバッグ用に追加 ★★★
client.login(TOKEN).catch((err) => {
  console.error("❌ Bot login failed:", err);
  // エラーオブジェクト全体を出力するとトークンが含まれる可能性があるので注意
  // console.error(err);
  process.exit(1);
});