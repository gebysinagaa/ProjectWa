import axios from "axios"

let handler = async (m, { kzm, text, usedPrefix, command }) => {
  if (!text) {
    return kzm.sendMessage(m.chat, { 
      text: `❌ Masukkan teks!\n\nContoh: ${usedPrefix}${command} Aku anak BRAT 😎` 
    }, { quoted: m })
  }

  try {
    await kzm.sendMessage(m.chat, { text: "🎬 Membuat video BRAT... tunggu sebentar" }, { quoted: m })

    const apiUrl = `https://api.zenzxz.my.id/maker/bratvid?text=${encodeURIComponent(text)}`
    const { data } = await axios.get(apiUrl, { responseType: "arraybuffer" })

    await kzm.sendMessage(m.chat, {
      video: Buffer.from(data),
      caption: `✅ Video BRAT berhasil dibuat!\n\n📝 Teks: ${text}`
    }, { quoted: m })
  } catch (err) {
    console.error("BratVideo Error:", err)
    await kzm.sendMessage(m.chat, { text: "❌ Gagal membuat video BRAT." }, { quoted: m })
  }
}

handler.help = ["bratvideo <teks>"]
handler.tags = ["maker", "fun"]
handler.command = ["bratvideo", "bratvid"]

export default handler
