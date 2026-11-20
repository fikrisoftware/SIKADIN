import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import sharp from 'sharp';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const ROOT = process.cwd();
const TMP_DIR = path.join(ROOT, '.tmp_video');
const OUT_MP4 = path.join(ROOT, 'public/downloads/Video_Promosi_KADIN_DIGI.mp4');
const POSTER_IMG = path.join(ROOT, 'public/assets/aistudio/image_0a4c7de4.png');
const LOGO_IMG = path.join(ROOT, 'public/images/si-kadi-logo.jpg');
const PROD_KOPI = path.join(ROOT, 'public/images/prod-kopi-susu.jpg');
const PROD_BATIK = path.join(ROOT, 'public/images/prod-batik-scarf.jpg');
const PROD_TEMPE = path.join(ROOT, 'public/images/prod-keripik-tempe.jpg');

fs.mkdirSync(TMP_DIR, { recursive: true });
fs.mkdirSync(path.dirname(OUT_MP4), { recursive: true });

const W = 1920;
const H = 1080;
const FPS = 24;
const LEAD_PAD = 0.45;
const TAIL_PAD = 0.65;
const FADE_SEC = 0.45;
const FADE_FRAMES = Math.round(FADE_SEC * FPS);

// Narration script spoken by Si KADI for KADIN Indonesia
const SCENE_SCRIPTS = [
  {
    id: 'scene1',
    mode: 'hero-right',
    narration:
      'Halo Bapak dan Ibu pimpinan KADIN Indonesia! Perkenalkan, saya Si KADI, Robot Sahabat UMKM dari KADIN DIGI. Bersama kita wujudkan UMKM Naik Kelas, Bisnis Makin Cuan!',
    subtitles: [
      'Halo Bapak & Ibu pimpinan KADIN Indonesia!',
      'Saya Si KADI, Robot Sahabat UMKM dari KADIN DIGI.',
      'Bersama kita wujudkan UMKM Naik Kelas, Bisnis Makin Cuan!',
    ],
  },
  {
    id: 'scene2',
    mode: 'dock',
    narration:
      'Lebih dari enam puluh lima juta pelaku UMKM menjadi tulang punggung ekonomi Indonesia. Namun pencatatan manual dan stok tak terpantau masih menjadi kendala. KADIN DIGI hadir sebagai solusi digital terpadu.',
    subtitles: [
      'Lebih dari 65 juta UMKM adalah tulang punggung ekonomi Indonesia.',
      'Pencatatan manual dan stok tak terpantau kini dapat diatasi.',
      'KADIN DIGI hadir sebagai solusi operasional digital terpadu.',
    ],
  },
  {
    id: 'scene3',
    mode: 'dock',
    narration:
      'Pertama, Sistem Kasir dan Inventori. Transaksi QRIS, tunai, maupun transfer selesai dalam hitungan detik, stok terpotong otomatis real-time, lengkap dengan struk digital siap kirim ke WhatsApp.',
    subtitles: [
      'Pilar 1: Sistem Kasir & Inventori multi-pembayaran serba cepat.',
      'Stok terpotong otomatis real-time anti-selisih setiap transaksi.',
      'Struk digital rapi siap cetak atau kirim langsung via WhatsApp.',
    ],
  },
  {
    id: 'scene4',
    mode: 'dock',
    narration:
      'Kedua, Database Pelanggan cerdas. Setiap transaksi otomatis menambah poin loyalitas dan mengelompokkan pelanggan ke segmen Reguler, Setia, VIP, hingga Reseller dengan privasi data terjamin.',
    subtitles: [
      'Pilar 2: Database Pelanggan CRM terintegrasi langsung ke kasir.',
      'Poin loyalitas otomatis dan segmentasi Reguler, Setia, VIP & Reseller.',
      'Privasi kontak pelanggan terlindungi penuh dengan isolasi Zero-Trust.',
    ],
  },
  {
    id: 'scene5',
    mode: 'dock',
    narration:
      'Ketiga, Pemasaran Digital. Pelaku usaha dapat membuat kode voucher promo yang langsung aktif di kasir, serta mengirim broadcast promosi personal untuk meningkatkan transaksi berulang.',
    subtitles: [
      'Pilar 3: Pemasaran Digital dengan kode voucher terintegrasi kasir.',
      'Kirim broadcast WhatsApp personal & salin caption media sosial.',
      'Dorong repeat order dan ukur efektivitas promo secara akurat.',
    ],
  },
  {
    id: 'scene6',
    mode: 'dock',
    narration:
      'Keempat, Analisis Penjualan dan Kinerja. Pantau omzet, laba kotor berbasis HPP, dan ekspor laporan pembukuan satu klik, didukung keamanan Zero-Trust untuk membantu UMKM siap mengakses pembiayaan.',
    subtitles: [
      'Pilar 4: Analisis omzet, laba kotor HPP, dan produk terlaris.',
      'Ekspor laporan CSV 1-klik untuk pembukuan rapi siap akses KUR.',
      'Didukung Cloud Firestore real-time & keamanan Zero-Trust.',
    ],
  },
  {
    id: 'scene7',
    mode: 'hero-center',
    narration:
      'Mari bersinergi bersama Kamar Dagang dan Industri Indonesia, mempercepat transformasi digital UMKM di seluruh nusantara. KADIN DIGI: UMKM Naik Kelas, Bisnis Makin Cuan!',
    subtitles: [
      'Mari bersinergi bersama Kamar Dagang dan Industri Indonesia.',
      'Mempercepat transformasi digital UMKM di seluruh nusantara.',
      'KADIN DIGI — UMKM Naik Kelas, Bisnis Makin Cuan!',
    ],
  },
];

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// === 1. Synthesize Natural Indonesian Voiceover (Microsoft Neural TTS + Google TTS fallback) ===
async function synthesizeSpeechMp3(text, outMp3Path) {
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata('id-ID-ArdiNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text);
    const chunks = [];
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Edge TTS timeout')), 15000);
      audioStream.on('data', (c) => chunks.push(c));
      audioStream.on('end', () => {
        clearTimeout(timer);
        resolve();
      });
      audioStream.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
    tts.close();
    const buf = Buffer.concat(chunks);
    if (buf.length < 2000) throw new Error('Edge TTS buffer too small');
    fs.writeFileSync(outMp3Path, buf);
    return 'edge-neural';
  } catch (err) {
    console.warn(`Edge Neural TTS fallback triggered (${err.message}), using Google Indonesian TTS...`);
    // Split into <= 180-char clauses for Google TTS
    const clauses = text
      .split(/(?<=[.!?])\s+/)
      .flatMap((s) => (s.length <= 180 ? [s] : s.split(/,\s+/)))
      .filter(Boolean);
    const partFiles = [];
    for (let i = 0; i < clauses.length; i++) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        clauses[i]
      )}&tl=id&client=tw-ob`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`Fallback TTS failed: ${res.status}`);
      const partPath = `${outMp3Path}.part${i}.mp3`;
      fs.writeFileSync(partPath, Buffer.from(await res.arrayBuffer()));
      partFiles.push(partPath);
    }
    const listFile = `${outMp3Path}.list.txt`;
    fs.writeFileSync(listFile, partFiles.map((p) => `file '${p}'`).join('\n'));
    execFileSync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', outMp3Path], {
      stdio: 'ignore',
    });
    for (const p of partFiles) fs.rmSync(p, { force: true });
    fs.rmSync(listFile, { force: true });
    return 'google-tts';
  }
}

function getAudioDuration(filePath) {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath],
    { encoding: 'utf8' }
  ).trim();
  return parseFloat(out);
}

// Convert voice MP3 to padded 24kHz mono 16-bit PCM WAV + extract per-frame RMS amplitude envelope
function prepareSceneVoice(mp3Path, wavPath, leadPadSec, tailPadSec) {
  // Subtle crisp upbeat speed (1.05x) + studio clarity EQ + padding
  const leadMs = Math.round(leadPadSec * 1000);
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-i',
      mp3Path,
      '-af',
      `atempo=1.05,highpass=f=85,equalizer=f=3000:t=q:w=1.2:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=5:release=60,adelay=${leadMs}|${leadMs},apad=pad_dur=${tailPadSec}`,
      '-ar',
      '24000',
      '-ac',
      '1',
      '-c:a',
      'pcm_s16le',
      wavPath,
    ],
    { stdio: 'ignore' }
  );

  const rawBuf = fs.readFileSync(wavPath);
  // Skip 44-byte standard WAV header (locate 'data' chunk safely)
  let dataOffset = 44;
  for (let i = 12; i < Math.min(rawBuf.length - 8, 256); i++) {
    if (
      rawBuf[i] === 0x64 &&
      rawBuf[i + 1] === 0x61 &&
      rawBuf[i + 2] === 0x74 &&
      rawBuf[i + 3] === 0x61
    ) {
      dataOffset = i + 8;
      break;
    }
  }

  const sampleRate = 24000;
  const totalSamples = Math.floor((rawBuf.length - dataOffset) / 2);
  const duration = totalSamples / sampleRate;
  const totalFrames = Math.max(24, Math.round(duration * FPS));
  const samplesPerFrame = sampleRate / FPS;

  const rmsList = new Float32Array(totalFrames);
  let maxRms = 0.001;
  for (let f = 0; f < totalFrames; f++) {
    const startSample = Math.floor(f * samplesPerFrame);
    const endSample = Math.min(totalSamples, Math.floor((f + 1) * samplesPerFrame));
    let sumSq = 0;
    let count = 0;
    for (let s = startSample; s < endSample; s++) {
      const val = rawBuf.readInt16LE(dataOffset + s * 2) / 32768;
      sumSq += val * val;
      count++;
    }
    const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
    rmsList[f] = rms;
    if (rms > maxRms) maxRms = rms;
  }

  // Normalize to 0..1 with slight smoothing so mouth motion looks organic
  const norm = new Float32Array(totalFrames);
  for (let f = 0; f < totalFrames; f++) {
    const prev = f > 0 ? rmsList[f - 1] : rmsList[f];
    const next = f + 1 < totalFrames ? rmsList[f + 1] : rmsList[f];
    const smoothed = prev * 0.2 + rmsList[f] * 0.6 + next * 0.2;
    norm[f] = Math.min(1, smoothed / (maxRms * 0.72));
  }

  return { duration: totalFrames / FPS, totalFrames, rms: norm };
}

// === 2. Warm Corporate Presentation Soundtrack (WAV) ===
function generateBackgroundAudio(outWavPath, totalSeconds) {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * totalSeconds);
  const buffer = Buffer.alloc(44 + numSamples * 4);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 4, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 4, 40);

  const chords = [
    [261.63, 329.63, 392.0, 493.88],
    [196.0, 293.66, 392.0, 440.0],
    [220.0, 261.63, 329.63, 392.0],
    [174.61, 261.63, 329.63, 349.23],
  ];
  const arpeggio = [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 783.99, 880.0];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.floor(t / 4) % chords.length;
    const chord = chords[chordIdx];
    const chordLocalT = t % 4;
    const chordEnv = Math.min(1, chordLocalT / 0.25) * Math.min(1, (4 - chordLocalT) / 0.35);

    let padL = 0;
    let padR = 0;
    for (let c = 0; c < chord.length; c++) {
      const f = chord[c];
      const v = Math.sin(2 * Math.PI * f * t) + 0.18 * Math.sin(2 * Math.PI * f * 2 * t);
      padL += v * (c % 2 === 0 ? 0.095 : 0.055);
      padR += v * (c % 2 === 1 ? 0.095 : 0.055);
    }

    const stepIdx = Math.floor(t * 2) % arpeggio.length;
    const stepT = (t * 2) % 1;
    const pluckEnv = Math.exp(-stepT * 5.8);
    const pluck = Math.sin(2 * Math.PI * arpeggio[stepIdx] * t) * pluckEnv * 0.085;

    const beatT = t % 0.5;
    const bass = Math.sin(2 * Math.PI * (chord[0] * 0.5) * t) * Math.exp(-beatT * 6.2) * 0.13;

    const fadeIn = Math.min(1, t / 1.4);
    const fadeOut = Math.min(1, Math.max(0, (totalSeconds - t) / 2.2));
    const master = fadeIn * fadeOut * 0.65;

    const sampleL = Math.max(-0.95, Math.min(0.95, (padL * chordEnv + pluck + bass) * master));
    const sampleR = Math.max(-0.95, Math.min(0.95, (padR * chordEnv + pluck * 0.85 + bass) * master));

    buffer.writeInt16LE(Math.round(sampleL * 32767), 44 + i * 4);
    buffer.writeInt16LE(Math.round(sampleR * 32767), 44 + i * 4 + 2);
  }
  fs.writeFileSync(outWavPath, buffer);
}

// === 3. Build Animated Talking Si KADI Mascot Sprites (5 Mouth States x 2 Eye Blink States) ===
// Measured coordinates on 1024x1024 public/images/si-kadi-logo.jpg:
// eyeL center=(438.5, 435), eyeR center=(587.5, 435), mouth center=(512.5, 496), visor color=#0A2237
async function createSiKadiSpriteSet(targetSize) {
  const sprites = []; // [blinkIdx 0..1][mouthIdx 0..4] => { data, width, height }
  const borderWidth = Math.max(6, Math.round(targetSize * 0.025));
  const r = targetSize / 2;

  const circleMaskSvg = Buffer.from(
    `<svg width="${targetSize}" height="${targetSize}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${r}" cy="${r}" r="${r - borderWidth - 2}" fill="#FFFFFF"/>
    </svg>`
  );

  const ringFrameSvg = Buffer.from(
    `<svg width="${targetSize}" height="${targetSize}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${r}" cy="${r}" r="${r - borderWidth / 2 - 2}" fill="none" stroke="#F97316" stroke-width="${borderWidth}"/>
      <circle cx="${r}" cy="${r}" r="${r - borderWidth - 4}" fill="none" stroke="#22D3EE" stroke-width="2.5" stroke-opacity="0.75"/>
    </svg>`
  );

  for (let blink = 0; blink <= 1; blink++) {
    const row = [];
    for (let mouth = 0; mouth <= 4; mouth++) {
      // Pure layered SVG LED shapes (no librsvg filter clipping) on 1024x1024 logo coordinates
      let mouthSvg = '';
      if (mouth === 0) {
        // Closed happy cyan LED smile
        mouthSvg = `
          <path d="M 476 489 Q 512.5 516 549 489" fill="none" stroke="#00D4FF" stroke-width="20" stroke-linecap="round" stroke-opacity="0.32"/>
          <path d="M 476 489 Q 512.5 516 549 489" fill="none" stroke="#3BF4FF" stroke-width="12" stroke-linecap="round"/>
          <path d="M 476 489 Q 512.5 516 549 489" fill="none" stroke="#D1FEFF" stroke-width="4.5" stroke-linecap="round"/>
        `;
      } else if (mouth === 1) {
        // Soft syllable — small open glowing cyan oval
        mouthSvg = `
          <ellipse cx="512.5" cy="498" rx="30" ry="15" fill="#00D4FF" fill-opacity="0.28"/>
          <ellipse cx="512.5" cy="498" rx="25" ry="12" fill="#063147" stroke="#3BF4FF" stroke-width="8"/>
          <ellipse cx="512.5" cy="498" rx="25" ry="12" fill="none" stroke="#C4FEFF" stroke-width="3"/>
        `;
      } else if (mouth === 2) {
        // Medium talking D-shape mouth
        mouthSvg = `
          <path d="M 468 483 Q 512.5 489 557 483 Q 553 526 512.5 528 Q 472 526 468 483 Z" fill="#00D4FF" fill-opacity="0.25"/>
          <path d="M 472 486 Q 512.5 491 553 486 Q 549 522 512.5 524 Q 476 522 472 486 Z" fill="#073248" stroke="#3BF4FF" stroke-width="8" stroke-linejoin="round"/>
          <path d="M 489 514 Q 512.5 504 536 514 Q 525 523 512.5 523 Q 500 523 489 514 Z" fill="#22D3EE" fill-opacity="0.88"/>
          <path d="M 472 486 Q 512.5 491 553 486 Q 549 522 512.5 524 Q 476 522 472 486 Z" fill="none" stroke="#D1FEFF" stroke-width="3" stroke-linejoin="round"/>
        `;
      } else if (mouth === 3) {
        // Wide expressive talking mouth (strong vowels)
        mouthSvg = `
          <path d="M 458 478 Q 512.5 485 567 478 Q 563 538 512.5 540 Q 462 538 458 478 Z" fill="#00D4FF" fill-opacity="0.28"/>
          <path d="M 463 482 Q 512.5 488 562 482 Q 558 533 512.5 535 Q 467 533 463 482 Z" fill="#062B40" stroke="#3BF4FF" stroke-width="9" stroke-linejoin="round"/>
          <path d="M 484 521 Q 512.5 507 541 521 Q 528 533 512.5 533 Q 497 533 484 521 Z" fill="#38BDF8" fill-opacity="0.92"/>
          <path d="M 477 492 Q 512.5 496 548 492" fill="none" stroke="#F0F9FF" stroke-width="6.5" stroke-linecap="round"/>
          <path d="M 463 482 Q 512.5 488 562 482 Q 558 533 512.5 535 Q 467 533 463 482 Z" fill="none" stroke="#D1FEFF" stroke-width="3.2" stroke-linejoin="round"/>
        `;
      } else {
        // Peak cheerful energetic open mouth
        mouthSvg = `
          <path d="M 452 474 Q 512.5 482 573 474 Q 569 548 512.5 550 Q 456 548 452 474 Z" fill="#00D4FF" fill-opacity="0.32"/>
          <path d="M 457 479 Q 512.5 486 568 479 Q 564 542 512.5 544 Q 461 542 457 479 Z" fill="#05273B" stroke="#3BF4FF" stroke-width="9.5" stroke-linejoin="round"/>
          <path d="M 480 526 Q 512.5 510 545 526 Q 530 541 512.5 541 Q 495 541 480 526 Z" fill="#22D3EE" fill-opacity="0.95"/>
          <path d="M 472 490 Q 512.5 495 553 490" fill="none" stroke="#FFFFFF" stroke-width="7.5" stroke-linecap="round"/>
          <path d="M 457 479 Q 512.5 486 568 479 Q 564 542 512.5 544 Q 461 542 457 479 Z" fill="none" stroke="#E0FEFF" stroke-width="3.5" stroke-linejoin="round"/>
        `;
      }

      const eyeBlinkSvg =
        blink === 1
          ? `
            <ellipse cx="438.5" cy="435" rx="38" ry="38" fill="#091E32"/>
            <ellipse cx="587.5" cy="435" rx="38" ry="38" fill="#091E32"/>
            <path d="M 410 439 Q 438.5 413 467 439" fill="none" stroke="#00D4FF" stroke-width="20" stroke-linecap="round" stroke-opacity="0.32"/>
            <path d="M 410 439 Q 438.5 413 467 439" fill="none" stroke="#3BF4FF" stroke-width="11" stroke-linecap="round"/>
            <path d="M 410 439 Q 438.5 413 467 439" fill="none" stroke="#D1FEFF" stroke-width="4" stroke-linecap="round"/>
            <path d="M 559 439 Q 587.5 413 616 439" fill="none" stroke="#00D4FF" stroke-width="20" stroke-linecap="round" stroke-opacity="0.32"/>
            <path d="M 559 439 Q 587.5 413 616 439" fill="none" stroke="#3BF4FF" stroke-width="11" stroke-linecap="round"/>
            <path d="M 559 439 Q 587.5 413 616 439" fill="none" stroke="#D1FEFF" stroke-width="4" stroke-linecap="round"/>
          `
          : '';

      const facePatchSvg = Buffer.from(
        `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="visorPatch" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stop-color="#0B273E" stop-opacity="1"/>
              <stop offset="78%" stop-color="#0A2338" stop-opacity="1"/>
              <stop offset="100%" stop-color="#0A2338" stop-opacity="0"/>
            </radialGradient>
          </defs>
          ${eyeBlinkSvg}
          <!-- Cleanly mask original static smile inside LED visor -->
          <ellipse cx="512.5" cy="500" rx="68" ry="32" fill="url(#visorPatch)"/>
          <ellipse cx="512.5" cy="498" rx="52" ry="24" fill="#0B273E"/>
          ${mouthSvg}
        </svg>`
      );

      // Step 1: Apply face animation on full 1024x1024 canvas FIRST
      const fullWithFace = await sharp(LOGO_IMG)
        .composite([{ input: facePatchSvg, top: 0, left: 0 }])
        .png()
        .toBuffer();

      // Step 2: Crop cleanly around robot character, resize, and apply circular presenter frame
      const croppedMasked = await sharp(fullWithFace)
        .extract({ left: 120, top: 96, width: 784, height: 784 })
        .resize(targetSize, targetSize, { fit: 'cover' })
        .ensureAlpha()
        .composite([{ input: circleMaskSvg, blend: 'dest-in' }])
        .png()
        .toBuffer();

      const { data, info } = await sharp(croppedMasked)
        .composite([{ input: ringFrameSvg, blend: 'over' }])
        .raw()
        .toBuffer({ resolveWithObject: true });

      row.push({ data, width: info.width, height: info.height });
    }
    sprites.push(row);
  }
  return sprites;
}

// === 4. Render Subtitle Speech Card Overlays (RGBA buffers) ===
async function renderSubtitleOverlay(text, mode) {
  const isHeroRight = mode === 'hero-right';
  const isHeroCenter = mode === 'hero-center';
  const boxW = isHeroCenter ? 1560 : isHeroRight ? 1320 : 1410;
  const boxH = 104;

  const svg = Buffer.from(
    `<svg width="${boxW}" height="${boxH}" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="${boxW - 4}" height="${boxH - 4}" rx="20" fill="#051633" fill-opacity="0.93" stroke="#F97316" stroke-width="3"/>
      <rect x="18" y="20" width="8" height="${boxH - 40}" rx="4" fill="#22D3EE"/>
      <text x="44" y="42" font-family="Noto Sans" font-size="18" font-weight="800" fill="#22D3EE" letter-spacing="2">SI KADI · NARASI RESMI KADIN DIGI</text>
      <text x="44" y="80" font-family="Noto Sans" font-size="28" font-weight="700" fill="#FFFFFF">${esc(text)}</text>
    </svg>`
  );

  const { data, info } = await sharp(svg).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

// === 5. Fast In-Memory RGB/RGBA Compositing Helpers ===
function alphaBlendRGBAOntoRGB(dstRGB, dstW, dstH, srcRGBA, srcW, srcH, dstX, dstY) {
  const xStart = Math.max(0, dstX);
  const yStart = Math.max(0, dstY);
  const xEnd = Math.min(dstW, dstX + srcW);
  const yEnd = Math.min(dstH, dstY + srcH);

  for (let y = yStart; y < yEnd; y++) {
    const sy = y - dstY;
    const dstRowOffset = y * dstW * 3;
    const srcRowOffset = sy * srcW * 4;
    for (let x = xStart; x < xEnd; x++) {
      const sx = x - dstX;
      const sIdx = srcRowOffset + sx * 4;
      const a = srcRGBA[sIdx + 3];
      if (a === 0) continue;
      const dIdx = dstRowOffset + x * 3;
      if (a === 255) {
        dstRGB[dIdx] = srcRGBA[sIdx];
        dstRGB[dIdx + 1] = srcRGBA[sIdx + 1];
        dstRGB[dIdx + 2] = srcRGBA[sIdx + 2];
      } else {
        const inv = 255 - a;
        dstRGB[dIdx] = (srcRGBA[sIdx] * a + dstRGB[dIdx] * inv) >> 8;
        dstRGB[dIdx + 1] = (srcRGBA[sIdx + 1] * a + dstRGB[dIdx + 1] * inv) >> 8;
        dstRGB[dIdx + 2] = (srcRGBA[sIdx + 2] * a + dstRGB[dIdx + 2] * inv) >> 8;
      }
    }
  }
}

function drawFilledRectAlpha(dstRGB, dstW, dstH, x0, y0, rw, rh, r, g, b, alpha) {
  const xStart = Math.max(0, Math.round(x0));
  const yStart = Math.max(0, Math.round(y0));
  const xEnd = Math.min(dstW, Math.round(x0 + rw));
  const yEnd = Math.min(dstH, Math.round(y0 + rh));
  const a = Math.round(alpha * 255);
  const inv = 255 - a;
  for (let y = yStart; y < yEnd; y++) {
    let idx = (y * dstW + xStart) * 3;
    for (let x = xStart; x < xEnd; x++) {
      dstRGB[idx] = (r * a + dstRGB[idx] * inv) >> 8;
      dstRGB[idx + 1] = (g * a + dstRGB[idx + 1] * inv) >> 8;
      dstRGB[idx + 2] = (b * a + dstRGB[idx + 2] * inv) >> 8;
      idx += 3;
    }
  }
}

function drawPulsingRing(dstRGB, dstW, dstH, cx, cy, radius, thickness, r, g, b, alpha) {
  if (alpha <= 0.02) return;
  const rInner = Math.max(1, radius - thickness);
  const rOuter = radius;
  const rInnerSq = rInner * rInner;
  const rOuterSq = rOuter * rOuter;
  const xStart = Math.max(0, Math.floor(cx - rOuter - 1));
  const xEnd = Math.min(dstW - 1, Math.ceil(cx + rOuter + 1));
  const yStart = Math.max(0, Math.floor(cy - rOuter - 1));
  const yEnd = Math.min(dstH - 1, Math.ceil(cy + rOuter + 1));

  for (let y = yStart; y <= yEnd; y++) {
    const dy = y - cy;
    const dySq = dy * dy;
    for (let x = xStart; x <= xEnd; x++) {
      const dx = x - cx;
      const distSq = dx * dx + dySq;
      if (distSq >= rInnerSq && distSq <= rOuterSq) {
        const dist = Math.sqrt(distSq);
        const mid = (rInner + rOuter) * 0.5;
        const falloff = 1 - Math.abs(dist - mid) / (thickness * 0.5 + 0.5);
        const a = Math.max(0, Math.min(255, Math.round(alpha * falloff * 255)));
        if (a === 0) continue;
        const inv = 255 - a;
        const idx = (y * dstW + x) * 3;
        dstRGB[idx] = (r * a + dstRGB[idx] * inv) >> 8;
        dstRGB[idx + 1] = (g * a + dstRGB[idx + 1] * inv) >> 8;
        dstRGB[idx + 2] = (b * a + dstRGB[idx + 2] * inv) >> 8;
      }
    }
  }
}

// Draw 9-bar animated voice equalizer synced to voice RMS
function drawVoiceEqualizer(dstRGB, centerX, baseY, rms, t) {
  const numBars = 9;
  const barW = 10;
  const gap = 7;
  const totalW = numBars * barW + (numBars - 1) * gap;
  const startX = Math.round(centerX - totalW / 2);

  // Dark pill container behind equalizer
  drawFilledRectAlpha(dstRGB, W, H, startX - 18, baseY - 38, totalW + 36, 48, 5, 22, 51, 0.88);

  const weights = [0.45, 0.72, 0.9, 1.0, 0.96, 1.0, 0.88, 0.7, 0.45];
  for (let i = 0; i < numBars; i++) {
    const wave = 0.5 + 0.5 * Math.sin(t * 14 + i * 1.15);
    const level = rms > 0.08 ? Math.min(1, rms * weights[i] * (0.55 + 0.65 * wave)) : 0.14;
    const bh = Math.max(6, Math.round(level * 30));
    const bx = startX + i * (barW + gap);
    const by = baseY - 14 - Math.round(bh / 2);
    // Alternate vibrant orange & cyan LED bars
    const isOrange = i % 2 === 1;
    drawFilledRectAlpha(
      dstRGB,
      W,
      H,
      bx,
      by,
      barW,
      bh,
      isOrange ? 249 : 34,
      isOrange ? 115 : 211,
      isOrange ? 22 : 238,
      0.96
    );
  }
}

// === 6. Render Static High-Contrast Background Plates (Layout Optimized for Talking Si KADI Dock) ===
async function prepRoundedImage(srcPath, sizeW, sizeH, radius = 24) {
  const mask = Buffer.from(
    `<svg width="${sizeW}" height="${sizeH}"><rect x="0" y="0" width="${sizeW}" height="${sizeH}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`
  );
  return sharp(srcPath)
    .resize(sizeW, sizeH, { fit: 'cover' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function renderSceneRGB(svgMarkup, overlays = []) {
  const base = sharp(Buffer.from(svgMarkup)).resize(W, H);
  if (overlays.length > 0) base.composite(overlays);
  return base.removeAlpha().raw().toBuffer();
}

async function buildScenePlates() {
  const posterSmall = await prepRoundedImage(POSTER_IMG, 360, 360, 24);
  const logoSmall = await prepRoundedImage(LOGO_IMG, 72, 72, 16);
  const kopiBuf = await prepRoundedImage(PROD_KOPI, 210, 210, 20);
  const batikBuf = await prepRoundedImage(PROD_BATIK, 210, 210, 20);
  const tempeBuf = await prepRoundedImage(PROD_TEMPE, 210, 210, 20);

  const plates = [];

  // SCENE 1: OPENING BRAND REVEAL — Left Copy + Right Large Animated Talking Si KADI Stage
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g1" cx="76%" cy="46%" r="58%">
            <stop offset="0%" stop-color="#144691" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#051633" stop-opacity="1"/>
          </radialGradient>
        </defs>
        <rect width="${W}" height="${H}" fill="#051633"/>
        <rect width="${W}" height="${H}" fill="url(#g1)"/>
        <rect x="0" y="0" width="20" height="${H}" fill="#F97316"/>

        <text x="100" y="160" font-family="Noto Sans" font-size="24" font-weight="700" fill="#22D3EE" letter-spacing="4">MEMPERSEMBAHKAN UNTUK KADIN INDONESIA</text>
        <text x="100" y="295" font-family="Noto Sans" font-size="124" font-weight="800" fill="#FFFFFF">KADIN <tspan fill="#F97316">DIGI</tspan></text>
        <text x="100" y="375" font-family="Noto Sans" font-size="40" font-weight="700" fill="#DBEAFE">Si KADI — Robot Sahabat UMKM</text>
        <text x="100" y="452" font-family="Noto Sans" font-size="28" fill="#CBD5E1">Platform Kasir Digital, Inventori, Database Pelanggan,</text>
        <text x="100" y="494" font-family="Noto Sans" font-size="28" fill="#CBD5E1">Pemasaran Digital &amp; Analisis Kinerja Bisnis UMKM.</text>

        <rect x="100" y="555" width="760" height="86" rx="18" fill="#08234D" stroke="#F97316" stroke-width="3"/>
        <text x="138" y="610" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FFFFFF">UMKM Naik Kelas  <tspan fill="#64748B">|</tspan>  <tspan fill="#FB923C">Bisnis Makin Cuan</tspan></text>

        <!-- Poster Preview Card Bottom-Left Above Subtitle -->
        <rect x="920" y="510" width="380" height="380" rx="28" fill="#08234D" stroke="#1E3A8A" stroke-width="2"/>

        <!-- Right Hero Stage Panel for Animated Talking Si KADI -->
        <rect x="1340" y="120" width="490" height="770" rx="36" fill="#08234D" fill-opacity="0.88" stroke="#1E40AF" stroke-width="3"/>
        <text x="1585" y="185" text-anchor="middle" font-family="Noto Sans" font-size="22" font-weight="800" fill="#22D3EE" letter-spacing="3">PRESENTER DIGITAL</text>
        <text x="1585" y="750" text-anchor="middle" font-family="Noto Sans" font-size="40" font-weight="800" fill="#FFFFFF">Si KADI</text>
        <text x="1585" y="792" text-anchor="middle" font-family="Noto Sans" font-size="22" font-weight="600" fill="#FB923C">Robot Sahabat UMKM</text>
      </svg>`,
      [{ input: posterSmall, left: 930, top: 520 }]
    )
  );

  // SCENE 2: LATAR BELAKANG STRATEGIS UMKM (Bottom-right cleared for Si KADI dock)
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#051633"/>
        <rect x="0" y="0" width="${W}" height="10" fill="#F97316"/>
        <text x="100" y="125" font-family="Noto Sans" font-size="22" font-weight="700" fill="#22D3EE" letter-spacing="3">LATAR BELAKANG STRATEGIS</text>
        <text x="100" y="205" font-family="Noto Sans" font-size="58" font-weight="800" fill="#FFFFFF">Saatnya UMKM Indonesia <tspan fill="#FB923C">Beralih ke Digital</tspan></text>

        <rect x="100" y="265" width="540" height="260" rx="22" fill="#08234D" stroke="#1E3A8A" stroke-width="2"/>
        <text x="145" y="375" font-family="JetBrains Mono" font-size="74" font-weight="700" fill="#F97316">65+ Jt</text>
        <text x="145" y="438" font-family="Noto Sans" font-size="28" font-weight="700" fill="#FFFFFF">Pelaku UMKM Nasional</text>
        <text x="145" y="480" font-family="Noto Sans" font-size="21" fill="#93C5FD">Warung, kedai, kriya &amp; fashion lokal</text>

        <rect x="680" y="265" width="540" height="260" rx="22" fill="#08234D" stroke="#1E3A8A" stroke-width="2"/>
        <text x="725" y="375" font-family="JetBrains Mono" font-size="74" font-weight="700" fill="#22D3EE">&gt; 60%</text>
        <text x="725" y="438" font-family="Noto Sans" font-size="28" font-weight="700" fill="#FFFFFF">Kontribusi PDB Nasional</text>
        <text x="725" y="480" font-family="Noto Sans" font-size="21" fill="#93C5FD">Penggerak utama ekonomi Indonesia</text>

        <rect x="1260" y="265" width="560" height="260" rx="22" fill="#08234D" stroke="#1E3A8A" stroke-width="2"/>
        <text x="1305" y="375" font-family="JetBrains Mono" font-size="74" font-weight="700" fill="#F97316">97%</text>
        <text x="1305" y="438" font-family="Noto Sans" font-size="28" font-weight="700" fill="#FFFFFF">Serapan Tenaga Kerja</text>
        <text x="1305" y="480" font-family="Noto Sans" font-size="21" fill="#93C5FD">Fondasi kesejahteraan masyarakat</text>

        <!-- Wide Callout Box stops at x=1510 so Si KADI Dock sits cleanly at right -->
        <rect x="100" y="575" width="1410" height="270" rx="22" fill="#0B2C5F" stroke="#F97316" stroke-width="2"/>
        <text x="148" y="655" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FB923C">Tantangan Nyata UMKM di Lapangan</text>
        <text x="148" y="715" font-family="Noto Sans" font-size="25" fill="#E2E8F0">• Pencatatan kasir masih manual, stok sering selisih, dan omzet sulit dilacak.</text>
        <text x="148" y="762" font-family="Noto Sans" font-size="25" fill="#E2E8F0">• Promosi belum terukur &amp; data pelanggan belum terkelola untuk repeat order.</text>
        <text x="148" y="810" font-family="Noto Sans" font-size="25" font-weight="700" fill="#22D3EE">→ KADIN DIGI menyatukan semuanya dalam satu platform cloud modern.</text>
      </svg>`
    )
  );

  // SCENE 3: PILAR 1 — KASIR POS & INVENTORY
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#F3F6FB"/>
        <rect width="${W}" height="104" fill="#051633"/>
        <text x="200" y="66" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FFFFFF">KADIN <tspan fill="#F97316">DIGI</tspan>   <tspan fill="#93C5FD" font-size="24" font-weight="500">|   PILAR 01 · SISTEM KASIR &amp; INVENTORI</tspan></text>

        <text x="100" y="196" font-family="Noto Sans" font-size="52" font-weight="800" fill="#08234D">Kasir Cepat, Stok Otomatis Akurat</text>
        <text x="100" y="246" font-family="Noto Sans" font-size="25" fill="#475569">Transaksi selesai dalam hitungan detik dengan pemotongan stok atomik dan struk digital.</text>

        <rect x="100" y="295" width="760" height="165" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="138" y="355" font-family="Noto Sans" font-size="28" font-weight="800" fill="#EA580C">01. Multi-Pembayaran &amp; Voucher Kasir</text>
        <text x="138" y="400" font-family="Noto Sans" font-size="22" fill="#475569">QRIS, Tunai (kalkulator kembalian otomatis), Transfer &amp; E-Wallet.</text>
        <text x="138" y="434" font-family="Noto Sans" font-size="20" fill="#64748B">Validasi diskon voucher instan langsung saat checkout.</text>

        <rect x="100" y="485" width="760" height="165" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="138" y="545" font-family="Noto Sans" font-size="28" font-weight="800" fill="#08234D">02. Struk Digital Cetak &amp; Kirim WhatsApp</text>
        <text x="138" y="590" font-family="Noto Sans" font-size="22" fill="#475569">Cetak struk rapi atau salin format teks untuk dikirim ke pelanggan.</text>
        <text x="138" y="624" font-family="Noto Sans" font-size="20" fill="#64748B">Dilengkapi riwayat transaksi dan fitur Void pengembalian stok.</text>

        <rect x="100" y="675" width="760" height="165" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="138" y="735" font-family="Noto Sans" font-size="28" font-weight="800" fill="#08234D">03. Peringatan Stok Menipis &amp; Audit Mutasi</text>
        <text x="138" y="780" font-family="Noto Sans" font-size="22" fill="#475569">Pantau HPP, margin laba, dan buku log mutasi stok anti-selisih.</text>
        <text x="138" y="814" font-family="Noto Sans" font-size="20" fill="#64748B">Stok masuk, penyesuaian, dan penjualan tercatat permanen.</text>

        <!-- Right Visual Panel positioned above Si KADI Dock (y: 295..680) -->
        <rect x="900" y="295" width="920" height="395" rx="24" fill="#051633"/>
        <text x="945" y="352" font-family="Noto Sans" font-size="26" font-weight="700" fill="#FFFFFF">Katalog Produk UMKM Real-Time</text>
        <text x="945" y="622" font-family="JetBrains Mono" font-size="21" font-weight="700" fill="#FB923C">KOP-001 · Rp 24.000</text>
        <text x="1235" y="622" font-family="JetBrains Mono" font-size="21" font-weight="700" fill="#FB923C">BTK-003 · Rp 135.000</text>
        <text x="1525" y="622" font-family="JetBrains Mono" font-size="21" font-weight="700" fill="#FB923C">SNK-002 · Rp 22.000</text>
        <text x="945" y="656" font-family="Noto Sans" font-size="18" fill="#93C5FD">Es Kopi Susu Gula Aren</text>
        <text x="1235" y="656" font-family="Noto Sans" font-size="18" fill="#93C5FD">Syal Batik Parang Navy</text>
        <text x="1525" y="656" font-family="Noto Sans" font-size="18" fill="#93C5FD">Keripik Tempe Renyah</text>

        <!-- Compact KPI Chip left of Si KADI Dock -->
        <rect x="900" y="715" width="600" height="125" rx="18" fill="#FFFFFF" stroke="#EA580C" stroke-width="2"/>
        <text x="938" y="766" font-family="Noto Sans" font-size="22" font-weight="800" fill="#EA580C">Sinkronisasi Atomik Cloud Firestore</text>
        <text x="938" y="808" font-family="Noto Sans" font-size="20" fill="#475569">Stok, omzet, dan poin pelanggan diperbarui bersamaan.</text>
      </svg>`,
      [
        { input: logoSmall, left: 100, top: 16 },
        { input: kopiBuf, left: 945, top: 382 },
        { input: batikBuf, left: 1235, top: 382 },
        { input: tempeBuf, left: 1525, top: 382 },
      ]
    )
  );

  // SCENE 4: PILAR 2 — DATABASE PELANGGAN (CRM)
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#F3F6FB"/>
        <rect width="${W}" height="104" fill="#051633"/>
        <text x="200" y="66" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FFFFFF">KADIN <tspan fill="#F97316">DIGI</tspan>   <tspan fill="#93C5FD" font-size="24" font-weight="500">|   PILAR 02 · DATABASE PELANGGAN (CRM)</tspan></text>

        <text x="100" y="196" font-family="Noto Sans" font-size="52" font-weight="800" fill="#08234D">Kenali &amp; Rawat Pelanggan Setia Anda</text>
        <text x="100" y="246" font-family="Noto Sans" font-size="25" fill="#475569">Segmentasi otomatis, poin loyalitas, riwayat belanja, dan sapaan personal WhatsApp.</text>

        <rect x="100" y="305" width="405" height="230" rx="20" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="135" y="365" font-family="Noto Sans" font-size="20" font-weight="700" fill="#64748B">SEGMEN AWAL</text>
        <text x="135" y="422" font-family="Noto Sans" font-size="40" font-weight="800" fill="#08234D">Reguler</text>
        <text x="135" y="482" font-family="Noto Sans" font-size="21" fill="#475569">Pembeli baru tercatat rapi</text>

        <rect x="535" y="305" width="405" height="230" rx="20" fill="#FFFFFF" stroke="#059669" stroke-width="2"/>
        <text x="570" y="365" font-family="Noto Sans" font-size="20" font-weight="700" fill="#059669">NAIK OTOMATIS</text>
        <text x="570" y="422" font-family="Noto Sans" font-size="40" font-weight="800" fill="#08234D">Setia</text>
        <text x="570" y="482" font-family="Noto Sans" font-size="21" fill="#475569">≥ 3 transaksi / Rp 400rb</text>

        <rect x="970" y="305" width="405" height="230" rx="20" fill="#051633"/>
        <text x="1005" y="365" font-family="Noto Sans" font-size="20" font-weight="700" fill="#FB923C">PRIORITAS UTAMA</text>
        <text x="1005" y="422" font-family="Noto Sans" font-size="40" font-weight="800" fill="#FFFFFF">VIP</text>
        <text x="1005" y="482" font-family="Noto Sans" font-size="21" fill="#CBD5E1">≥ 10 transaksi / Rp 1,5jt</text>

        <rect x="1405" y="305" width="415" height="230" rx="20" fill="#FFFFFF" stroke="#EA580C" stroke-width="2"/>
        <text x="1440" y="365" font-family="Noto Sans" font-size="20" font-weight="700" fill="#EA580C">MITRA GROSIR</text>
        <text x="1440" y="422" font-family="Noto Sans" font-size="40" font-weight="800" fill="#08234D">Reseller</text>
        <text x="1440" y="482" font-family="Noto Sans" font-size="21" fill="#475569">Penjualan volume besar</text>

        <!-- Benefit Card stops at x=1510 leaving bottom-right clean for Si KADI -->
        <rect x="100" y="585" width="1410" height="260" rx="24" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="148" y="658" font-family="Noto Sans" font-size="32" font-weight="800" fill="#08234D">Terhubung Otomatis dengan Kasir &amp; WhatsApp</text>
        <text x="148" y="718" font-family="Noto Sans" font-size="24" fill="#475569">• Setiap belanja Rp 10.000 otomatis memberikan 1 Poin Loyalitas.</text>
        <text x="148" y="766" font-family="Noto Sans" font-size="24" fill="#475569">• Riwayat total belanja dan frekuensi kunjungan selalu terukur.</text>
        <text x="148" y="814" font-family="Noto Sans" font-size="24" fill="#475569">• Data kontak &amp; preferensi terisolasi ketat per pemilik usaha (UU PDP).</text>
      </svg>`,
      [{ input: logoSmall, left: 100, top: 16 }]
    )
  );

  // SCENE 5: PILAR 3 — PEMASARAN DIGITAL
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#051633"/>
        <rect width="${W}" height="104" fill="#08234D"/>
        <text x="200" y="66" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FFFFFF">KADIN <tspan fill="#F97316">DIGI</tspan>   <tspan fill="#93C5FD" font-size="24" font-weight="500">|   PILAR 03 · PEMASARAN DIGITAL &amp; VOUCHER</tspan></text>

        <text x="100" y="196" font-family="Noto Sans" font-size="52" font-weight="800" fill="#FFFFFF">Promosi Terukur, <tspan fill="#FB923C">Omzet Melejit</tspan></text>
        <text x="100" y="248" font-family="Noto Sans" font-size="25" fill="#CBD5E1">Buat kode voucher promo dan kirim kampanye personal ke segmen pelanggan yang tepat.</text>

        <!-- Left Voucher Cards -->
        <rect x="100" y="305" width="720" height="245" rx="22" fill="#0B2C5F" stroke="#F97316" stroke-width="3"/>
        <text x="142" y="365" font-family="Noto Sans" font-size="21" font-weight="700" fill="#22D3EE">VOUCHER AKTIF TERINTEGRASI KASIR</text>
        <text x="142" y="452" font-family="JetBrains Mono" font-size="60" font-weight="800" fill="#FFFFFF">KADIN15 <tspan fill="#F97316">15% OFF</tspan></text>
        <text x="142" y="508" font-family="Noto Sans" font-size="21" fill="#CBD5E1">Promo Gajian UMKM Naik Kelas · Otomatis hitung penukaran</text>

        <rect x="100" y="585" width="720" height="245" rx="22" fill="#0B2C5F" stroke="#22D3EE" stroke-width="2"/>
        <text x="142" y="645" font-family="Noto Sans" font-size="21" font-weight="700" fill="#FB923C">VOUCHER KHUSUS MEMBER VIP</text>
        <text x="142" y="732" font-family="JetBrains Mono" font-size="52" font-weight="800" fill="#FFFFFF">VIPCUAN20 <tspan fill="#22D3EE">20% OFF</tspan></text>
        <text x="142" y="788" font-family="Noto Sans" font-size="21" fill="#CBD5E1">Apresiasi Pelanggan Setia &amp; VIP · Dorong repeat order</text>

        <!-- Right Studio Broadcast Card (y: 305..670 so bottom-right is open for Si KADI) -->
        <rect x="860" y="305" width="960" height="370" rx="24" fill="#FFFFFF"/>
        <text x="905" y="368" font-family="Noto Sans" font-size="30" font-weight="800" fill="#08234D">Studio Broadcast WhatsApp &amp; Sosial Media</text>
        <rect x="905" y="398" width="870" height="162" rx="16" fill="#F3F6FB" stroke="#CBD5E1" stroke-width="2"/>
        <text x="938" y="445" font-family="Noto Sans" font-size="22" font-weight="700" fill="#08234D">Halo Kak Rina! Promo Gajian UMKM Naik Kelas!</text>
        <text x="938" y="488" font-family="Noto Sans" font-size="20" fill="#475569">Nikmati produk lokal pilihan dengan potongan 15%. Pakai kode KADIN15 di kasir!</text>
        <text x="938" y="530" font-family="Noto Sans" font-size="19" font-weight="700" fill="#EA580C">UMKM Naik Kelas, Bisnis Makin Cuan</text>

        <rect x="905" y="582" width="380" height="68" rx="14" fill="#EA580C"/>
        <text x="975" y="625" font-family="Noto Sans" font-size="22" font-weight="800" fill="#FFFFFF">Kirim ke Segmen VIP</text>
        <rect x="1310" y="582" width="465" height="68" rx="14" fill="#08234D"/>
        <text x="1415" y="625" font-family="Noto Sans" font-size="22" font-weight="800" fill="#FFFFFF">Salin Caption IG / TikTok</text>

        <!-- Highlight chip left of Si KADI -->
        <rect x="860" y="705" width="650" height="125" rx="20" fill="#08234D" stroke="#F97316" stroke-width="2"/>
        <text x="900" y="758" font-family="Noto Sans" font-size="23" font-weight="800" fill="#FB923C">Promosi Tepat Sasaran &amp; Hemat Biaya</text>
        <text x="900" y="800" font-family="Noto Sans" font-size="20" fill="#E2E8F0">Tanpa perlu software tambahan — semua terhubung dengan data CRM.</text>
      </svg>`,
      [{ input: logoSmall, left: 100, top: 16 }]
    )
  );

  // SCENE 6: PILAR 4 — ANALISIS PENJUALAN & KINERJA
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#F3F6FB"/>
        <rect width="${W}" height="104" fill="#051633"/>
        <text x="200" y="66" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FFFFFF">KADIN <tspan fill="#F97316">DIGI</tspan>   <tspan fill="#93C5FD" font-size="24" font-weight="500">|   PILAR 04 · ANALISIS PENJUALAN &amp; KINERJA</tspan></text>

        <text x="100" y="196" font-family="Noto Sans" font-size="52" font-weight="800" fill="#08234D">Pantau Omzet, Laba Kotor &amp; Pertumbuhan</text>
        <text x="100" y="246" font-family="Noto Sans" font-size="25" fill="#475569">Laporan keuangan rapi dan ekspor CSV 1-klik — fondasi kuat menuju pembiayaan KUR.</text>

        <rect x="100" y="295" width="410" height="145" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="135" y="342" font-family="Noto Sans" font-size="20" fill="#64748B">Total Omzet</text>
        <text x="135" y="405" font-family="JetBrains Mono" font-size="40" font-weight="800" fill="#08234D">Real-Time</text>

        <rect x="540" y="295" width="410" height="145" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="575" y="342" font-family="Noto Sans" font-size="20" fill="#64748B">Estimasi Laba Kotor</text>
        <text x="575" y="405" font-family="JetBrains Mono" font-size="40" font-weight="800" fill="#059669">Berbasis HPP</text>

        <rect x="980" y="295" width="410" height="145" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="1015" y="342" font-family="Noto Sans" font-size="20" fill="#64748B">Produk Terlaris</text>
        <text x="1015" y="405" font-family="JetBrains Mono" font-size="40" font-weight="800" fill="#EA580C">Top 6 SKU</text>

        <rect x="1420" y="295" width="400" height="145" rx="18" fill="#051633"/>
        <text x="1455" y="342" font-family="Noto Sans" font-size="20" fill="#93C5FD">Ekspor Pembukuan</text>
        <text x="1455" y="405" font-family="JetBrains Mono" font-size="40" font-weight="800" fill="#FB923C">Unduh CSV</text>

        <!-- Growth Chart Card stops at x=1510 leaving bottom-right open for Si KADI -->
        <rect x="100" y="475" width="1410" height="380" rx="24" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="145" y="535" font-family="Noto Sans" font-size="28" font-weight="800" fill="#08234D">Visualisasi Tren Omzet &amp; Keamanan Enterprise</text>

        <rect x="175" y="715" width="95" height="95" rx="10" fill="#08234D"/>
        <rect x="315" y="670" width="95" height="140" rx="10" fill="#0D326B"/>
        <rect x="455" y="635" width="95" height="175" rx="10" fill="#144691"/>
        <rect x="595" y="605" width="95" height="205" rx="10" fill="#08234D"/>
        <rect x="735" y="580" width="95" height="230" rx="10" fill="#EA580C"/>
        <rect x="875" y="548" width="95" height="262" rx="10" fill="#F97316"/>
        <polyline points="222,695 362,650 502,615 642,585 782,560 922,525" fill="none" stroke="#F97316" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="922" cy="525" r="12" fill="#EA580C"/>

        <text x="1030" y="610" font-family="Noto Sans" font-size="28" font-weight="800" fill="#08234D">Keamanan Zero-Trust</text>
        <text x="1030" y="658" font-family="Noto Sans" font-size="22" fill="#475569">• Cloud Firestore Real-Time</text>
        <text x="1030" y="702" font-family="Noto Sans" font-size="22" fill="#475569">• Isolasi Data per Pemilik Usaha</text>
        <text x="1030" y="746" font-family="Noto Sans" font-size="22" fill="#475569">• Siap Pilot 38 KADIN Provinsi</text>
        <text x="1030" y="790" font-family="Noto Sans" font-size="22" font-weight="700" fill="#EA580C">• Fondasi UMKM Bankable</text>
      </svg>`,
      [{ input: logoSmall, left: 100, top: 16 }]
    )
  );

  // SCENE 7: CLOSING CTA — Hero Animated Talking Si KADI Centered Top
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g7" cx="50%" cy="32%" r="55%">
            <stop offset="0%" stop-color="#144691" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#051633" stop-opacity="1"/>
          </radialGradient>
        </defs>
        <rect width="${W}" height="${H}" fill="#051633"/>
        <rect width="${W}" height="${H}" fill="url(#g7)"/>

        <text x="960" y="608" text-anchor="middle" font-family="Noto Sans" font-size="100" font-weight="800" fill="#FFFFFF">KADIN <tspan fill="#F97316">DIGI</tspan></text>
        <text x="960" y="672" text-anchor="middle" font-family="Noto Sans" font-size="34" font-weight="700" fill="#DBEAFE">Si KADI — Robot Sahabat UMKM</text>
        <text x="960" y="728" text-anchor="middle" font-family="Noto Sans" font-size="26" fill="#CBD5E1">Mari Bersinergi Bersama Kamar Dagang dan Industri Indonesia</text>

        <rect x="400" y="772" width="1120" height="88" rx="20" fill="#08234D" stroke="#F97316" stroke-width="3"/>
        <text x="960" y="830" text-anchor="middle" font-family="Noto Sans" font-size="42" font-weight="800" fill="#FFFFFF">UMKM Naik Kelas   <tspan fill="#64748B">|</tspan>   <tspan fill="#FB923C">Bisnis Makin Cuan</tspan></text>
      </svg>`
    )
  );

  return plates;
}

// === MAIN EXECUTION ===
console.log('1/5 Synthesizing Indonesian Neural Voiceover for 7 scenes...');
const sceneVoices = [];
for (let i = 0; i < SCENE_SCRIPTS.length; i++) {
  const sc = SCENE_SCRIPTS[i];
  const mp3Path = path.join(TMP_DIR, `${sc.id}_raw.mp3`);
  const wavPath = path.join(TMP_DIR, `${sc.id}_voice.wav`);
  let engine = 'cached-neural';
  if (!fs.existsSync(mp3Path) || fs.statSync(mp3Path).size < 2000) {
    engine = await synthesizeSpeechMp3(sc.narration, mp3Path);
  }
  const voiceMeta = prepareSceneVoice(mp3Path, wavPath, LEAD_PAD, TAIL_PAD);
  console.log(
    `   [${sc.id}] ${engine} -> ${voiceMeta.duration.toFixed(2)}s (${voiceMeta.totalFrames} frames)`
  );
  sceneVoices.push({ ...sc, wavPath, ...voiceMeta });
}

// Concatenate all scene voices into one master narration WAV
// Account for crossfade overlap: each scene after the first overlaps by FADE_SEC,
// so we trim TAIL_PAD by FADE_SEC on scenes 0..N-2 for exact A/V sync!
console.log('2/5 Aligning master narration audio track & ducked corporate soundtrack...');
const alignedVoiceWavs = [];
const sceneFrameCounts = [];
for (let i = 0; i < sceneVoices.length; i++) {
  const sv = sceneVoices[i];
  const isLast = i === sceneVoices.length - 1;
  // Total frames contributed before crossfade overlap
  sceneFrameCounts.push(sv.totalFrames);
  const outAligned = path.join(TMP_DIR, `${sv.id}_aligned.wav`);
  if (!isLast) {
    // Keep exact duration minus FADE_SEC so audio matches xfade timeline frame-accurately
    const trimDur = (sv.totalFrames - FADE_FRAMES) / FPS;
    execFileSync(
      'ffmpeg',
      ['-y', '-i', sv.wavPath, '-t', trimDur.toFixed(4), '-ar', '44100', '-ac', '2', outAligned],
      { stdio: 'ignore' }
    );
  } else {
    execFileSync(
      'ffmpeg',
      ['-y', '-i', sv.wavPath, '-ar', '44100', '-ac', '2', outAligned],
      { stdio: 'ignore' }
    );
  }
  alignedVoiceWavs.push(outAligned);
}

const concatList = path.join(TMP_DIR, 'voice_concat.txt');
fs.writeFileSync(concatList, alignedVoiceWavs.map((p) => `file '${p}'`).join('\n'));
const masterVoiceWav = path.join(TMP_DIR, 'master_voice.wav');
execFileSync(
  'ffmpeg',
  ['-y', '-f', 'concat', '-safe', '0', '-i', concatList, '-c', 'copy', masterVoiceWav],
  { stdio: 'ignore' }
);

const totalVideoFrames =
  sceneFrameCounts.reduce((acc, n) => acc + n, 0) - (sceneVoices.length - 1) * FADE_FRAMES;
const totalVideoDur = totalVideoFrames / FPS;
console.log(`   Master timeline: ${totalVideoFrames} frames (${totalVideoDur.toFixed(2)}s @ ${FPS}fps)`);

const musicWav = path.join(TMP_DIR, 'music.wav');
generateBackgroundAudio(musicWav, totalVideoDur + 0.5);

// Mix master narration + sidechain-ducked corporate soundtrack into clean broadcast master WAV
const mixedAudioWav = path.join(TMP_DIR, 'mixed_master.wav');
execFileSync(
  'ffmpeg',
  [
    '-y',
    '-i',
    masterVoiceWav,
    '-i',
    musicWav,
    '-filter_complex',
    '[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,volume=1.38,asplit=2[vmain][vkey];' +
      '[1:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,volume=0.28[bg];' +
      '[bg][vkey]sidechaincompress=threshold=0.03:ratio=4.5:attack=40:release=350[bgduck];' +
      '[vmain][bgduck]amix=inputs=2:duration=first:dropout_transition=2,alimiter=limit=0.95[aout]',
    '-map',
    '[aout]',
    '-ar',
    '44100',
    '-ac',
    '2',
    '-c:a',
    'pcm_s16le',
    mixedAudioWav,
  ],
  { stdio: 'ignore' }
);

console.log('3/5 Pre-rendering animated talking Si KADI sprites (lip-sync + blink) & scene plates...');
const spritesDock = await createSiKadiSpriteSet(300); // Scenes 2-6 bottom-right talking dock
const spritesHero = await createSiKadiSpriteSet(380); // Scene 1 & Scene 7 large talking hero
const scenePlates = await buildScenePlates();

const sceneSubtitles = [];
for (const sc of sceneVoices) {
  const subs = [];
  for (const line of sc.subtitles) {
    subs.push(await renderSubtitleOverlay(line, sc.mode));
  }
  sceneSubtitles.push(subs);
}

// Helper to render one complete animated frame for a given scene index + local frame index
function renderAnimatedSceneFrame(outBuf, sceneIdx, localFrame) {
  const sv = sceneVoices[sceneIdx];
  const plate = scenePlates[sceneIdx];
  plate.copy(outBuf);

  const fClamped = Math.min(sv.totalFrames - 1, Math.max(0, localFrame));
  const t = fClamped / FPS;
  const rms = sv.rms[fClamped];

  // Determine lip-sync mouth viseme state (0..4) driven directly by narration RMS amplitude
  let mouthState = 0;
  if (rms > 0.68) mouthState = 4;
  else if (rms > 0.44) mouthState = 3;
  else if (rms > 0.24) mouthState = 2;
  else if (rms > 0.11) mouthState = 1;
  else mouthState = 0;

  // Natural rapid syllable micro-modulation when speaking continuously so mouth feels dynamic
  if (mouthState >= 2 && fClamped % 4 === 0 && rms < 0.78) {
    mouthState = Math.max(1, mouthState - 1);
  }

  // Natural blinking every ~3.2 seconds (3 frames blink)
  const blinkCycle = fClamped % Math.round(3.2 * FPS);
  const blinkState = blinkCycle >= 68 && blinkCycle <= 70 ? 1 : 0;

  // Gentle floating + talking energy bounce
  const bobY = Math.round(Math.sin(t * 4.2) * 5 - rms * 7);

  // Place animated Si KADI + acoustic halo + voice equalizer
  if (sv.mode === 'hero-right') {
    const sprite = spritesHero[blinkState][mouthState];
    const centerX = 1585;
    const centerY = 435 + bobY;
    // Pulsing cyan/orange acoustic rings when talking
    if (rms > 0.1) {
      drawPulsingRing(outBuf, W, H, centerX, centerY, 200 + rms * 28, 8, 34, 211, 238, 0.35 + rms * 0.4);
      drawPulsingRing(outBuf, W, H, centerX, centerY, 224 + rms * 42, 6, 249, 115, 22, 0.22 + rms * 0.32);
    }
    alphaBlendRGBAOntoRGB(
      outBuf,
      W,
      H,
      sprite.data,
      sprite.width,
      sprite.height,
      Math.round(centerX - sprite.width / 2),
      Math.round(centerY - sprite.height / 2)
    );
    drawVoiceEqualizer(outBuf, centerX, 855, rms, t);
  } else if (sv.mode === 'hero-center') {
    const sprite = spritesHero[blinkState][mouthState];
    const centerX = 960;
    const centerY = 228 + bobY;
    if (rms > 0.1) {
      drawPulsingRing(outBuf, W, H, centerX, centerY, 198 + rms * 26, 8, 34, 211, 238, 0.38 + rms * 0.38);
      drawPulsingRing(outBuf, W, H, centerX, centerY, 222 + rms * 38, 6, 249, 115, 22, 0.24 + rms * 0.3);
    }
    alphaBlendRGBAOntoRGB(
      outBuf,
      W,
      H,
      sprite.data,
      sprite.width,
      sprite.height,
      Math.round(centerX - sprite.width / 2),
      Math.round(centerY - sprite.height / 2)
    );
    drawVoiceEqualizer(outBuf, centerX, 466, rms, t);
  } else {
    // Bottom-right talking presenter dock for Scenes 2–6
    const sprite = spritesDock[blinkState][mouthState];
    const centerX = 1710;
    const centerY = 855 + bobY;
    if (rms > 0.1) {
      drawPulsingRing(outBuf, W, H, centerX, centerY, 158 + rms * 22, 7, 34, 211, 238, 0.4 + rms * 0.4);
      drawPulsingRing(outBuf, W, H, centerX, centerY, 178 + rms * 34, 5, 249, 115, 22, 0.25 + rms * 0.32);
    }
    alphaBlendRGBAOntoRGB(
      outBuf,
      W,
      H,
      sprite.data,
      sprite.width,
      sprite.height,
      Math.round(centerX - sprite.width / 2),
      Math.round(centerY - sprite.height / 2)
    );
    drawVoiceEqualizer(outBuf, centerX, 1044, rms, t);
  }

  // Draw active subtitle speech strip synced to proportional timing within the scene's spoken window
  const subs = sceneSubtitles[sceneIdx];
  const speakStartF = Math.round(LEAD_PAD * FPS);
  const speakEndF = Math.max(speakStartF + 1, sv.totalFrames - Math.round(TAIL_PAD * FPS));
  const progress = Math.min(0.999, Math.max(0, (fClamped - speakStartF) / (speakEndF - speakStartF)));
  const subIdx = Math.min(subs.length - 1, Math.floor(progress * subs.length));
  const sub = subs[subIdx];
  const subX = sv.mode === 'hero-center' ? Math.round((W - sub.width) / 2) : 100;
  const subY = sv.mode === 'hero-center' ? 928 : 936;
  alphaBlendRGBAOntoRGB(outBuf, W, H, sub.data, sub.width, sub.height, subX, subY);
}

console.log('4/5 Streaming animated lip-synced Full HD frames into FFmpeg encoder...');
const ffmpeg = spawn(
  'ffmpeg',
  [
    '-y',
    '-f',
    'rawvideo',
    '-vcodec',
    'rawvideo',
    '-pix_fmt',
    'rgb24',
    '-s',
    `${W}x${H}`,
    '-r',
    String(FPS),
    '-i',
    'pipe:0',
    '-i',
    mixedAudioWav,
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-shortest',
    '-movflags',
    '+faststart',
    OUT_MP4,
  ],
  { stdio: ['pipe', 'ignore', 'pipe'] }
);

let ffmpegErr = '';
ffmpeg.stderr.on('data', (d) => {
  ffmpegErr += d.toString();
});

const frameBufA = Buffer.allocUnsafe(W * H * 3);
const frameBufB = Buffer.allocUnsafe(W * H * 3);
const blendBuf = Buffer.allocUnsafe(W * H * 3);

async function writeFrame(buf) {
  if (!ffmpeg.stdin.write(buf)) {
    await new Promise((resolve) => ffmpeg.stdin.once('drain', resolve));
  }
}

let writtenFrames = 0;
for (let s = 0; s < sceneVoices.length; s++) {
  const totalF = sceneVoices[s].totalFrames;
  const hasPrevFade = s > 0;
  const hasNextFade = s < sceneVoices.length - 1;
  const startF = hasPrevFade ? FADE_FRAMES : 0;
  const bodyEndF = hasNextFade ? totalF - FADE_FRAMES : totalF;

  // Main scene body frames
  for (let f = startF; f < bodyEndF; f++) {
    renderAnimatedSceneFrame(frameBufA, s, f);
    await writeFrame(frameBufA);
    writtenFrames++;
  }

  // Smooth crossfade frames into next scene
  if (hasNextFade) {
    for (let k = 0; k < FADE_FRAMES; k++) {
      const alpha = (k + 1) / (FADE_FRAMES + 1);
      const aInt = Math.round(alpha * 256);
      const invInt = 256 - aInt;
      renderAnimatedSceneFrame(frameBufA, s, bodyEndF + k);
      renderAnimatedSceneFrame(frameBufB, s + 1, k);
      for (let i = 0; i < blendBuf.length; i++) {
        blendBuf[i] = (frameBufA[i] * invInt + frameBufB[i] * aInt) >> 8;
      }
      await writeFrame(blendBuf);
      writtenFrames++;
    }
  }
  console.log(`   Encoded scene ${s + 1}/${sceneVoices.length} (${writtenFrames}/${totalVideoFrames} frames)`);
}

ffmpeg.stdin.end();
await new Promise((resolve, reject) => {
  ffmpeg.on('close', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`FFmpeg exited ${code}: ${ffmpegErr.slice(-800)}`));
  });
});

// Cleanup temp directory
fs.rmSync(TMP_DIR, { recursive: true, force: true });
const finalDur = getAudioDuration(OUT_MP4);
const sizeMb = (fs.statSync(OUT_MP4).size / (1024 * 1024)).toFixed(2);
console.log(`5/5 DONE! Narrated + Lip-Synced Si KADI Video saved: ${OUT_MP4} (${finalDur.toFixed(1)}s, ${sizeMb} MB)`);
process.exit(0);
