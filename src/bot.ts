import {
  Client,
  GatewayIntentBits,
  Message,
  TextChannel,
  NewsChannel,
  ChannelType,
} from "discord.js";
import * as dotenv from "dotenv";

// .envファイルから環境変数を読み込む
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// チャンネルIDを指定
const playgroundChannelId = "773181736988573697";
const prinnChannelId = "1347733209978372148";

// !testコマンドを許可するチャンネルID一覧
const allowedTestChannels = [playgroundChannelId, prinnChannelId];

client.on("messageCreate", async (message: Message) => {
  if (message.author.bot) return;

  // !ping コマンド
  if (message.content.startsWith("!ping")) {
    await message.reply("🏓 Pong!");
  }

  // !test コマンド
  if (message.content.startsWith("!test")) {
    const channelId = message.channel.id;

    // !test コマンドが許可されたチャンネル以外では実行しない
    if (!allowedTestChannels.includes(channelId)) {
      await message.reply("❌ このチャンネルでは !test コマンドを使用できません。");
      return;
    }

    // 自分のチャンネルのピン留めを取得して表示
    if (
      message.channel.type === ChannelType.GuildText ||
      message.channel.type === ChannelType.GuildAnnouncement
    ) {
      await handlePinnedMessagesFromChannel(
        message.channel as TextChannel | NewsChannel
      );
    } else {
      await message.reply("❌ このチャンネルタイプではピン留めを取得できません。");
    }
  }
});

async function handlePinnedMessagesFromChannel(channel: TextChannel | NewsChannel) {
  let reportMessage = `**📌 #${channel.name} のピン留めメッセージ一覧**\n`;
  let messageCount = 0;

  try {
    const pinnedMessages = await channel.messages.fetchPinned();

    if (pinnedMessages.size > 0) {
      messageCount += pinnedMessages.size;

      pinnedMessages.forEach((msg) => {
        const contentPreview =
          msg.content.length > 100
            ? msg.content.slice(0, 97) + "..."
            : msg.content;
        reportMessage += `- [${msg.author.username}]: ${
          contentPreview || "(コンテンツ無し)"
        } ([リンク](${msg.url}))\n`;
      });
    }
  } catch (err) {
    console.error(`❌ #${channel.name} でピン取得失敗:`, err);
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
      let splitIndex = reportMessage.lastIndexOf("\n", MAX_LENGTH);
      if (splitIndex === -1) splitIndex = MAX_LENGTH;
      messageParts.push(reportMessage.slice(0, splitIndex));
      reportMessage = reportMessage.slice(splitIndex).trim();
    }
  }

  for (const part of messageParts) {
    await channel.send(part);
  }
}

// Botログイン
client.login(process.env.DISCORD_BOT_TOKEN as string);
