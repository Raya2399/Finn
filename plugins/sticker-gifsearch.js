//<>GIFSEARCH , MENCARI GIF DAN RESULTNYA BERUPA STIKER<>
//SOURCE: https://whatsapp.com/channel/0029VaJYWMb7oQhareT7F40V
//SUMBER SCRAPE: https://whatsapp.com/channel/0029VbB0oUvBlHpYbmFDsb3E/242
//DON'T DELETE THIS WM!
//HAPUS WM MANDUL 7 TURUNAN 
//HAPUS WM=SDM RENDAH  
//BAGI YANG RECODE DAN YANG MENYESUAIKAN LAGI NI CODE, MOHON UNTUK JANGAN DIHAPUS WM PERTAMA, ATAU BERI CREDIT LINK CH YANG SHARE CODE INI!
//"aku janji tidak akan hapus wm ini, karena amanah ini harus saya pegang!"
//RABU, 09 APRIL 2025 18:19
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function gifsSearch(q) {
  try {
    const searchUrl = `https://tenor.com/search/${q}-gifs`;
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(data);
    const results = [];

    $('figure.UniversalGifListItem').each((i, el) => {
      const $el = $(el);
      const img = $el.find('img');
      const gifUrl = img.attr('src');
      const alt = img.attr('alt') || 'No description';
      const detailPath = $el.find('a').first().attr('href');

      if (gifUrl && gifUrl.endsWith('.gif') && detailPath) {
        results.push({
          gif: gifUrl,
          alt,
          link: 'https://tenor.com' + detailPath,
        });
      }
    });

    return results;
  } catch (error) {
    console.error('Error fetching GIFs:', error);
    return [];
  }
}

const handler = async (m, { conn, text, command, usedPrefix }) => {
  if (!text) throw `Contoh: ${usedPrefix + command} raurus|5`;

  const [query, countStr] = text.split('|');
  const count = Math.min(Number(countStr) || 1, 10);

  const results = await gifsSearch(query.trim());
  if (!results.length) throw 'GIF tidak ditemukan!';

  const picks = [];
  const usedIndexes = new Set();
  while (picks.length < count && usedIndexes.size < results.length) {
    const i = Math.floor(Math.random() * results.length);
    if (!usedIndexes.has(i)) {
      usedIndexes.add(i);
      picks.push(results[i]);
    }
  }

  for (const pick of picks) {
    try {
      // unduh GIF sebagai buffer
      const { data } = await axios.get(pick.gif, { responseType: 'arraybuffer' });
      const media = Buffer.from(data);

      // === BAGIAN YANG DIUBAH SESUAI PERMINTAAN ===
      // gunakan author dari global.author, bukan authorList acak
      let encmedia = await conn.sendVideoAsSticker(
        m.chat,
        media,
        m,
        { packname: global.packname, author: global.author }
      );
      await fs.unlinkSync(encmedia);
      // =============================================

    } catch (e) {
      console.error(`gagal kirim stiker: ${pick.gif}`, e);
    }
  }
};

handler.help = ['gifsearch <keyword>|<jumlah>'];
handler.tags = ['sticker'];
handler.command = /^gifsearch$/i;

export default handler;
//<>GIFSEARCH , MENCARI GIF DAN RESULTNYA BERUPA STIKER<>
//SOURCE: https://whatsapp.com/channel/0029VaJYWMb7oQhareT7F40V
//SUMBER SCRAPE: https://whatsapp.com/channel/0029VbB0oUvBlHpYbmFDsb3E/242
//DON'T DELETE THIS WM!
//HAPUS WM MANDUL 7 TURUNAN 
//HAPUS WM=SDM RENDAH  
//BAGI YANG RECODE DAN YANG MENYESUAIKAN LAGI NI CODE, MOHON UNTUK JANGAN DIHAPUS WM PERTAMA, ATAU BERI CREDIT LINK CH YANG SHARE CODE INI!
//"aku janji tidak akan hapus wm ini, karena amanah ini harus saya pegang!"
//RABU, 09 APRIL 2025 18:19
