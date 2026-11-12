// Generator ilustrasi produk demo (backend/app/seed_images).
// Jalankan: node scripts/seed-art.js <folder-output>  -> PNG 800x800, lalu konversi ke WebP.
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];

const bg = (a, b, id = 'bg') => `
  <defs>
    <radialGradient id="${id}" cx="50%" cy="38%" r="75%">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </radialGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="soft2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <linearGradient id="gloss" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#${id})"/>`;
const table = (c, y = 560) => `<path d="M0 ${y} Q400 ${y - 40} 800 ${y} V800 H0Z" fill="${c}"/>`;
const shadow = (cx, cy, rx, ry, o = .28) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#3a1e0c" opacity="${o}" filter="url(#soft)"/>`;
const leaf = (x, y, r, s = 1, c = '#5c8a3a') => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0 C30 -40 90 -40 120 0 C90 40 30 40 0 0Z" fill="${c}"/><path d="M0 0 L118 0" stroke="#3f6627" stroke-width="3"/></g>`;
const chili = (x, y, r, s = 1) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0 C40 -10 120 0 170 40 C120 30 50 30 0 22Z" fill="#c8241b"/><path d="M10 4 C50 0 110 10 150 34" stroke="#ff7a5c" stroke-width="5" fill="none" opacity=".6" stroke-linecap="round"/><path d="M0 10 C-14 6 -24 -6 -30 -20" stroke="#3f6627" stroke-width="9" fill="none" stroke-linecap="round"/></g>`;

function chips(cx, cy, n, seed, spread = 150) {
  let s = seed, out = '';
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * spread;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.45 - rnd() * 40;
    const r = rnd() * 180, rx = 38 + rnd() * 18, ry = 26 + rnd() * 10;
    out += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(1)})">
      <ellipse rx="${rx}" ry="${ry}" fill="#e8a33d"/><ellipse rx="${rx - 5}" ry="${ry - 5}" fill="#f2b84f"/>
      <ellipse rx="${rx - 8}" ry="${ry - 9}" fill="#d9542a" opacity=".55"/>
      <circle cx="${-rx / 3}" cy="-4" r="3" fill="#a3260f"/><circle cx="${rx / 4}" cy="5" r="2.5" fill="#a3260f"/><circle cx="4" cy="-8" r="2" fill="#7a2008"/></g>`;
  }
  return out;
}

const keripik = (v) => v === 1 ? `${bg('#fff1e2', '#f3c9a1')}${table('#e7b384')}${shadow(400, 600, 260, 40)}
  <ellipse cx="400" cy="520" rx="270" ry="80" fill="#8a4b22"/><path d="M130 520 Q140 640 400 650 Q660 640 670 520Z" fill="#a85f2e"/>
  <path d="M150 560 Q400 600 650 560" stroke="#c77a42" stroke-width="6" fill="none"/>
  <ellipse cx="400" cy="520" rx="250" ry="66" fill="#5c2f12"/>
  ${chips(400, 505, 26, 7, 200)}${chips(400, 470, 14, 3, 120)}
  ${chili(560, 690, -10, .9)}${leaf(110, 690, -20, .8)}`
  : `${bg('#fde7d6', '#e98f62', 'bg2')}${table('#c96a43', 600)}${shadow(400, 650, 220, 30)}
  <g transform="translate(250 180)"><path d="M0 40 L300 40 L310 470 L-10 470Z" fill="#f6eadb"/><path d="M0 40 L300 40 L300 0 L0 0Z" fill="#e5d3bd"/>
  <rect x="20" y="110" width="260" height="230" rx="18" fill="#c8241b"/><text x="150" y="190" text-anchor="middle" font-family="Georgia,serif" font-size="46" font-weight="700" fill="#fff4e6">KERIPIK</text>
  <text x="150" y="240" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#ffd27a" letter-spacing="4">SINGKONG</text>
  <text x="150" y="300" text-anchor="middle" font-family="Verdana" font-size="26" font-weight="700" fill="#fff">BALADO 🌶</text>
  <rect x="0" y="40" width="300" height="430" fill="url(#gloss)" opacity=".7"/><text x="150" y="420" text-anchor="middle" font-family="Verdana" font-size="20" fill="#7a4a2a">200 gram</text></g>
  ${chips(190, 640, 6, 11, 70)}${chips(620, 650, 6, 5, 70)}`;

const rendang = (v) => {
  const chunks = (cx, cy, n, seed, sp) => { let s = seed, o = ''; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < n; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * sp; const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * .45;
      o += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(r() * 90).toFixed(0)})"><path d="M-34 -14 Q-20 -34 14 -28 Q40 -16 34 10 Q20 32 -14 28 Q-42 14 -34 -14Z" fill="#4a210e"/><path d="M-24 -12 Q-8 -26 14 -18" stroke="#8a4a24" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="6" cy="6" r="4" fill="#6b3216"/></g>`; }
    return o; };
  return v === 1 ? `${bg('#fff4e4', '#e9c28f')}${table('#d9a46a')}${shadow(400, 615, 280, 40)}
  <ellipse cx="400" cy="540" rx="280" ry="88" fill="#ffffff"/><path d="M120 540 Q130 640 400 652 Q670 640 680 540Z" fill="#f1ede6"/>
  <path d="M120 540 Q130 640 400 652 Q670 640 680 540" stroke="#1d4f8a" stroke-width="10" fill="none" opacity=".75"/>
  <ellipse cx="400" cy="540" rx="250" ry="70" fill="#6b3216"/><ellipse cx="400" cy="540" rx="235" ry="62" fill="#7d3b18"/>
  ${chunks(400, 530, 16, 4, 190)}${chunks(400, 505, 6, 9, 90)}
  ${leaf(520, 470, -30, .7)}${leaf(300, 470, 200, .6, '#6f9a45')}
  <g transform="translate(600 650) rotate(-8)"><rect width="150" height="22" rx="11" fill="#c9a26a"/></g>`
  : `${bg('#f7e3c5', '#b8763c', 'bg2')}${table('#8f5527', 610)}${shadow(400, 660, 230, 30)}
  <g transform="translate(240 150)"><path d="M20 0 L300 0 Q320 0 320 20 L330 500 L-10 500 L0 20 Q0 0 20 0Z" fill="#2b1a10"/>
  <rect x="0" y="0" width="320" height="40" fill="#1b0f08"/><rect x="40" y="90" width="240" height="300" rx="20" fill="#f4e4c8"/>
  <text x="160" y="160" text-anchor="middle" font-family="Georgia,serif" font-size="24" fill="#8a3b12" letter-spacing="6">ASLI PADANG</text>
  <text x="160" y="225" text-anchor="middle" font-family="Georgia,serif" font-size="58" font-weight="700" fill="#4a210e">Rendang</text>
  <text x="160" y="270" text-anchor="middle" font-family="Georgia,serif" font-size="26" fill="#4a210e">Daging Sapi</text>
  <path d="M80 300 H240" stroke="#c8241b" stroke-width="3"/><text x="160" y="350" text-anchor="middle" font-family="Verdana" font-size="20" fill="#6b3216">250 g · tanpa pengawet</text>
  <rect x="0" y="0" width="320" height="500" fill="url(#gloss)" opacity=".35"/></g>
  ${chunks(170, 650, 3, 3, 40)}${chunks(640, 660, 3, 8, 40)}`;
};

const sambal = (v) => {
  const jar = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-120" y="-40" width="240" height="70" rx="14" fill="#c8241b"/><rect x="-120" y="-40" width="240" height="18" rx="9" fill="#e5463a"/>
    <path d="M-130 30 H130 Q150 30 150 60 V320 Q150 360 110 360 H-110 Q-150 360 -150 320 V60 Q-150 30 -130 30Z" fill="#b31d12"/>
    <path d="M-130 70 H130 V320 Q130 340 110 340 H-110 Q-130 340 -130 320Z" fill="#9c150b"/>
    ${Array.from({ length: 24 }, (_, i) => `<circle cx="${-110 + (i * 53) % 220}" cy="${90 + (i * 37) % 240}" r="${4 + (i % 3) * 2}" fill="${i % 2 ? '#f0a33a' : '#e65d3a'}" opacity=".85"/>`).join('')}
    <rect x="-110" y="140" width="220" height="130" rx="10" fill="#fff7ea"/>
    <text x="0" y="195" text-anchor="middle" font-family="Georgia,serif" font-size="40" font-weight="700" fill="#b31d12">Sambal</text>
    <text x="0" y="240" text-anchor="middle" font-family="Georgia,serif" font-size="32" fill="#5c2f12">Bawang</text>
    <rect x="-150" y="40" width="300" height="320" fill="url(#gloss)" opacity=".5"/></g>`;
  return v === 1 ? `${bg('#fff3ea', '#f2b9a0')}${table('#e39a7c')}${shadow(400, 640, 220, 34)}${jar(400, 260, 1.05)}
  ${chili(80, 640, -15, 1)}${chili(560, 690, 10, .8)}
  <g transform="translate(610 600)"><ellipse rx="60" ry="50" fill="#e9d3e6"/><ellipse rx="40" ry="34" fill="#f6eaf4"/><path d="M0 -50 Q10 -80 0 -100" stroke="#6f9a45" stroke-width="7" fill="none"/></g>`
  : `${bg('#fff7ef', '#f4c27a', 'bg2')}${table('#d99a4e', 620)}${shadow(400, 660, 300, 34)}
  <ellipse cx="400" cy="600" rx="260" ry="70" fill="#fff"/><ellipse cx="400" cy="592" rx="230" ry="56" fill="#f1ede6"/>
  <ellipse cx="320" cy="585" rx="80" ry="34" fill="#f7f1e6"/><path d="M250 585 Q320 540 390 585" fill="#f0e2c4"/>
  <ellipse cx="480" cy="580" rx="90" ry="38" fill="#a8190e"/>${Array.from({ length: 10 }, (_, i) => `<circle cx="${420 + i * 13}" cy="${570 + (i % 3) * 8}" r="4" fill="#f0a33a"/>`).join('')}
  ${jar(400, 240, .75)}${chili(520, 450, 20, .7)}`;
};

const kopi = (v) => {
  const beans = (cx, cy, n, seed, sp) => { let s = seed, o = ''; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < n; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * sp; const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * .4;
      o += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(r() * 180).toFixed(0)})"><ellipse rx="20" ry="14" fill="#3b1f10"/><path d="M-16 0 Q0 -6 16 0" stroke="#1a0c05" stroke-width="3" fill="none"/></g>`; }
    return o; };
  const bag = `<g transform="translate(150 140)"><path d="M0 30 L260 30 L280 480 L-20 480Z" fill="#c9a77a"/><path d="M0 30 L30 0 H230 L260 30Z" fill="#b48f60"/>
    <rect x="-20" y="440" width="300" height="40" fill="#b48f60"/>
    <rect x="30" y="140" width="200" height="200" rx="100" fill="#2b1a10"/><text x="130" y="225" text-anchor="middle" font-family="Georgia,serif" font-size="34" fill="#e8c28a">KOPI</text>
    <text x="130" y="272" text-anchor="middle" font-family="Georgia,serif" font-size="44" font-weight="700" fill="#fff4e0">GAYO</text>
    <text x="130" y="380" text-anchor="middle" font-family="Verdana" font-size="18" fill="#5c3a1c">ARABIKA · 200 g</text>
    <rect x="-20" y="30" width="300" height="450" fill="url(#gloss)" opacity=".3"/></g>`;
  const cup = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="130" rx="150" ry="34" fill="#f6efe6"/><ellipse cx="0" cy="126" rx="120" ry="22" fill="#e6dccf"/>
    <path d="M-100 0 Q-100 140 0 140 Q100 140 100 0Z" fill="#fffaf3"/><path d="M96 30 Q150 30 140 70 Q132 100 90 96" stroke="#fffaf3" stroke-width="18" fill="none"/>
    <ellipse cx="0" cy="0" rx="100" ry="26" fill="#f1e7da"/><ellipse cx="0" cy="2" rx="88" ry="20" fill="#5a2d12"/><ellipse cx="-10" cy="0" rx="40" ry="8" fill="#b9773e" opacity=".7"/>
    <path d="M-30 -30 Q-50 -70 -20 -100 M20 -30 Q0 -80 30 -120" stroke="#fff" stroke-width="8" fill="none" opacity=".55" stroke-linecap="round"/></g>`;
  return v === 1 ? `${bg('#f7ecdf', '#c49a6c')}${table('#9b6b42')}${shadow(330, 640, 200, 30)}${shadow(580, 650, 150, 26)}${bag}${cup(580, 500, 1)}${beans(400, 690, 14, 3, 260)}`
    : `${bg('#efe2d0', '#5f3b22', 'bg2')}${table('#3f2616', 590)}${shadow(400, 640, 260, 34)}
    <ellipse cx="400" cy="580" rx="300" ry="90" fill="#7a5233"/><ellipse cx="400" cy="572" rx="280" ry="76" fill="#8f6440"/>
    ${beans(400, 560, 60, 13, 250)}${cup(400, 330, 1.25)}`;
};

const rosella = (v) => {
  const flower = (x, y, r, s) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">
    ${[0, 72, 144, 216, 288].map(a => `<path transform="rotate(${a})" d="M0 0 C-22 -30 -18 -70 0 -86 C18 -70 22 -30 0 0Z" fill="#9e1236"/><path transform="rotate(${a})" d="M0 -10 C-8 -30 -6 -60 0 -74" stroke="#d93b63" stroke-width="4" fill="none"/>`).join('')}
    <circle r="22" fill="#6e0b24"/></g>`;
  const teacup = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="120" rx="170" ry="38" fill="#ffffff"/><ellipse cx="0" cy="116" rx="130" ry="24" fill="#f0e8ea"/>
    <path d="M-130 0 Q-120 130 0 130 Q120 130 130 0Z" fill="rgba(255,255,255,.55)" stroke="#fff" stroke-width="4"/>
    <path d="M-124 20 Q-112 124 0 124 Q112 124 124 20Z" fill="#b5133a" opacity=".9"/><ellipse cx="0" cy="18" rx="124" ry="24" fill="#d2224f"/><ellipse cx="-30" cy="14" rx="50" ry="8" fill="#ff8aa6" opacity=".5"/>
    <ellipse cx="0" cy="0" rx="130" ry="28" fill="none" stroke="#fff" stroke-width="5"/><path d="M126 30 Q190 30 180 74 Q170 106 116 100" stroke="#fff" stroke-width="14" fill="none" opacity=".85"/></g>`;
  return v === 1 ? `${bg('#fff0f2', '#efb3bf')}${table('#de8fa0')}${shadow(380, 650, 230, 30)}${teacup(380, 480, 1.05)}
    ${flower(640, 640, 20, .9)}${flower(130, 660, -30, .75)}${flower(700, 470, 50, .55)}${leaf(560, 700, -10, .7)}${leaf(60, 560, 30, .6)}`
    : `${bg('#fff6f3', '#d97a8e', 'bg2')}${table('#b85a6e', 600)}${shadow(400, 650, 260, 34)}
    <ellipse cx="400" cy="590" rx="270" ry="80" fill="#f4ead8"/><ellipse cx="400" cy="584" rx="246" ry="64" fill="#e6d6b8"/>
    ${[[290, 560, 10], [380, 600, 80], [480, 560, 150], [340, 520, 200], [460, 610, 260], [540, 590, 40], [250, 600, 120], [420, 540, 300]].map(([x, y, r]) => flower(x, y, r, .55)).join('')}
    ${leaf(560, 420, -40, .9)}${leaf(140, 430, 210, .8)}
    <text x="400" y="230" text-anchor="middle" font-family="Georgia,serif" font-size="64" font-style="italic" fill="#7a0f2c" opacity=".9">Rosella</text>`;
};

const tas = (v) => {
  const weave = (w, h) => { let o = ''; for (let y = 0; y < h; y += 26) for (let x = 0; x < w; x += 26) {
      const k = ((x + y) / 26) % 2; o += `<rect x="${x}" y="${y}" width="26" height="26" fill="${k ? '#d8b56e' : '#c79f55'}"/><path d="M${x} ${y + (k ? 6 : 20)} H${x + 26}" stroke="#a9833f" stroke-width="2" opacity=".6"/>`; }
    return o; };
  const bag = (x, y, s, band) => `<g transform="translate(${x} ${y}) scale(${s})"><defs><clipPath id="bagc${band}"><path d="M-170 0 H170 L200 320 Q200 340 180 340 H-180 Q-200 340 -200 320Z"/></clipPath></defs>
    <path d="M-100 0 Q-100 -170 0 -170 Q100 -170 100 0" stroke="#7a4a1e" stroke-width="22" fill="none"/>
    <path d="M-100 0 Q-100 -170 0 -170 Q100 -170 100 0" stroke="#a36a30" stroke-width="10" fill="none"/>
    <g clip-path="url(#bagc${band})"><g transform="translate(-200 0)">${weave(400, 340)}</g>
    <rect x="-200" y="120" width="400" height="56" fill="${band}"/><path d="M-200 130 H200 M-200 166 H200" stroke="#fff4dc" stroke-width="3" stroke-dasharray="10 8"/>
    <rect x="-200" y="0" width="400" height="340" fill="url(#gloss)" opacity=".25"/></g>
    <path d="M-170 0 H170" stroke="#9c7434" stroke-width="10"/></g>`;
  return v === 1 ? `${bg('#f3f6ea', '#c9d6a9')}${table('#aebc86')}${shadow(400, 650, 240, 32)}${bag(400, 300, 1, '#2f6b4f')}${leaf(80, 640, -20, .9)}${leaf(640, 690, 200, .8)}`
    : `${bg('#fdf3e3', '#e4b98a', 'bg2')}${table('#c99863', 610)}${shadow(300, 660, 170, 26)}${shadow(560, 660, 150, 24)}${bag(300, 380, .78, '#b4541a')}${bag(560, 410, .65, '#2f6b4f')}`;
};

const batik = (v) => {
  const parang = (w, h, c1, c2) => { let o = `<rect width="${w}" height="${h}" fill="${c1}"/>`;
    for (let i = -h; i < w + h; i += 70) {
      o += `<path d="M${i} ${h} L${i + h} 0" stroke="${c2}" stroke-width="26"/>`;
      for (let k = 0; k < h; k += 60) { const x = i + k, y = h - k; o += `<path d="M${x - 10} ${y - 18} q 22 -30 44 -6 q -20 6 -16 26" fill="#f3e2bf" opacity=".9"/><circle cx="${x + 30}" cy="${y - 34}" r="5" fill="#f3e2bf"/>`; }
    } return o; };
  return v === 1 ? `${bg('#f6efe6', '#cbb08b')}${table('#a9875c')}${shadow(400, 640, 300, 36)}
    <defs><clipPath id="f1"><path d="M110 360 L690 300 L700 600 L100 620Z"/></clipPath><clipPath id="f2"><path d="M140 250 L660 200 L690 300 L110 360Z"/></clipPath></defs>
    <g clip-path="url(#f1)">${parang(800, 800, '#4a2b16', '#7d4a22')}<rect width="800" height="800" fill="#000" opacity=".1"/></g>
    <g clip-path="url(#f2)">${parang(800, 800, '#5a341a', '#8f5a2a')}</g>
    <path d="M110 360 L690 300" stroke="#2b190d" stroke-width="4"/><path d="M100 620 L700 600" stroke="#f3e2bf" stroke-width="6" stroke-dasharray="14 10"/>
    <g transform="translate(600 210) rotate(8)"><rect width="110" height="70" rx="6" fill="#fff8ec"/><text x="55" y="32" text-anchor="middle" font-family="Georgia" font-size="18" fill="#5a341a">Batik</text><text x="55" y="54" text-anchor="middle" font-family="Georgia" font-size="16" fill="#5a341a">Tulis</text></g>`
    : `${bg('#efe6d8', '#8f6a45', 'bg2')}<g transform="rotate(-8 400 400)"><g transform="translate(-100 -100)">${parang(1000, 1000, '#3f2412', '#7d4a22')}</g></g>
    <rect width="800" height="800" fill="url(#bg2)" opacity=".15"/>
    <circle cx="400" cy="400" r="190" fill="#fff8ec" opacity=".92"/><text x="400" y="380" text-anchor="middle" font-family="Georgia,serif" font-size="40" fill="#5a341a">Motif</text>
    <text x="400" y="440" text-anchor="middle" font-family="Georgia,serif" font-size="66" font-weight="700" fill="#3f2412">Parang</text>`;
};

const ART = {
  'keripik-singkong-balado': keripik, 'rendang-daging-kemasan': rendang, 'sambal-bawang-botol': sambal,
  'kopi-gayo-bubuk': kopi, 'teh-rosella-kering': rosella, 'tas-anyaman-pandan': tas, 'batik-tulis-motif-parang': batik,
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
  for (const [slug, fn] of Object.entries(ART)) for (const v of [1, 2]) {
    await page.setContent(`<html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">${fn(v)}</svg></body></html>`);
    await page.screenshot({ path: `${OUT}/${slug}-${v}.png` });
  }
  await browser.close();
})();
