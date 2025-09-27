require("../config") 

let handler = async (m, { kzm, reply, prefix, pushname }) => {
let teks = `
Halo ${pushname}, Aku adalah asisten virtual mu.

┏───• ❲ 𝗜𝗡𝗙𝗢 𝗕𝗢𝗧 ❳
│ • Bot Name: ${info.botName}
│ • Owner: ${info.ownerName}
│ • Type: 𝐜𝐚𝐬𝐞 𝐱 𝐩𝐥𝐮𝐠𝐢𝐧
│ • Total Cmd: 0
│ • Versi: 0.0
│ • Baileys: @shennmine/baileys
│ • Base:
┗────────────────··

╭━━━━[ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 ]
┃ ▣ ${prefix}menu → \`show bot menu\`
╰━━━━━━━━━━━━━❍

┏───• ❲ STICKER ❳
│ • ${prefix}stiker
┗────────────────··

`
await kzm.sendMessage(m.chat, {
caption: teks,
footer: "© Kazumi by IkyyKzy",
buttons: [
{
buttonId: 'action',
buttonText: { displayText: 'ini pesan interactiveMeta' },
type: 4,
nativeFlowInfo: {
name: 'single_select',
paramsJson: JSON.stringify({
title: 'Menu Botz',
sections: [
{
title: 'Menu Populer',
highlight_label: 'Recommended',
rows: [
{ title: '1', id: '.4' },
{ title: '2', id: '.3' },
{ title: '3', id: '.2' },
{ title: '4', id: '.1' }
]
}
]
})
}
}
],
headerType: 1,
viewOnce: true,
video: { url: "https://files.catbox.moe/m2gop2.mp4" },
mimetype: 'video/mp4',
contextInfo: {
isForwarded: true,
mentionedJid: [m.sender, global.owner + "@s.whatsapp.net"],
forwardedNewsletterMessageInfo: {
newsletterJid: "120363334136737005@newsletter",
newsletterName: "Kazumi AI"
},
externalAdReply: {
title: "Ikyy Assistance",
body: "",
thumbnailUrl: "https://files.catbox.moe/12hlmp.jpg",
sourceUrl: "https://wa.me/6281248845231",
mediaType: 1,
renderLargerThumbnail: true,
}
}
}, { quoted: m })

// Tambahan relayMessage button pengganti devinfo
await kzm.relayMessage(m.chat, {
"interactiveMessage": {
"body": {
"text": "Kazumi Botz"
},
"nativeFlowMessage": {
"buttons": [
{
"name": "cta_url",
"buttonParamsJson": JSON.stringify({
display_text: "Instagram 📷",
url: "https://instagram.com/kzy.zx"
})
}
],
"messageParamsJson": "{}"
}
}
}, {})
}

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ["menu"];

module.exports = handler;
