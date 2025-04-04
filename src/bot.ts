"use strict";
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const dotenv = require("dotenv");
dotenv.config(); // .env ファイルを読み込む

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
