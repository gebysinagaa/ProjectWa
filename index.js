import baileys from "@whiskeysockets/baileys";
const {
  default: makeWASocket,
  DisconnectReason,
  makeInMemoryStore,
  jidDecode,
  proto,
  getContentType,
  useMultiFileAuthState,
  downloadContentFromMessage
} = baileys;

import pino from "pino";
import { Boom } from "@hapi/boom";
import fs from "fs";
import path from "path";
import readline from "readline";
import PhoneNumber from "awesome-phonenumber";
import { fileURLToPath } from "url";

// __dirname fix for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load plugins
async function loadPlugins(dir = path.join(__dirname, "system", "plugins")) {
  fs.readdirSync(dir).forEach(async (file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      loadPlugins(fullPath);
    } else if (file.endsWith(".js")) {
      try {
        await import(fullPath);
        console.log("✅ Loaded plugin:", fullPath.replace(__dirname, ""));
      } catch (err) {
        console.error("❌ Gagal load plugin:", file, err);
      }
    }
  });
}

const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});

const question = (text) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(text, resolve));
};

async function startBotz() {
  const { state, saveCreds } = await useMultiFileAuthState("connect/session");

  const kzm = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000,
    emitOwnEvents: true,
    fireInitQueries: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
  });

    //Tambahkan fungsi decodeJid manual biar tidak error
  kzm.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else {
      return jid;
    }
  };

  if (!kzm.authState.creds.registered) {
    const phoneNumber = await question("Masukkan Nomor Awali dengan 62:\n");
    let code = await kzm.requestPairingCode(phoneNumber);
    code = code?.match(/.{1,4}/g)?.join("-") || code;
    console.log(`PAIRING CODE :`, code);
  }

  store.bind(kzm.ev);

  kzm.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0];
      if (!mek.message) return;
      mek.message =
        Object.keys(mek.message)[0] === "ephemeralMessage"
          ? mek.message.ephemeralMessage.message
          : mek.message;
      if (mek.key && mek.key.remoteJid === "status@broadcast") return;

      const m = smsg(kzm, mek, store);
      const caseModule = await import("./system/case.js");
      caseModule.default(kzm, m, chatUpdate, store);
    } catch (err) {
      console.log(err);
    }
  });

  kzm.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (
        reason === DisconnectReason.badSession ||
        reason === DisconnectReason.connectionClosed ||
        reason === DisconnectReason.connectionLost ||
        reason === DisconnectReason.connectionReplaced ||
        reason === DisconnectReason.restartRequired ||
        reason === DisconnectReason.timedOut
      ) {
        startBotz();
      } else if (reason === DisconnectReason.loggedOut) {
        console.log("Logged out.");
      } else {
        kzm.end(`Unknown DisconnectReason: ${reason}|${connection}`);
      }
    } else if (connection === "open") {
      console.log("[Connected] " + JSON.stringify(kzm.user.id, null, 2));
    }
  });

  kzm.ev.on("creds.update", saveCreds);

  kzm.sendText = (jid, text, quoted = "", options = {}) =>
    kzm.sendMessage(jid, { text: text, ...options }, { quoted });

  kzm.downloadMediaMessage = async (message) => {
    const mime = (message.msg || message).mimetype || "";
    const messageType = message.mtype
      ? message.mtype.replace(/Message/gi, "")
      : mime.split("/")[0];
    const stream = await downloadContentFromMessage(message, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
  };

  return kzm;
}

loadPlugins();
startBotz();

// ===============================
// smsg function lengkap
// ===============================
function smsg(kzm, m, store) {
  if (!m) return m;
  let M = proto.WebMessageInfo;
  if (m.key) {
    m.id = m.key.id;
    m.isBaileys = m.id.startsWith("BAE5") && m.id.length === 16;
    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.isGroup = m.chat.endsWith("@g.us");
    m.sender = kzm.decodeJid(
      m.fromMe && kzm.user.id ||
      m.participant ||
      m.key.participant ||
      m.chat ||
      ""
    );
    if (m.isGroup) m.participant = kzm.decodeJid(m.key.participant) || "";
  }
  if (m.message) {
    m.mtype = getContentType(m.message);
    m.msg =
      m.mtype == "viewOnceMessage"
        ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)]
        : m.message[m.mtype];
    m.body =
      m.message.conversation ||
      m.msg.caption ||
      m.msg.text ||
      (m.mtype == "listResponseMessage" &&
        m.msg.singleSelectReply.selectedRowId) ||
      (m.mtype == "buttonsResponseMessage" && m.msg.selectedButtonId) ||
      (m.mtype == "viewOnceMessage" && m.msg.caption) ||
      m.text;
    let quoted = (m.quoted = m.msg.contextInfo
      ? m.msg.contextInfo.quotedMessage
      : null);
    m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
    if (m.quoted) {
      let type = getContentType(quoted);
      m.quoted = m.quoted[type];
      if (["productMessage"].includes(type)) {
        type = getContentType(m.quoted);
        m.quoted = m.quoted[type];
      }
      if (typeof m.quoted === "string")
        m.quoted = { text: m.quoted };
      m.quoted.mtype = type;
      m.quoted.id = m.msg.contextInfo.stanzaId;
      m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
      m.quoted.isBaileys = m.quoted.id
        ? m.quoted.id.startsWith("BAE5") && m.quoted.id.length === 16
        : false;
      m.quoted.sender = kzm.decodeJid(m.msg.contextInfo.participant);
      m.quoted.fromMe = m.quoted.sender === kzm.decodeJid(kzm.user.id);
      m.quoted.text =
        m.quoted.text ||
        m.quoted.caption ||
        m.quoted.conversation ||
        m.quoted.contentText ||
        m.quoted.selectedDisplayText ||
        m.quoted.title ||
        "";
      m.quoted.mentionedJid = m.msg.contextInfo
        ? m.msg.contextInfo.mentionedJid
        : [];
      m.quoted.fakeObj = M.fromObject({
        key: {
          remoteJid: m.quoted.chat,
          fromMe: m.quoted.fromMe,
          id: m.quoted.id,
        },
        message: quoted,
        ...(m.isGroup ? { participant: m.quoted.sender } : {}),
      });

      m.quoted.delete = () =>
        kzm.sendMessage(m.quoted.chat, { delete: m.quoted.fakeObj.key });

      m.quoted.download = () => kzm.downloadMediaMessage(m.quoted);
    }
  }
  if (m.msg?.url) m.download = () => kzm.downloadMediaMessage(m.msg);
  m.text =
    m.msg.text ||
    m.msg.caption ||
    m.message.conversation ||
    m.msg.contentText ||
    m.msg.selectedDisplayText ||
    m.msg.title ||
    "";
  m.reply = (text, chatId = m.chat, options = {}) =>
    Buffer.isBuffer(text)
      ? kzm.sendMessage(chatId, { document: text, mimetype: "application/octet-stream" }, { quoted: m })
      : kzm.sendText(chatId, text, m, { ...options });

  return m;
}

// Hot reload
const file = __filename;
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(`Update ${__filename}`);
  import(file);
});
           
