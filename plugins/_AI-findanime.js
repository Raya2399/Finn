import axios from 'axios';
import BodyForm from 'form-data';
import { fileTypeFromBuffer } from 'file-type';

async function detectCharacter(buffer) {
  const BASE_URL = "https://smilingwolf-wd-tagger.hf.space/gradio_api";
  const session_hash = Math.random().toString(36).substring(2);
  const file_name = Math.random().toString(36).substring(2);
  const headers = {
    origin: "https://smilingwolf-wd-tagger.hf.space",
    referer: "https://smilingwolf-wd-tagger.hf.space/",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "content-type": "application/json",
  };

  const { ext, mime } = (await fileTypeFromBuffer(buffer)) || {};
  const form = new BodyForm();
  form.append("files", buffer, {
    filename: file_name + "." + ext,
    contentType: mime,
  });

  const files = await axios.post(`${BASE_URL}/upload?upload_id=${session_hash}`, form, {
    headers: { ...headers, ...form.getHeaders() },
  }).then(res => res.data);

  const file_res = {
    path: files[0],
    mime_type: mime,
    orig_name: file_name + "." + ext,
    meta: { _type: "gradio.FileData" },
    size: buffer.length,
    url: `${BASE_URL}/file=${files[0]}`,
  };

  await axios.post(`${BASE_URL}/queue/join`, {
    data: [
      file_res,
      "SmilingWolf/wd-swinv2-tagger-v3",
      0.35,
      true,
      0.85,
      true,
    ],
    event_data: null,
    fn_index: 2,
    session_hash,
    trigger_id: 18,
  });

  const stream = await axios.get(`${BASE_URL}/queue/data?session_hash=${session_hash}`, {
    headers: { ...headers, "content-type": "text/event-stream" },
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {
    let result = '';
    stream.data.on('data', (chunk) => {
      result += chunk.toString();
      const lines = result.split('\n');
      result = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.msg !== "process_completed") continue;
            if (!data.success) return resolve({ status: false, data });

            const dt = data.output.data;
            const is_char = typeof dt[2]?.label === 'string';
            const res = {
              prompt: dt[0],
              rating: dt[1].confidences,
              character: {
                name: dt[2]?.label,
                list: dt[2]?.confidences,
              },
              tags: {
                name: dt[3].label,
                list: dt[3].confidences,
              },
            };

            resolve({ status: true, data: res, is_char });
          } catch (err) {
            console.error('Error parsing JSON:', err);
            resolve({ status: false, msg: err.message });
          }
        }
      }
    });

    stream.data.on('error', reject);
  });
}

const handler = async (m) => {
  try {
    const target = m.quoted ? m.quoted : m;
    const mime = (target.msg || target).mimetype || '';
    if (!/image/.test(mime)) return m.reply("Harap reply ke gambar yang mau dicari");

    const media = await target.download();
    const res = await detectCharacter(media);

    const fixed = (num) => (num * 100).toFixed(2);
    if (!res.is_char) return m.reply("Tidak terdeteksi karakter di gambar tersebut");

    const teks = `
??? Karakter yang terdeteksi adalah
> Nama: ${res.data.character.name}
> Persentase: ${fixed(res.data.character.list[0].confidence || 0)}%

${res.data.character.list.length >= 2 ? `\n??? Karakter lain yang terdeteksi\n${res.data.character.list.map(it => `> Nama: ${it.label}\n> Persentase: ${fixed(it.confidence || 0)}%`).join('\n\n')}\n` : ''}

??? Prompt
${res.data.prompt}

??? Rating
${res.data.rating.map(it => `> ${it.label}: ${fixed(it.confidence || 0)}%`).join('\n')}

??? Tag
${res.data.tags.list.map(it => `> ${it.label}: ${fixed(it.confidence || 0)}%`).join('\n')}
`.trim();

    m.reply(teks);
  } catch (e) {
    console.error(e);
    m.reply(`Terjadi kesalahan saat mendeteksi karakter!\n\n${e.message}`);
  }
};

handler.help = handler.command = ['findanime', 'apaitu', 'apatuh'];
handler.tags = ['ai'];
handler.premium = false;
handler.limit = true;

export default handler;
