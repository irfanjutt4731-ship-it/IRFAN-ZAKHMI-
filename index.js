
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

import P from "pino";
import { config } from "./config.js";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (
      connection === "connecting" &&
      !state.creds.registered
    ) {
      const number = await new Promise(resolve => {
        rl.question("Enter WhatsApp number: ", resolve);
      });

      try {
        const code = await sock.requestPairingCode(
          number.replace(/\D/g, "")
        );

        console.log("PAIRING CODE:", code);
      } catch (error) {
        console.log("Pairing error:", error.message);
      }
    }

    if (connection === "open") {
      console.log(config.botName + " CONNECTED!");
      rl.close();
    }

    if (connection === "close") {
      const code =
        lastDisconnect?.error?.output?.statusCode;

      if (code !== DisconnectReason.loggedOut) {
        setTimeout(startBot, 5000);
      } else {
        console.log("WhatsApp logged out. Relink required.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;

      if (!jid || jid === "status@broadcast") continue;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      const command = text.trim().toLowerCase();

      if (command === ".menu") {
        await sock.sendMessage(jid, {
          text:
`╭━━━〔 ${config.botName} 〕
┃ .menu
┃ .ping
┃ .alive
┃ .owner
┃ .time
╰━━━━━━━━━━━━`
        });
      }

      else if (command === ".ping") {
        await sock.sendMessage(jid, {
          text: "Pong! Bot is working 🏓"
        });
      }

      else if (command === ".alive") {
        await sock.sendMessage(jid, {
          text: `${config.botName} is Online! ✅`
        });
      }

      else if (command === ".owner") {
        await sock.sendMessage(jid, {
          text: `Owner: ${config.ownerName}\nNumber: ${config.ownerNumber}`
        });
      }

      else if (command === ".time") {
        await sock.sendMessage(jid, {
          text: new Date().toLocaleString("en-PK", {
            timeZone: config.timezone
          })
        });
      }
    }
  });
}

startBot().catch(console.error);
    
