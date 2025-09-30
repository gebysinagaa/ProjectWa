require("./config")
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const util = require('util')
const axios = require('axios')
const { exec } = require("child_process")
const { Sticker, StickerTypes } = require('wa-sticker-formatter')
const { sendImage, sendImageAsSticker, sendVideoAsSticker } = require("../lib/utils")

module.exports = async (kzm, m) => {
try {
const from = m.key.remoteJid
const body = (
(m.mtype === 'conversation' && m.message.conversation) ||
(m.mtype === 'imageMessage' && m.message.imageMessage.caption) ||
(m.mtype === 'documentMessage' && m.message.documentMessage.caption) ||
(m.mtype === 'videoMessage' && m.message.videoMessage.caption) ||
(m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.text) ||
(m.mtype === 'buttonsResponseMessage' && m.message.buttonsResponseMessage.selectedButtonId) ||
(m.mtype === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage.selectedId)
) ? (
(m.mtype === 'conversation' && m.message.conversation) ||
(m.mtype === 'imageMessage' && m.message.imageMessage.caption) ||
(m.mtype === 'documentMessage' && m.message.documentMessage.caption) ||
(m.mtype === 'videoMessage' && m.message.videoMessage.caption) ||
(m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.text) ||
(m.mtype === 'buttonsResponseMessage' && m.message.buttonsResponseMessage.selectedButtonId) ||
(m.mtype === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage.selectedId)
) : '';

const budy = (typeof m.text === 'string') ? m.text : '';
const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\\©^]/;
const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '.';
const isCmd = body.startsWith(prefix);
const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
const args = body.trim().split(/ +/).slice(1)
const text = q = args.join(" ")
const quoted = m.quoted ? m.quoted : m
const mime = (quoted.msg || quoted).mimetype || ''
const qmsg = (quoted.msg || quoted)
const sender = m.key.fromMe ? (kzm.user.id.split(':')[0]+'@s.whatsapp.net' || kzm.user.id) : (m.key.participant || m.key.remoteJid)
const botNumber = await kzm.decodeJid(kzm.user.id)
const senderNumber = sender.split('@')[0]
const isCreator = (m && m.sender && [botNumber, ...global.info.ownerNumber].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)) || false;
const pushname = m.pushName || `${senderNumber}`
const isBot = botNumber.includes(senderNumber)

const reply = (teks) => {
kzm.sendMessage(from, { text : teks }, { quoted : m })
}

//######## PLUGINS ########
const pluginsLoader = async (directory) => {
    let plugins = [];

    const loadRecursive = async (dir) => {
        const files = fs.readdirSync(dir);
        for (let file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                // Rekursif ke folder dalam
                await loadRecursive(filePath);
            } else if (file.endsWith(".js") || file.endsWith(".mjs")) {
                try {
                    let plugin;
                    // read file to detect ESM syntax (import/export)
                    let content = '';
                    try { content = fs.readFileSync(filePath, 'utf8'); } catch (e) { content = ''; }
                    const looksLikeESM = file.endsWith('.mjs') || /\bimport\b|\bexport\b/.test(content);

                    if (looksLikeESM) {
                        // ESM: use dynamic import()
                        const mod = await import(pathToFileURL(filePath).href);
                        plugin = mod.default || mod;
                    } else {
                        // CJS: try require(), but fallback to import() if require fails
                        try {
                            const resolvedPath = require.resolve(filePath);
                            if (require.cache[resolvedPath]) {
                                delete require.cache[resolvedPath];
                            }
                            plugin = require(filePath);
                        } catch (requireErr) {
                            // fallback to dynamic import (handles .js files that use ESM syntax)
                            const mod = await import(pathToFileURL(filePath).href);
                            plugin = mod.default || mod;
                        }
                    }

                    plugins.push(plugin);
                } catch (error) {
                    console.log(`[Plugin Error] ${filePath}:`, error);
                }
            }
        }
    };

    await loadRecursive(directory);
    return plugins;
};

// === Load semua plugin ===
const plugins = await pluginsLoader(path.resolve(__dirname, "./plugins"));

/**
 * Context yang dikirim ke setiap plugin
 */
const plug = {
    kzm,              // alias socket
    prefix,            // prefix bot
    reply, 
    command,           // command yang dipanggil user
    reply,             // fungsi reply biasa
    text,              // isi text setelah command
    isCreator,         // cek apakah owner
    isGroup: m.isGroup,
    isPrivate: !m.isGroup,
    pushname,          // nama pengirim
    args               // argumen array
};

// === Eksekusi plugin sesuai command ===
for (let plugin of plugins) {
    if (plugin.command && plugin.command.find(e => {
        if (e instanceof RegExp) return e.test(command.toLowerCase());
        return e === command.toLowerCase();
    })) {
        if (plugin.owner && !isCreator) return reply(mess.owner);
        if (plugin.group && !plug.isGroup) return reply(mess.group);
        if (plugin.private && !plug.isPrivate) return reply(mess.private);

        if (typeof plugin !== "function") return;
        await plugin(m, plug);
    }
}
//######## PLUGINS ########
switch(command) {

case 's':
case 'stiker':
case 'sticker': {
  if (!quoted) return reply(`ᴋɪʀɪᴍ ᴀᴛᴀᴜ ʀᴇᴘʟʏ ғᴏᴛᴏ/ᴠɪᴅᴇᴏ/ɢɪғ ᴡɪᴛʜ ᴄᴀᴘᴛɪᴏɴ ${prefix+command}\nᴠɪᴅᴇᴏ ᴅᴜʀᴀsɪ 1-20 ᴅᴇᴛɪᴋ`)
  kzm.sendMessage(m.chat, { react: { text: '🕒', key: m.key }})

  if (/image/.test(mime)) {
    let media = await quoted.download()
    await sendImageAsSticker(kzm, m.chat, media, m, { packname: global.sticker.packname, author: global.sticker.author })
  } else if (/video/.test(mime)) {
    if ((quoted.msg || quoted).seconds > 20) return reply(`ᴋɪʀɪᴍ ᴠɪᴅᴇᴏ ᴅᴜʀᴀsɪ 1-20 ᴅᴇᴛɪᴋ`)
    kzm.sendMessage(m.chat, { react: { text: '🕒', key: m.key }})
    let media = await quoted.download()
    await sendVideoAsSticker(kzm, m.chat, media, m, { packname: global.sticker.packname, author: global.sticker.author })
  } else {
    reply(`ᴋɪʀɪᴍ ᴀᴛᴀᴜ ʀᴇᴘʟʏ ғᴏᴛᴏ/ᴠɪᴅᴇᴏ/ɢɪғ ᴡɪᴛʜ ᴄᴀᴘᴛɪᴏɴ ${prefix+command}\nᴠɪᴅᴇᴏ ᴅᴜʀᴀsɪ 1-20 ᴅᴇᴛɪᴋ`)
  }
}
break

default:
if (budy.startsWith('=>')) {
if (!isCreator) return
function Return(sul) {
sat = JSON.stringify(sul, null, 2)
bang = util.format(sat)
if (sat == undefined) {
bang = util.format(sul)
}
return m.reply(bang)
}
try {
m.reply(util.format(eval(`(async () => { return ${budy.slice(3)} })()`)))
} catch (e) {
m.reply(String(e))
}
}

if (budy.startsWith('>')) {
if (!isCreator) return
let kode = budy.trim().split(/ +/)[0]
let teks
try {
teks = await eval(`(async () => { ${kode == ">>" ? "return" : ""} ${q}})()`)
} catch (e) {
teks = e
} finally {
await m.reply(require('util').format(teks))
}
}

if (budy.startsWith('$')) {
if (!isCreator) return
exec(budy.slice(2), (err, stdout) => {
if (err) return m.reply(`${err}`)
if (stdout) return m.reply(stdout)
})
}
}

} catch (err) {
console.log(util.format(err))
}
}


let file = require.resolve(__filename)
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(`Update ${__filename}`)
delete require.cache[file]
require(file)
})
