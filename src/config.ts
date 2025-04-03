import dotenv from 'dotenv';

dotenv.config();

export const TOKEN = process.env.DISCORD_BOT_TOKEN!;
export const REPORT_CHANNEL_ID = process.env.REPORT_CHANNEL_ID!;
