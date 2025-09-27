
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

let fs = require('fs')
let file = require.resolve(__filename)
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(`Update ${__filename}`)
delete require.cache[file]
require(file)
})