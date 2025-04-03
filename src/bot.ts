import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config(); // .env ファイルを読み込む

// Discord クライアントを作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // サーバー（ギルド）の情報を取得
    GatewayIntentBits.GuildMessages, // メッセージの情報を取得
    GatewayIntentBits.MessageContent, // メッセージの内容を取得
  ],
});

// 環境変数からトークンと通知先チャンネルのIDを取得
const TOKEN = process.env.DISCORD_BOT_TOKEN; // Discord Bot のトークン
const REPORT_CHANNEL_IDS = process.env.REPORT_CHANNEL_IDS?.split(',').map(id => id.trim()) || []; // 複数チャンネルIDを配列に変換

client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}!`); // Bot のログイン確認

  // 毎日実行
  const schedules = ['0 8 * * *', '0 13 * * *'];
  schedules.forEach((schedule) => {
    cron.schedule(schedule, async () => {
      let reportMessage = '**📌 今日のピン留めメッセージ一覧**\n'; // 送信するメッセージの初期化

      // すべてのテキストチャンネルをチェック
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
    });
  });
});

client.login(TOKEN); // Bot にログイン
