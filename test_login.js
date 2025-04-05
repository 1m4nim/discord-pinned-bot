const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config(); // .envファイルを読み込む

const token = process.env.DISCORD_BOT_TOKEN;

// --- デバッグログ ---
console.log('--- Login Test Start ---');
if (token) {
  console.log('DISCORD_BOT_TOKEN seems loaded.');
  // console.log('Token read:', token); // トークン自体は表示しない
} else {
  console.error('❌ DISCORD_BOT_TOKEN is not loaded from .env!');
  process.exit(1);
}
// --- デバッグログ ここまで ---

if (!token) {
  console.error('❌ Token is missing. Exiting.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] }); // 最小限のインテント

client.once('ready', () => {
  console.log(`✅ Logged in successfully as ${client.user.tag}!`);
  client.destroy(); // ログイン成功したらすぐに終了
  console.log('Login successful. Test finished.');
});

client.on('error', (error) => {
  console.error('❌ Discord Client Error during login test:', error);
});

console.log('Attempting to login with the loaded token...');

client.login(token).catch((err) => {
  console.error('❌ Login failed in test script:', err);
  // console.error(err); // エラー詳細（トークンが含まれる可能性あり）
  process.exit(1); // エラーで終了
});

console.log('Login process initiated...');