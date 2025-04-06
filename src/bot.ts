import { Client, GatewayIntentBits, Message, TextChannel, NewsChannel } from "discord.js";
import * as dotenv from "dotenv";

// .envファイルから環境変数を読み込む
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // ギルドの情報にアクセス
    GatewayIntentBits.GuildMessages, // ギルド内のメッセージにアクセス
    GatewayIntentBits.MessageContent, // メッセージの内容にアクセス
  ],
});

// チャンネルIDを指定
const playgroundChannelId = '773181736988573697'; // playground チャンネルのID
const prinnChannelId = '1347733209978372148'; // ぷりんの工作室のチャンネルID

// メッセージ受信時のイベント
client.on("messageCreate", async (message: Message) => {
  // Botが送信したメッセージには反応しない
  if (message.author.bot) return;

  // コマンドをチェック
  if (message.content.startsWith("!ping")) {
    // !ping コマンドに反応して "Pong!" を送信
    await message.reply("🏓 Pong!");
  }

  if (message.content.startsWith("!test")) {
    // !test コマンドを受けた場合、以下の処理を行う

    // Playground チャンネルのピン留めメッセージを送信
    const playgroundChannel = message.guild?.channels.cache.get(playgroundChannelId);
    if (playgroundChannel && playgroundChannel instanceof TextChannel) {
      // playgroundChannelが存在し、TextChannelタイプであれば処理を実行
      await handlePinnedMessagesFromChannel(playgroundChannel, message);
    } else {
      // Playground チャンネルが見つからない場合
      await message.reply("❌ Playground チャンネルが見つかりませんでした。");
    }

    // ぷりんの工作室 チャンネルのピン留めメッセージを送信
    const prinnChannel = message.guild?.channels.cache.get(prinnChannelId);
    if (prinnChannel && prinnChannel instanceof TextChannel) {
      // prinnChannelが存在し、TextChannelタイプであれば処理を実行
      await handlePinnedMessagesFromChannel(prinnChannel, message);
    } else {
      // ぷりんの工作室 チャンネルが見つからない場合
      await message.reply("❌ ぷりんの工作室チャンネルが見つかりませんでした。");
    }

    // 両チャンネルのピン留めメッセージを送信したことを通知
    await message.reply("📋 Playground と ぷりんの工作室のピン留めメッセージ一覧を送信しました！");
  }
});

// ピン留めメッセージを取得し、指定されたチャンネルに送信する関数
async function handlePinnedMessagesFromChannel(channel: TextChannel, messageLike: Message) {
  let reportMessage = `**📌 ${channel.name} チャンネルのピン留めメッセージ一覧**\n`; // ピン留めメッセージの先頭部分
  let messageCount = 0; // ピン留めメッセージのカウント

  try {
    // 指定されたチャンネルからピン留めメッセージを取得
    const pinnedMessages = await channel.messages.fetchPinned();
    if (pinnedMessages.size > 0) {
      // ピン留めメッセージがあれば、その数をカウント
      messageCount += pinnedMessages.size;

      // すべてのピン留めメッセージを処理
      pinnedMessages.forEach((msg) => {
        // メッセージの内容が100文字を超える場合は、プレビューを作成
        const contentPreview = msg.content.length > 100 ? msg.content.slice(0, 97) + "..." : msg.content;
        reportMessage += `- [${msg.author.username}]: ${contentPreview || "(コンテンツ無し)"} ([リンク](${msg.url}))\n`;
      });
    }
  } catch (err) {
    // ピン留めメッセージの取得に失敗した場合
    console.error(`❌ チャンネル #${channel.name} でピン取得失敗:`, err);
  }

  // ピン留めメッセージがなかった場合のメッセージを追加
  if (messageCount === 0) {
    reportMessage += "\n*ピン留めされたメッセージはありませんでした。*";
  }

  // Discordのメッセージ最大長は2000文字
  const MAX_LENGTH = 2000; 
  const messageParts: string[] = []; // メッセージが長くなる可能性があるため、分割するための配列

  // メッセージが2000文字を超えないように分割
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

  // メッセージが分割されている場合、それぞれ送信
  for (const part of messageParts) {
    // messageLike.channel が TextChannel または NewsChannel であることを確認
    if (messageLike.channel instanceof TextChannel || messageLike.channel instanceof NewsChannel) {
      // メッセージを送信
      await messageLike.channel.send(part);
    } else {
      // チャンネルが送信可能なタイプではない場合
      console.error("❌ メッセージ送信に失敗しました。チャンネルが送信可能なタイプではありません。");
    }
  }
}

// Botのログイン
client.login(process.env.DISCORD_BOT_TOKEN as string);
