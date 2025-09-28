import axios from "axios"
import * as cheerio from "cheerio"

async function scrapeKbbi(q) {
  const response = await axios.get(
    `https://kbbi.kemdikbud.go.id/entri/${encodeURIComponent(q)}`,
    {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    }
  )

  const html = response.data
  const $ = cheerio.load(html)
  const isExist = !/tidak ditemukan/i.test(
    $("body > div.container.body-content > h4[style=\"color:red\"]").text(),
  )

  if (!isExist) {
    throw new Error(`${q} tidak ditemukan di KBBI!`)
  }

  const results = []
  let isContent = false
  let lastTitle

  $("body > div.container.body-content")
    .children()
    .each((_, el) => {
      const tag = el.tagName
      const elem = $(el)

      if (tag === "hr") {
        isContent = !isContent && !results.length
      }

      if (tag === "h2" && isContent) {
        const indexText = elem.find("sup").text().trim()
        const index = parseInt(indexText) || 0
        const title = elem.text().trim()
        results.push({
          index: index,
          title: title,
          means: [],
        })
        lastTitle = title
      }

      if ((tag === "ol" || tag === "ul") && isContent && lastTitle) {
        elem.find("li").each((_, liEl) => {
          const li = $(liEl).text().trim()
          const index = results.findIndex(({ title }) => title === lastTitle)
          if (index !== -1) {
            results[index].means.push(li)
          }
        })
        lastTitle = undefined
      }
    })

  if (results.length === 0) {
    throw new Error(`${q} tidak ditemukan di KBBI!`)
  }
  return results
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return conn.sendMessage(m.chat, { text: `Contoh: ${usedPrefix}${command} rumah` }, { quoted: m })

  let searching = await conn.sendMessage(m.chat, { text: "🔍 Mencari di KBBI..." }, { quoted: m })

  try {
    const result = await scrapeKbbi(text.trim())
    
    let response = `📖 *KBBI - ${text.toUpperCase()}*\n\n`
    
    result.forEach((item, idx) => {
      response += `*${item.index || (idx + 1)}. ${item.title}*\n`
      
      if (item.means && item.means.length > 0) {
        item.means.forEach((meaning, meaningIdx) => {
          response += `   ${meaningIdx + 1}. ${meaning}\n`
        })
      }
      response += `\n`
    })
    
    response += `_Source: KBBI Kemendikbud_`
    
    await conn.sendMessage(m.chat, { text: response, edit: searching.key })
  } catch (error) {
    console.error("KBBI Error:", error)
    let errorMsg = "❌ Terjadi kesalahan saat mencari di KBBI."
    
    if (error.message.includes("tidak ditemukan")) {
      errorMsg = `❌ Kata "${text}" tidak ditemukan di KBBI.`
    } else if (error.message.includes("Network")) {
      errorMsg = "❌ Gagal terhubung ke server KBBI."
    }
    
    await conn.sendMessage(m.chat, { text: errorMsg, edit: searching.key })
  }
}

handler.help = ["kbbi <kata>"]
handler.tags = ["tools"]
handler.command = /^(kbbi|arti)$/i

export default handler