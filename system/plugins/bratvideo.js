import axios from "axios"
import fs from "fs"
import path from "path"
import { execSync } from "child_process"

let handler = async (m, { kzm, text, usedPrefix, command }) => {
  if (!text) {
    return kzm.sendMessage(m.chat, {
      text: `❌ Masukkan teks!\n\nContoh: ${usedPrefix}${command} Aku anak BRAT 😎`
    }, { quoted: m })
  }

  const tempDir = path.join(process.cwd(), "session")
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

  const videoPath = path.join(tempDir, `brat-${Date.now()}.mp4`)
  const stickerPath = path.join(tempDir, `brat-${Date.now()}.webp`)

  try {
    await kzm.sendMessage(m.chat, { text: "🎬 Membuat stiker BRAT... tunggu sebentar" }, { quoted: m })

    // Ambil video dari API
    const apiUrl = `https://api.zenzxz.my.id/maker/bratvid?text=${encodeURIComponent(text)}`
    const { data } = await axios.get(apiUrl, { responseType: "arraybuffer" })
    fs.writeFileSync(videoPath, data)

    if (!fs.existsSync(videoPath)) throw new Error("Video tidak berhasil diunduh")

    // Konversi video → sticker webp
    execSync(
      `ffmpeg -y -i "${videoPath}" -vf "scale=512:512:flags=lanczos,fps=15" -c:v libwebp -preset default -loop 0 -an "${stickerPath}"`,
      { stdio: "ignore" }
    )

    if (!fs.existsSync(stickerPath)) throw new Error("Sticker tidak berhasil dibuat")

    // Kirim hasil stiker
    await kzm.sendMessage(m.chat, {
      sticker: fs.readFileSync(stickerPath)
    }, { quoted: m })

  } catch (err) {
    console.error("BratSticker Error:", err)
    await kzm.sendMessage(m.chat, { text: "❌ Gagal membuat stiker BRAT." }, { quoted: m })
  } finally {
    // Bersihkan file sementara
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath)
    if (fs.existsSync(stickerPath)) fs.unlinkSync(stickerPath)
  }
}

handler.help = ["bratsticker <teks>"]
handler.tags = ["maker", "fun"]
handler.command = ["bratsticker", "bratstick", "bratvid"]

export default handler
