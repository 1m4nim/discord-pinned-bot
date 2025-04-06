import { Client, GatewayIntentBits, Message, TextChannel, NewsChannel, ChannelType } from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();
// console.log("Bot token:", process.env.DISCORD_BOT_TOKEN);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// チャンネルIDを指定
const playgroundChannelId=(process.env.PLAYGROUND_CHANNEL_ID as string); ; // "playground" チャンネルのIDを入力してください

// メッセージコマンド処理
client.on("messageCreate", async (message: Message) => {
  // Botが送信したメッセージには反応しない
  if (message.author.bot) return;

  // コマンドをチェック
  if (message.content.startsWith("!ping")) {
    await message.reply("🏓 Pong!");
  }

  if (message.content.startsWith("!test")) {
    // チャンネルIDで"playground"チャンネルを取得
    const playgroundChannel = message.guild?.channels.cache.get(playgroundChannelId);

    if (playgroundChannel && playgroundChannel instanceof TextChannel) {
      // メッセージが送信されたチャンネルがTextChannelまたはNewsChannelか確認
      if (message.channel instanceof TextChannel || message.channel instanceof NewsChannel) {
        await handlePinnedMessagesFromChannel(playgroundChannel, message);
        await message.reply("📋 Playground チャンネルのピン留めメッセージ一覧を送信しました！");
      } else {
        await message.reply("❌ メッセージがテキストチャンネルで送信されていません。");
      }
    } else {
      await message.reply("❌ Playground チャンネルが見つかりませんでした。");
    }
  }
});

// ピン留め取得＆送信処理（指定されたチャンネル用）
async function handlePinnedMessagesFromChannel(channel: TextChannel, messageLike: Message) {
  let reportMessage = "**📌 Playground チャンネルのピン留めメッセージ一覧**\n";
  let messageCount = 0;

  try {
    const pinnedMessages = await channel.messages.fetchPinned();
    if (pinnedMessages.size > 0) {
      messageCount += pinnedMessages.size;
      pinnedMessages.forEach((msg) => {
        const contentPreview = msg.content.length > 100 ? msg.content.slice(0, 97) + "..." : msg.content;
        reportMessage += `- [${msg.author.username}]: ${contentPreview || "(コンテンツ無し)"} ([リンク](${msg.url}))\n`;
      });
    }
  } catch (err) {
    console.error(`❌ チャンネル #${channel.name} でピン取得失敗:`, err);
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

  // メッセージを送信
  for (const part of messageParts) {
    // messageLike.channel が TextChannel または NewsChannel であることを確認
    if (messageLike.channel instanceof TextChannel || messageLike.channel instanceof NewsChannel) {
      await messageLike.channel.send(part);
    } else {
      console.error("❌ メッセージ送信に失敗しました。チャンネルが送信可能なタイプではありません。");
    }
  }
}


client.login(process.env.DISCORD_BOT_TOKEN as string);
