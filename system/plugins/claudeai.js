// claude.js
import axios from "axios"

const defaultSystemPrompt = `
Kamu adalah Claude versi ringan yang berbicara dalam bahasa INDONESIA.
Gaya bicara: ramah, santai, hangat, dan tidak kaku. 
Jangan bertele-tele — jawab singkat tapi jelas. 
Boleh tambahkan emoji atau humor ringan kalau cocok. 
Jika ada langkah atau daftar, beri poin/nomor agar mudah dibaca.
Kalau tidak yakin, bilang "Sepertinya saya tidak tahu pasti, tapi..." dan beri tebakan yang masuk akal.
Gunakan bahasa yang natural dan mudah dimengerti oleh orang Indonesia.
`.trim()

let handler = async (m, { kzm, text, usedPrefix, command }) => {
  if (!text) {
    return kzm.sendMessage(m.chat, {
      text: `Contoh penggunaan:\n${usedPrefix}${command} Siapa presiden Indonesia saat ini?`
    }, { quoted: m })
  }

  // optional: you could allow per-command custom prompt prefix, but for now use defaultSystemPrompt
  const systemPrompt = defaultSystemPrompt

  // bangun prompt akhir yang dikirim ke API
  const finalPrompt = `${systemPrompt}\n\nPertanyaan dari user:\n${text}`

  // beri tahu user bahwa bot sedang memproses
  const thinking = await kzm.sendMessage(m.chat, { text: "🤖 Claude sedang berpikir... tunggu sebentar ya." }, { quoted: m })

  try {
    const apiUrl = `https://api.deline.my.id/ai/claude-3.7?q=${encodeURIComponent(finalPrompt)}`
    const { data } = await axios.get(apiUrl, { timeout: 60000 })

    // Ambil teks jawaban dari response dengan beberapa pola fallback
    let resultText = ""
    if (!data) {
      resultText = "Maaf, server tidak merespon."
    } else if (typeof data === "string") {
      resultText = data
    } else if (data.result && typeof data.result === "string") {
      resultText = data.result
    } else if (data.text && typeof data.text === "string") {
      resultText = data.text
    } else if (data.output && typeof data.output === "string") {
      resultText = data.output
    } else {
      // fallback: stringify ringkas
      try {
        resultText = JSON.stringify(data).slice(0, 3000)
      } catch (e) {
        resultText = "Gagal membaca hasil dari API."
      }
    }

    if (!resultText || resultText.trim() === "") {
      resultText = "Maaf, Claude tidak menghasilkan jawaban yang bisa ditampilkan."
    }

    // kirim jawaban (edit pesan thinking agar rapi)
    await kzm.sendMessage(m.chat, { text: resultText }, { edit: thinking.key })

  } catch (err) {
    console.error("Claude API Error:", err)
    const userMsg = err?.code === 'ECONNABORTED'
      ? "❌ Timeout: proses memakan waktu terlalu lama."
      : `❌ Terjadi kesalahan saat memanggil Claude API.\n${err.message || ''}`

    await kzm.sendMessage(m.chat, { text: userMsg }, { edit: thinking.key })
  }
}

handler.help = ["claude <teks>"]
handler.tags = ["ai"]
handler.command = /^(claude|claude37|claude3|clad)$/i

export default handler
