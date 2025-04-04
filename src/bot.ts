"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const cron = require("node-cron");
const dotenv = require("dotenv");
dotenv.config(); // .env ファイルを読み込む

// Discord クライアントを作成
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds, // サーバー（ギルド）の情報を取得
        discord_js_1.GatewayIntentBits.GuildMessages, // メッセージの情報を取得
        discord_js_1.GatewayIntentBits.MessageContent, // メッセージの内容を取得
        discord_js_1.GatewayIntentBits.GuildPresences, // ステータスを取得
    ],
});

// 環境変数からトークンと通知先チャンネルのIDを取得
const TOKEN = process.env.DISCORD_BOT_TOKEN; // Discord Bot のトークン
const REPORT_CHANNEL_IDS = process.env.REPORT_CHANNEL_IDS?.split(',').map(id => id.trim()) || []; // 複数チャンネルIDを配列に変換

// Botがログインした後に実行される部分
client.once('ready', async () => {
    console.log(`Logged in as ${client.user?.tag}!`); // Bot のログイン確認

    // ステータスを設定
    if (client.user) {
        client.user.setPresence({
            status: "online", // "online" = 緑（常にオンライン）
            activities: [
                {
                    name: "ピン留めメッセージを監視中", // Botが何をしているか
                    type: discord_js_1.ActivityType.Watching, // 「〇〇を視聴中」と表示
                },
            ],
        });

        console.log("✅ Presence を設定しました！");
    } else {
        console.log("User not found!");
    }

    // ステータスを変更する際に遅延を加えたい場合
    setTimeout(() => {
        if (client.user) {
            client.user.setPresence({
                status: "online", // "online" = 緑（常にオンライン）
                activities: [
                    {
                        name: "ピン留めメッセージを監視中",
                        type: discord_js_1.ActivityType.Watching, // 「〇〇を視聴中」
                    },
                ],
            });
            console.log("✅ Presence を 5 秒後に再設定しました！");
        }
    }, 5000); // 5秒後に再設定
});

// 毎日実行するスケジュール
const schedules = ['* * * * *']; // 毎分実行
schedules.forEach((schedule) => {
    cron.schedule(schedule, async () => {
        let reportMessage = '**📌 今日のピン留めメッセージ一覧**\n'; // 送信するメッセージの初期化
        // すべてのテキストチャンネルをチェック
        for (const [id, channel] of client.channels.cache) {
            if (channel instanceof discord_js_1.TextChannel) { // テキストチャンネルのみ処理
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
            reportMessage = reportMessage.slice(0, 1997) + '...'; // 2000文字を超えないようにカット
        }
        // 指定されたすべてのチャンネルに投稿
        for (const channelId of REPORT_CHANNEL_IDS) {
            const reportChannel = client.channels.cache.get(channelId);
            if (reportChannel) {
                await reportChannel.send(reportMessage); // メッセージを送信
            }
        }
    });
});

// メッセージを受け取った時の処理
client.on("messageCreate", (message) => {
    // Botが自分自身のメッセージに反応しないようにする
    if (message.author.bot) return;

    // "!ping" コマンドに反応
    if (message.content === "!ping") {
        message.reply("🏓 Pong!"); // 「!ping」に反応して「Pong!」を返す
    }
    
});

// Botが切断されたときの処理
client.on("disconnect", () => {
    console.log("Bot が切断されました。再接続を試みます...");
    client.login(TOKEN); // 再接続のためにログイン
});

// Bot にログイン
client.login(TOKEN); // Bot にログイン
