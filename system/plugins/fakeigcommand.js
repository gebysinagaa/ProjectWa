import { createCanvas, loadImage, registerFont } from 'canvas'

let handler = async (m, { kzm, text, usedPrefix, command }) => {
  const quoted = m.quoted
  const mime = quoted ? quoted.mimetype : null

  if (!quoted || !/image/.test(mime)) {
    return kzm.sendMessage(m.chat, { 
      text: `❌ Reply sebuah gambar untuk dijadikan profile picture\n\n*Format:*\n${usedPrefix}${command} username|komentar|jumlah like\n\n*Contoh:*\n${usedPrefix}${command} 33raf777|Paes aman ada Audiero kecuali ole gk ada yang setajam ole|231` 
    }, { quoted: m })
  }

  if (!text) {
    return kzm.sendMessage(m.chat, { 
      text: `❌ Masukkan format yang benar!\n\n*Format:*\n${usedPrefix}${command} username|komentar|jumlah like\n\n*Contoh:*\n${usedPrefix}${command} 33raf777|Paes aman ada Audiero kecuali ole gk ada yang setajam ole|231` 
    }, { quoted: m })
  }

  let creating = await kzm.sendMessage(m.chat, { 
    text: "🎨 Sedang membuat fake comment Instagram..." 
  }, { quoted: m })

  try {
    // Parse input
    const parts = text.split('|').map(p => p.trim())
    if (parts.length < 2) {
      return await kzm.sendMessage(m.chat, { 
        text: "❌ Format salah! Gunakan: username|komentar|jumlah like", 
        edit: creating.key 
      })
    }

    const username = parts[0]
    const comment = parts[1]
    const likes = parts[2] || '0'

    // Download profile picture
    const profileBuffer = await quoted.download()
    const profileImage = await loadImage(profileBuffer)

    // Create canvas dengan ukuran yang sesuai dengan Instagram comment
    const canvas = createCanvas(500, 120)
    const ctx = canvas.getContext('2d')

    // Background (Instagram dark theme)
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw profile picture (circular)
    const ppSize = 32
    const ppX = 16
    const ppY = 16

    ctx.save()
    ctx.beginPath()
    ctx.arc(ppX + ppSize/2, ppY + ppSize/2, ppSize/2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(profileImage, ppX, ppY, ppSize, ppSize)
    ctx.restore()

    // Username
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px Arial'
    ctx.fillText(username, ppX + ppSize + 8, ppY + 15)

    // Time (1 hari)
    ctx.fillStyle = '#8e8e8e'
    ctx.font = '12px Arial'
    ctx.fillText('1 hari', ppX + ppSize + 8 + ctx.measureText(username).width + 10, ppY + 15)

    // Comment text
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px Arial'
    const commentY = ppY + 35
    
    // Wrap text if too long
    const maxWidth = canvas.width - (ppX + ppSize + 8) - 20
    const words = comment.split(' ')
    let line = ''
    let y = commentY
    const lineHeight = 18

    for (let word of words) {
      const testLine = line + word + ' '
      const testWidth = ctx.measureText(testLine).width
      
      if (testWidth > maxWidth && line !== '') {
        ctx.fillText(line, ppX + ppSize + 8, y)
        line = word + ' '
        y += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, ppX + ppSize + 8, y)

    // Like section
    const likeSectionY = y + 25
    
    // Heart icon (simplified)
    ctx.fillStyle = '#8e8e8e'
    ctx.font = '16px Arial'
    ctx.fillText('♡', ppX + ppSize + 8, likeSectionY)
    
    // Reply icon
    ctx.fillText('↩', ppX + ppSize + 35, likeSectionY)

    // Balas text
    ctx.fillStyle = '#8e8e8e'
    ctx.font = '12px Arial'
    ctx.fillText('Balas', ppX + ppSize + 60, likeSectionY - 2)

    // Likes count
    if (likes !== '0') {
      ctx.fillStyle = '#8e8e8e'
      ctx.font = '12px Arial'
      ctx.fillText(`${likes}`, canvas.width - 50, likeSectionY - 2)
      
      // Heart icon for likes (filled)
      ctx.fillStyle = '#ff3040'
      ctx.font = '12px Arial'
      ctx.fillText('❤', canvas.width - 70, likeSectionY - 2)
    }

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png')

    // Send fake comment
    await kzm.sendMessage(m.chat, {
      image: buffer,
      caption: `✅ *Fake Instagram Comment*\n\n👤 *Username:* ${username}\n💬 *Comment:* ${comment}\n❤️ *Likes:* ${likes}\n\n_Generated with Fake IG Comment Generator_`
    }, { quoted: m })

    await kzm.sendMessage(m.chat, { 
      text: "✅ Fake comment Instagram berhasil dibuat!", 
      edit: creating.key 
    })

  } catch (error) {
    console.error("Fake IG Comment Error:", error)
    
    let errorMsg = "❌ Terjadi kesalahan saat membuat fake comment."
    
    if (error.message.includes('Canvas')) {
      errorMsg = "❌ Error dalam pembuatan gambar. Pastikan gambar valid."
    } else if (error.message.includes('format')) {
      errorMsg = "❌ Format input salah. Gunakan: username|komentar|jumlah like"
    }
    
    await kzm.sendMessage(m.chat, { 
      text: errorMsg, 
      edit: creating.key 
    })
  }
}

handler.help = ["fakeigcomment <username|komentar|likes> (reply gambar pp)"]
handler.tags = ["maker", "tools"]
handler.command = /^(fakeigcomment|fakeig|igcomment)$/i

export default handler