const __filename = import.meta.filename;
// Timezone
process.env.TZ = 'Asia/Jakarta';

// Pengaturan Bot disini Semua
global.owner = ["6281345407953"]; // wajib di isi tidak boleh kosong
global.mods = ["6281345407953"]; // wajib di isi tidak boleh kosong
global.prems = ["6281345407953"]; // wajib di isi tidak boleh kosong
global.nameowner = "Finn Phoenix"; // wajib di isi tidak boleh kosong
global.numberowner = "6281345407953"; // wajib di isi tidak boleh kosong
global.mail = "phoenixalfin@gmail.com"; // wajib di isi tidak boleh kosong
global.gc = "https://chat.whatsapp.com/I5RpePh2b5u37OyFjzCNTr"; // wajib di isi tidak boleh kosong
global.instagram = "https://instagram.com/al_vin.233"; // wajib di isi tidak boleh kosong
global.wm = "© Fin Md"; // isi nama bot atau nama kalian
global.wait = "_*Tunggu sedang di proses...*_"; // ini pesan simulasi loading
global.eror = "_*Server Error*_"; // ini pesan saat terjadi kesalahan
global.stiker_wait = "*⫹⫺ Stiker sedang dibuat...*"; // ini pesan simulasi saat loading pembuatan sticker
global.thumb = "https://r0.image2url.com/images/1755274480773-da0ca085-81eb-40b9-98c2-d8abff9150c3.jpg";
global.packname = "Fin Md By Fin Phoenix"; // watermark stikcker packname
global.author = "Tiktok : @alvin_ch1\nIg : @al_vin.233\nFb : Alfin Phoenix Altairs"; // watermark stikcker author
global.maxwarn = "3"; // Peringatan maksimum Warn




// APIKEY INI WAJIB UNTUK DI ISI! //
global.btc = "alfinphoenixaltair";



// AKSESKEY INI DI ISI JIKA DIPERLUKAN JADI TIDAK WAJIB DI ISI! (e.g suno ai (ai music ) & fitur prem lainnya//
global.aksesKey = "alfinphoenix";

// Tidak boleh diganti atau di ubah
global.APIs = {
  btc: "https://api.botcahx.eu.org",
};

//Tidak boleh diganti atau di ubah
global.APIKeys = {
  "https://api.botcahx.eu.org": global.btc,
};

import fs from 'fs';
import chalk from 'chalk';
import { pathToFileURL } from 'url';
let file = import.meta.filename;
fs.unwatchFile(file);
fs.watchFile(file, async () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright("Update 'config.js'"));
  await import(pathToFileURL(file).href + '?update=' + Date.now());
});
