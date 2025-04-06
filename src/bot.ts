import { Client, GatewayIntentBits, ActivityType, TextChannel, ChannelType } from "discord.js";
import * as dotenv from "dotenv";
import * as cron from "node-cron";

// .envから環境変数を読み込む
dotenv.config();

// .envから値を取得（nullチェックも込み）
const TOKEN = process.env.DISCORD_BOT_TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;
const GUILD_ID = process.env.GUILD_ID!;
const REPORT_CHANNEL_IDS = process.env.REPORT_CHANNEL_IDS?.split(",").map(id => id.trim()).filter(id => id) || [];

// Botインスタンスを作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,            // サーバーの情報を受け取る
    GatewayIntentBits.GuildMessages,     // メッセージの受信
    GatewayIntentBits.MessageContent     // メッセージの内容を受け取る
  ]
});

// Botの起動後
client.once("ready", () => {
  console.log(`✅ Bot is ready as ${client.user?.tag}`);
  client.user?.setPresence({
    status: "online",
    activities: [{
      name: "ピン留めメッセージを監視中",
      type: ActivityType.Watching
    }]
  });
});

// メッセージコマンド処理
client.on("messageCreate", async (message) => {
  // Botが送信したメッセージには反応しない
  if (message.author.bot) return;

  // コマンドをチェック
  if (message.content.startsWith("!ping")) {
    await message.reply("🏓 Pong!");
  }

  if (message.content.startsWith("!test")) {
    const fakeMessage = {
      author: message.author,
      channel: message.channel,
    } as { channel: TextChannel; author: any };

    await handlePinnedMessagesFromGuild(fakeMessage);
    await message.reply("📋 ピン留めメッセージ一覧を送信しました！");
  }
});

// ピン留め取得＆送信処理
async function handlePinnedMessagesFromGuild(messageLike: { channel: TextChannel; author: any }) {
  const guild = messageLike.channel.guild;
  let reportMessage = "**📌 今日のピン留めメッセージ一覧**\n";
  let messageCount = 0;

  for (const [channelId, channel] of guild.channels.cache) {
    if (channel instanceof TextChannel) {
      try {
        const pinnedMessages = await channel.messages.fetchPinned();
        if (pinnedMessages.size > 0) {
          messageCount += pinnedMessages.size;
          reportMessage += `\n**#${channel.name}**\n`;
          pinnedMessages.forEach((msg) => {
            const contentPreview = msg.content.length > 100 ? msg.content.slice(0, 97) + "..." : msg.content;
            reportMessage += `- [${msg.author.username}]: ${contentPreview || "(コンテンツ無し)"} ([リンク](${msg.url}))\n`;
          });
        }
      } catch (err) {
        console.error(`❌ チャンネル #${channel.name} でピン取得失敗:`, err);
      }
    }
  }

  if (messageCount === 0) {
    reportMessage += "\n*ピン留めされたメッセージはありませんでした。*";
  }

  // Discordのメッセージ最大長は2000文字
  const MAX_LENGTH = 2000;
  const messageParts: string[] = [];

  while (reportMessage.length > 0) {
    if (reportMessage.length <= MAX_LENGTH) {
      messageParts.push(reportMessage);
      break;
    } else {
      let splitIndex = reportMessage.lastIndexOf('\n', MAX_LENGTH);
      if (splitIndex === -1) splitIndex = MAX_LENGTH;
      messageParts.push(reportMessage.slice(0, splitIndex));
      reportMessage = reportMessage.slice(splitIndex).trim();
    }
  }

  // REPORT_CHANNEL_IDS に送信
  for (const channelId of REPORT_CHANNEL_IDS) {
    try {
      const reportChannel = await client.channels.fetch(channelId);
      if (reportChannel instanceof TextChannel) {
        for (const part of messageParts) {
          await reportChannel.send(part);
        }
        console.log(`✅ レポート送信成功: ${channelId}`);
      } else {
        console.warn(`⚠️ チャンネル ${channelId} はTextChannelではありません。`);
      }
    } catch (err) {
      console.error(`❌ レポート送信失敗: ${channelId}`, err);
    }
  }
}

// Botログイン
client.login(TOKEN);
