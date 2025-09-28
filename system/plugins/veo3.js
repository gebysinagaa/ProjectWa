import axios from "axios"

class Veo3 {
  constructor(debug = false) {
    this.debug = debug;
    this.createUrl =
      "https://aiarticle.erweima.ai/api/v1/secondary-page/api/create";
    this.statusUrl = "https://aiarticle.erweima.ai/api/v1/secondary-page/api/";
    this.referer = "https://veo3api.ai/";
    this.origin = "https://veo3api.ai/";
    this.sitekey = "0x4AAAAAAA6UyTUbN2VIQ0np";
  }

  async bypassCF(url) {
    const res = await axios.get(`https://api.paxsenix.org/tools/cf-turnstile-solver?url=${this.origin}&sitekey=${this.sitekey}`)
    return res.data?.solution_token
  }

  async createVideo(token, payload) {
    const headers = {
      authority: "aiarticle.erweima.ai",
      "accept-language": "ms-MY,ms;q=0.9,en-US;q=0.8,en;q=0.7",
      origin: this.origin,
      referer: this.referer,
      "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "user-agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
      verify: token,
      uniqueid: btoa(Date.now()),
    };

    const res = await axios.post(this.createUrl, payload, { headers });
    return res.data?.data?.recordId;
  }

  async checkStatus(recordId) {
    const res = await axios.get(this.statusUrl + recordId, {
      headers: {
        authority: "aiarticle.erweima.ai",
        accept: "application/json, text/plain, */*",
        "accept-language": "ms-MY,ms;q=0.9,en-US;q=0.8,en;q=0.7",
        origin: this.origin,
        referer: this.referer,
        "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
      },
    });

    return res.data?.data;
  }

  async run({ prompt, imgUrls = [] }) {
    return new Promise(async (resolve, reject) => {
      try {
        const token = await this.bypassCF(this.origin);
        if (!token)
          return reject(new Error("Bypass token failed to be obtained"));
        this.debug && console.log("[🛡️ Bypass Success] Token:", token);

        const payload = {
          prompt,
          imgUrls,
          quality: "720p",
          duration: 8,
          autoSoundFlag: true,
          soundPrompt: "",
          autoSpeechFlag: true,
          speechPrompt: "",
          speakerId: "Auto",
          aspectRatio: "16:9",
          secondaryPageId: 2019,
          channel: "VEO3",
          source: "veo3api.ai",
          type: "features",
          watermarkFlag: true,
          privateFlag: true,
          isTemp: true,
          vipFlag: true,
          model: "veo-3-fast",
        };

        const recordId = await this.createVideo(token, payload);
        if (!recordId) return reject(new Error("Failed to get a Record ID"));
        this.debug && console.log("[🎬 Video Requested] Record ID:", recordId);

        const interval = setInterval(async () => {
          try {
            const data = await this.checkStatus(recordId);
            if (data.state === "success" && data.completeData) {
              clearInterval(interval);
              const result = JSON.parse(data.completeData);
              if (result?.data?.image_url) {
                result.data.video_nowm_url = result.data.image_url.replace(/\.(jpg|jpeg|png|webp|gif)$/i, ".mp4");
              }
              this.debug && console.log("[✅ Success]");
              resolve(result);
            } else if (data.failCode || data.failMsg) {
              clearInterval(interval);
              reject(new Error(`[❌ Failed] ${data.failCode} ${data.failMsg}`));
            } else {
              this.debug && console.log("[⌛ Still Processing]");
            }
          } catch (err) {
            clearInterval(interval);
            reject(err);
          }
        }, 5000);
      } catch (err) {
        reject(err);
      }
    });
  }
}

export const run = {
  usage: ['veo3'],
  use: 'prompt & reply media (optional)',
  category: 'ai',
  async: async (m, { client, text, Scraper, Utils, isPrefix, command }) => {
    const prompt = `Make it look like the character is being blown by the wind from the front. Don't move the character's position. Make his eyes blink like a real human. the sound of the wind sounds natural like the areaMake it look like the character is being blown by the wind from the front. Don't move the character's position. Make his eyes blink like a real human. the sound of the wind sounds natural like the area`
    
    if (!text) return client.reply(m.chat, Utils.example(isPrefix, command, prompt), m)

    let imgUrls = []
    let old = new Date()
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''

    if (/image\/(jpe?g|png)/.test(mime)) {
      let buffer = await q.download()
      if (!text) return client.reply(m.chat, Utils.example(isPrefix, command, prompt), m)
      let url = await Scraper.uploadImageV2(buffer)
      if (!url) return client.reply(m.chat, global.status.wrong, m)
      imgUrls.push(url.data.url)
    }

    client.sendReact(m.chat, '🕒', m.key)

    const app = new Veo3(true)
    app.run({
      prompt: text,
      imgUrls
    })
      .then(async (result) => {
        if (result?.data?.video_nowm_url) {
          await client.sendFile(m.chat, result.data.video_nowm_url, `${Date.now()}-veo3.mp4`, `🍟 *Process* : ${((new Date - old) * 1)} ms`, m)
        } else {
          client.reply(m.chat, `❌ Failed to get video URL.`, m)
        }
      })
      .catch(err => client.reply(m.chat, Utils.jsonFormat(err), m))
  },
  error: false,
  premium: true,
  restrict: true,
  cache: true
}