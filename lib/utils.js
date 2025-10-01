import fs from "fs"
import axios from "axios"
import { imageToWebp, videoToWebp, writeExifImg, writeExifVid } from "./exif.js"

async function getBuffer(url, options = {}) {
  try {
    const res = await axios.get(url, {
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Request': 1
      },
      ...options,
      responseType: 'arraybuffer'
    })
    return res.data
  } catch (e) {
    return e
  }
}

async function sendImage(kzm, jid, path, caption = '', quoted = '', options = {}) {
  let buffer = Buffer.isBuffer(path)
    ? path
    : /^data:.*?\/.*?;base64,/i.test(path)
      ? Buffer.from(path.split`,`[1], 'base64')
      : /^https?:\/\//.test(path)
        ? await getBuffer(path)
        : fs.existsSync(path)
          ? fs.readFileSync(path)
          : Buffer.alloc(0)

  return await kzm.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
}

async function sendImageAsSticker(kzm, jid, path, quoted, options = {}) {
  let buff = Buffer.isBuffer(path)
    ? path
    : /^data:.*?\/.*?;base64,/i.test(path)
      ? Buffer.from(path.split`,`[1], 'base64')
      : /^https?:\/\//.test(path)
        ? await getBuffer(path)
        : fs.existsSync(path)
          ? fs.readFileSync(path)
          : Buffer.alloc(0)

  let buffer
  if (options && (options.packname || options.author)) {
    buffer = await writeExifImg(buff, options)
  } else {
    buffer = await imageToWebp(buff)
  }

  await kzm.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
    .then(response => {
      fs.unlinkSync(buffer)
      return response
    })
}

async function sendVideoAsSticker(kzm, jid, path, quoted, options = {}) {
  let buff = Buffer.isBuffer(path)
    ? path
    : /^data:.*?\/.*?;base64,/i.test(path)
      ? Buffer.from(path.split`,`[1], 'base64')
      : /^https?:\/\//.test(path)
        ? await getBuffer(path)
        : fs.existsSync(path)
          ? fs.readFileSync(path)
          : Buffer.alloc(0)

  let buffer
  if (options && (options.packname || options.author)) {
    buffer = await writeExifVid(buff, options)
  } else {
    buffer = await videoToWebp(buff)
  }

  await kzm.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
  return buffer
}

export { getBuffer, sendImage, sendImageAsSticker, sendVideoAsSticker }
