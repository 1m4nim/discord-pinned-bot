"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const cron = require("node-cron");
const dotenv = require("dotenv");
dotenv.config();

// Discord クライアントを作成
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildPresences, 
    ],
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const REPORT_CHANNEL_IDS = process.env.REPORT_CHANNEL_IDS?.split(',').map(id => id.trim()) || [];

client.once("ready", async () => {
    console.log(`Logged in as ${client.user?.tag}!`);

    // 5秒後にステータスを変更
    setTimeout(() => {
        client.user?.setPresence({
            status: "online", // "online" = 緑
            activities: [
                {
                    name: "ピン留めメッセージを監視中",
                    type: discord_js_1.ActivityType.Watching,
                },
            ],
        });
        console.log("✅ Presence を 5 秒後に設定しました！");
    }, 5000);
});

client.on("messageCreate", (message) => {
    if (message.author.bot) return;
    if (message.content === "!ping") {
        message.reply("🏓 Pong!");
    }
});

client.on("disconnect", () => {
    console.log("Bot が切断されました。再接続を試みます...");
    client.login(TOKEN);
});

client.login(TOKEN);
