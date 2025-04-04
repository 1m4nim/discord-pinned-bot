"use strict";
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const dotenv = require("dotenv");

<<<<<<< HEAD
// 🔹 環境変数からトークンを取得
const TOKEN = process.env.DISCORD_BOT_TOKEN;

// 🔹 Discord クライアントを作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // サーバー情報の取得
    GatewayIntentBits.GuildMessages, // メッセージの取得
    GatewayIntentBits.MessageContent, // メッセージ内容の取得
    GatewayIntentBits.GuildPresences, // プレゼンス（ステータス）の取得
  ],
});

// ✅ ボットが準備完了したときの処理
client.once("ready", () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);

  // 🔹 常にオンライン状態に設定
  client.user
    .setPresence({
      status: "online", // 常に "online" に設定
      activities: [
        {
          name: "ピン留めメッセージを監視中", // 表示するアクティビティの名前
          type: ActivityType.Watching, // "〇〇を視聴中" と表示
        },
      ],
=======
dotenv.config();

const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const REPORT_CHANNEL_IDS = process.env.REPORT_CHANNEL_IDS?.split(',').map(id => id.trim()) || [];

client.once('ready', async () => {
    console.log(`Logged in as ${client.user?.tag}!`);

    // ステータスを確実にオンラインにする
    setTimeout(() => {
        if (client.user) {
            client.user.setPresence({
                status: "online",
                activities: [
                    {
                        name: "ピン留めメッセージを監視中",
                        type: discord_js_1.ActivityType.Watching,
                    },
                ],
            }).then(() => console.log("✅ Presence をオンラインに設定しました！"))
              .catch(console.error);
        } else {
            console.log("User not found!");
        }
    }, 5000);
});

client.on("messageCreate", (message) => {
    if (message.author.bot) return;
    if (message.content.includes("!ping")) {
        message.reply("🏓 Pong!");
    }
});

const schedules = ['* * * * *'];
schedules.forEach((schedule) => {
    cron.schedule(schedule, async () => {
        let reportMessage = '**📌 今日のピン留めメッセージ一覧**\n';
        for (const [id, channel] of client.channels.cache) {
            if (channel instanceof discord_js_1.TextChannel) {
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
            reportMessage = reportMessage.slice(0, 1997) + '...';
        }
        for (const channelId of REPORT_CHANNEL_IDS) {
            const reportChannel = client.channels.cache.get(channelId);
            if (reportChannel) {
                await reportChannel.send(reportMessage);
            }
        }
    });
});

client.login(TOKEN)
    .then(() => {
        console.log('Bot is logged in successfully!');
>>>>>>> 44e7dbf (Discordに参加させた~)
    })
    .then(() => {
      console.log("✅ ステータスをオンラインに設定しました！");
    })
    .catch(console.error);
});

// ✅ メッセージに反応する処理
import { Message } from "discord.js";

client.on("messageCreate", (message: Message) => {
  if (message.author.bot) return; // ボットのメッセージには反応しない

  if (message.content === "!ping") {
    message.reply("🏓 Pong!"); // "!ping" に "Pong!" で応答
  }
});

// ✅ Botが切断された場合に自動再接続
client.on("disconnect", () => {
  console.log("⚠️ Bot が切断されました。再接続します...");
  client.login(TOKEN);
});

// ✅ Botにログイン
client
  .login(TOKEN)
  .then(() => console.log("✅ Bot successfully logged in!"))
  .catch((error: unknown) => console.error("❌ ログインエラー: ", error));
