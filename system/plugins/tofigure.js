import axios from "axios"
import FormData from "form-data"

let handler = async (m, { kzm, usedPrefix, command }) => {
  // Ambil gambar dari reply atau caption
  let quoted = m.quoted ? m.quoted : m
  let mime = (quoted.msg || quoted).mimetype || ""

  if (!/image/.test(mime)) {
    return kzm.sendMessage(m.chat, {
      text: `❌ Kirim atau reply sebuah *foto* dengan caption/perintah ${usedPrefix}${command}`
    }, { quoted: m })
  }

  let processing = await kzm.sendMessage(m.chat, {
    text: "🎨 Sedang mengubah gambar menjadi figure..."
  }, { quoted: m })

  try {
    // Download gambar
    const media = await quoted.download()

    // Upload ke telegra.ph
    const form = new FormData()
    form.append("file", media, { filename: "image.jpg" })

    let uploadResponse
    try {
      uploadResponse = await axios.post("https://telegra.ph/upload", form, {
        headers: form.getHeaders(),
        timeout: 30000
      })
    } catch {
      // fallback ke tmpfiles
      const fallback = new FormData()
      fallback.append("file", media, { filename: "image.jpg" })
      uploadResponse = await axios.post("https://tmpfiles.org/api/v1/upload", fallback, {
        headers: fallback.getHeaders(),
        timeout: 30000
      })
    }

    let imageUrl
    if (uploadResponse.data?.[0]?.src) {
      imageUrl = "https://telegra.ph" + uploadResponse.data[0].src
    } else if (uploadResponse.data?.data?.url) {
      imageUrl = uploadResponse.data.data.url
    } else {
      throw new Error("Gagal upload gambar")
    }

    await kzm.sendMessage(m.chat, {
      text: "🔄 Memproses gambar menjadi figure..."
    }, { edit: processing.key })

    // Proses dengan API Figurine
    const figureResponse = await axios.get(
      `https://api.deline.my.id/ai/figurine?url=${encodeURIComponent(imageUrl)}`,
      { timeout: 60000, responseType: "arraybuffer" }
    )

    // Kirim hasil
    await kzm.sendMessage(m.chat, {
      image: Buffer.from(figureResponse.data),
      caption: `✅ *Gambar berhasil diubah menjadi figure!*\n\n_Generated with AI Figurine_`
    }, { quoted: m })

    await kzm.sendMessage(m.chat, {
      text: "✅ Gambar figure berhasil dibuat!",
      edit: processing.key
    })

  } catch (error) {
    console.error("ToFigure Error:", error)

    let errorMsg = "❌ Terjadi kesalahan saat memproses gambar."
    if (error.message.includes("timeout")) {
      errorMsg = "❌ Timeout: Proses memakan waktu terlalu lama."
    } else if (error.message.includes("upload")) {
      errorMsg = "❌ Gagal upload gambar. Coba lagi."
    } else if (error.response?.status === 404) {
      errorMsg = "❌ API tidak tersedia saat ini."
    } else if (error.response?.status === 400) {
      errorMsg = "❌ Format gambar tidak didukung."
    }

    await kzm.sendMessage(m.chat, {
      text: errorMsg,
      edit: processing.key
    })
  }
}

handler.help = ["tofigure (reply foto / caption foto)"]
handler.tags = ["ai", "tools"]
handler.command = /^(tofigure|figure|figurine)$/i

export default handler
