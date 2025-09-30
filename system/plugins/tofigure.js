import axios from "axios"

let handler = async (m, { kzm, usedPrefix, command }) => {
  // Cek apakah ada foto yang di-reply
  const quoted = m.quoted
  const mime = quoted ? quoted.mimetype : null

  if (!quoted || !/image/.test(mime)) {
    return kzm.sendMessage(m.chat, { 
      text: `❌ Reply sebuah foto dengan perintah ${usedPrefix}${command}` 
    }, { quoted: m })
  }

  let processing = await kzm.sendMessage(m.chat, { 
    text: "🎨 Sedang mengubah gambar menjadi figure..." 
  }, { quoted: m })

  try {
    // Download gambar dari pesan yang di-reply
    const media = await quoted.download()
    
    // Upload gambar ke telegra.ph atau service lain untuk mendapatkan URL
    const uploadResponse = await axios.post('https://telegra.ph/upload', media, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).catch(async () => {
      // Fallback ke service upload lain jika telegra.ph gagal
      const form = new FormData()
      form.append('file', new Blob([media]), 'image.jpg')
      
      return await axios.post('https://tmpfiles.org/api/v1/upload', form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    })

    let imageUrl
    
    // Parse URL dari response
    if (uploadResponse.data && uploadResponse.data[0] && uploadResponse.data[0].src) {
      // Telegra.ph format
      imageUrl = 'https://telegra.ph' + uploadResponse.data[0].src
    } else if (uploadResponse.data && uploadResponse.data.data && uploadResponse.data.data.url) {
      // tmpfiles format
      imageUrl = uploadResponse.data.data.url
    } else {
      throw new Error('Gagal upload gambar')
    }

    await kzm.sendMessage(m.chat, { 
      text: "🔄 Memproses gambar menjadi figure..." 
    }, { edit: processing.key })

    // Panggil API figurine
    const figureResponse = await axios.get(`https://api.deline.my.id/ai/figurine?url=${encodeURIComponent(imageUrl)}`, {
      timeout: 60000, // 60 detik timeout
      responseType: 'arraybuffer'
    })

    // Kirim hasil gambar figure
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
    
    if (error.message.includes('timeout')) {
      errorMsg = "❌ Timeout: Proses memakan waktu terlalu lama."
    } else if (error.message.includes('upload')) {
      errorMsg = "❌ Gagal upload gambar. Coba lagi."
    } else if (error.response && error.response.status === 404) {
      errorMsg = "❌ API tidak tersedia saat ini."
    } else if (error.response && error.response.status === 400) {
      errorMsg = "❌ Format gambar tidak didukung."
    }
    
    await kzm.sendMessage(m.chat, { 
      text: errorMsg, 
      edit: processing.key 
    })
  }
}

handler.help = ["tofigure (reply foto)"]
handler.tags = ["ai", "tools"]
handler.command = /^(tofigure|figure|figurine)$/i

export default handler