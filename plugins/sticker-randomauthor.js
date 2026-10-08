// random author yee
const daftarAuthor = [
    'Owner : FinPhx', 'Owner : FinPhx\nTiktok : @alvin_ch1', 'Owner : FinPhx\nIg : @al_vin.233', 'Owner : FinPhx\nFb : Alfin Phoenix Altairs', 'Owner : FinPhx\nWa : 6281345407953', 'Owner : FinPhx\Threads : @al_vin.233'
];

export default function getRandomAuthor() {
    return daftarAuthor[Math.floor(Math.random() * daftarAuthor.length)];
}
