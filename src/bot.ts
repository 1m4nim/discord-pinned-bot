import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config(); // .env ファイルを読み込む

// Discord クライアントを作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // サーバー（ギルド）に関するデータを受信
    GatewayIntentBits.GuildMessages, // メッセージに関するデータを受信
    GatewayIntentBits.MessageContent, // メッセージの内容を取得
  ],
});

// 環境変数からトークンと通知先チャンネルのIDを取得
const TOKEN = process.env.DISCORD_BOT_TOKEN; // Discord Bot のトークン
const REPORT_CHANNEL_IDS = process.env.REPORT_CHANNEL_IDS?.split(',').map(id => id.trim()) || []; // カンマ区切りで複数チャンネルIDを配列に変換

client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}!`); // Bot のログイン確認

  // 8:00 に実行
  cron.schedule('0 8 * * *', async () => {
    await sendPinnedMessages(); // ピン留めメッセージを送信
  });

  // 12:30 に実行
  cron.schedule('30 12 * * *', async () => {
    await sendPinnedMessages(); // ピン留めメッセージを送信
  });
});

/**
 * ピン留めメッセージを取得し、各チャンネルに送信する関数
 */
async function sendPinnedMessages() {
  let reportMessage = '**📌 今日のピン留めメッセージ一覧**\n'; // 送信するメッセージの初期化

  // すべてのチャンネルをチェック
  for (const [id, channel] of client.channels.cache) {
    if (channel instanceof TextChannel) { // テキストチャンネルのみ処理
      const pinnedMessages = await channel.messages.fetchPinned(); // ピン留めメッセージを取得
      if (pinnedMessages.size > 0) {
        reportMessage += `\n**#${channel.name}**\n`; // チャンネル名を追加
        pinnedMessages.forEach((msg) => {
          reportMessage += `- [${msg.author.username}] ${msg.content}\n`; // 各ピン留めメッセージの内容を追加
        });
      }
    }
  }

  // Discord のメッセージ制限（2000文字）を超えないようにする
  if (reportMessage.length > 2000) {
    reportMessage = reportMessage.slice(0, 1997) + '...';
  }

  // 指定されたすべてのチャンネルに投稿
  for (const channelId of REPORT_CHANNEL_IDS) {
    const reportChannel = client.channels.cache.get(channelId) as TextChannel;
    if (reportChannel) {
      await reportChannel.send(reportMessage); // メッセージを送信
    }
  }
}

// Bot にログイン
client.login(TOKEN);
