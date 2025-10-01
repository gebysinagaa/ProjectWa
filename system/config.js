import fs from "fs"

// ==== INFORMASI BOT ====
global.info = {
   ownerName: "𝐈𝐤𝐲𝐲𝐊𝐳𝐲",
   ownerNumber: "6281248845231",
   botName: "Kazumi Botz",
   botVersion: "1.0.0",
}

global.mess = {
   group: "Only Group",
   private: "Only Private",
   owner: "Only Owner"
}

global.sticker = {
   packname: "Sticker Made By",
   author: "Kazumi"
}

// ==== AUTO RELOAD CONFIG.JS ====
const file = new URL(import.meta.url).pathname
fs.watchFile(file, () => {
   fs.unwatchFile(file)
   console.log(`Update ${file}`)
   import(`${import.meta.url}?update=${Date.now()}`)
})
