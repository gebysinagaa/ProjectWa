import axios from "axios"

let autoAI = false // default mati
let aiPrompt = `
Kamu adalah Kazumi AI, asisten virtual ramah, sopan, pintar, dan sedikit humoris. 
Selalu jawab dengan jelas, singkat, menyenangkan, dan kalau perlu tambahkan sedikit emote agar terasa hidup.
`

let handler = async (m, { kzm, command, text, isGroup }) => {
  // === Command kontrol on/off ===
  if (command === "aion") {
    autoAI = true
    return kzm.sendMessage(m.chat, { text: "✅ Auto AI berhasil *diaktifkan*." }, { quoted: m })
  }
  if (command === "aioff") {
    autoAI = false
    return kzm.sendMessage(m.chat, { text: "❌ Auto AI berhasil *dimatikan*." }, { quoted: m })
  }

  // === Command ubah sifat AI ===
  if (command === "setai") {
    if (!text) return kzm.sendMessage(m.chat, { text: "❌ Masukkan sifat AI.\nContoh: `.setai jadi AI galak dan ketus`" }, { quoted: m })
    aiPrompt = text
    return kzm.sendMessage(m.chat, { text: `✅ Sifat AI berhasil diubah menjadi:\n\n"${text}"` }, { quoted: m })
  }

  // === Auto AI hanya jalan kalau status aktif ===
  if (!autoAI) return

  // === Mode Grup: hanya kalau bot ditag ===
  if (isGroup && m.mentionedJid && m.mentionedJid.includes(kzm.user.id)) {
    return await replyWithAI(m, kzm)
  }

  // === Mode Private Chat: selalu balas kalau ada pesan teks biasa ===
  if (!isGroup && m.text) {
    return await replyWithAI(m, kzm)
  }
}

// Fungsi balas AI
async function replyWithAI(m, kzm) {
  try {
    const userMessage = m.text || ""
    const query = encodeURIComponent(aiPrompt + "\n\nUser: " + userMessage)
    const apiUrl = `https://api.zenzxz.my.id/ai/gemini?text=${query}`

    const { data } = await axios.get(apiUrl, { timeout: 60000 })
    const result = typeof data === "string" ? data : data.result || JSON.stringify(data)

    await kzm.sendMessage(m.chat, { text: result }, { quoted: m })
  } catch (err) {
    console.error("AutoAI Error:", err)
    await kzm.sendMessage(m.chat, { text: "❌ Gagal memproses AI." }, { quoted: m })
  }
}

handler.help = ["aion", "aioff", "setai <sifat>"]
handler.tags = ["ai"]
handler.command = ["aion", "aioff", "setai"]

export default handler
