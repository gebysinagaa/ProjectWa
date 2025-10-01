import https from "https"

async function eaiquery(prompt, model = "perplexity-ai") {
    return new Promise((resolve, reject) => {
        // Tambahkan instruksi gaya bahasa
        const finalPrompt = `
Kamu adalah asisten AI berbahasa Indonesia yang ramah, santai, dan asik.
Jawabanmu jangan terlalu formal atau kaku, usahakan enak dibaca, jelas, 
kadang boleh kasih humor ringan atau emoji biar lebih hidup 😊.

Pertanyaan user:
${prompt}
        `.trim()

        const postData = JSON.stringify({
            message: finalPrompt,
            model: model,
            history: []
        })

        const options = {
            hostname: 'whatsthebigdata.com',
            port: 443,
            path: '/api/ask-ai/',
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'origin': 'https://whatsthebigdata.com',
                'referer': 'https://whatsthebigdata.com/ai-chat/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'
            }
        }

        const req = https.request(options, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => {
                try {
                    const result = JSON.parse(data)
                    resolve(result.text)
                } catch (error) {
                    reject(error.message)
                }
            })
        })

        req.on('error', error => reject(error.message))
        req.write(postData)
        req.end()
    })
}

let handler = async (m, { kzm, text, usedPrefix, command }) => {
    if (!text) {
        return kzm.sendMessage(m.chat, {
            text: `Contoh: ${usedPrefix}${command} Siapa presiden Indonesia saat ini?`
        }, { quoted: m })
    }

    let thinking = await kzm.sendMessage(m.chat, { text: "🤔 Lagi mikir jawabannya nih, sabar ya..." }, { quoted: m })

    try {
        let result = await eaiquery(text)

        if (!result || result.trim() === '') {
            result = "Maaf ya, aku nggak nemu jawaban yang pas 🤧."
        }

        await kzm.sendMessage(m.chat, { text: result, edit: thinking.key })
    } catch (error) {
        console.error("Perplexity AI Error:", error)
        await kzm.sendMessage(m.chat, {
            text: "❌ Aduh, ada error waktu nanya ke Perplexity AI. Coba lagi ya ✨",
            edit: thinking.key
        })
    }
}

handler.help = ["perplexity <teks>", "pplx <teks>"]
handler.tags = ["ai"]
handler.command = /^(perplexity|pplx)$/i

export default handler
