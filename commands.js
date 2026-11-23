
import { config } from "./config.js";

export function getCommand(text) {
  const command = text.trim().toLowerCase();

  switch (command) {
    case ".menu":
      return `╭━━━〔 ${config.botName} 〕
┃
┃ .menu
┃ .ping
┃ .alive
┃ .owner
┃ .time
┃
╰━━━〔 BOT ONLINE 〕`;

    case ".ping":
      return "Pong! 🏓 Bot is working!";

    case ".alive":
      return `${config.botName} is Online! ✅`;

    case ".owner":
      return `Owner: ${config.ownerName}
Number: ${config.ownerNumber}`;

    case ".time":
      return new Date().toLocaleString("en-PK", {
        timeZone: config.timezone
      });

    default:
      return null;
  }
}
