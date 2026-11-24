import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import sharp from 'sharp';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const ROOT = process.cwd();
const TMP_DIR = path.join(ROOT, '.tmp_video_sidika');
const OUT_MP4 = path.join(ROOT, 'public/downloads/Video_Promosi_SI_DIKA.mp4');
const OUT_POSTER = path.join(ROOT, 'public/images/video-poster-sidika.png');
const KADIN_LOGO = path.join(ROOT, 'public/assets/aistudio/image_33c655e3.png');
const LOGO_IMG = path.join(ROOT, 'public/images/si-kadi-logo.jpg');
const PROD_KOPI = path.join(ROOT, 'public/images/prod-kopi-susu.jpg');
const PROD_BATIK = path.join(ROOT, 'public/images/prod-batik-scarf.jpg');
const PROD_TEMPE = path.join(ROOT, 'public/images/prod-keripik-tempe.jpg');

fs.rmSync(TMP_DIR, { recursive: true, force: true });
fs.mkdirSync(TMP_DIR, { recursive: true });
fs.mkdirSync(path.dirname(OUT_MP4), { recursive: true });
fs.mkdirSync(path.dirname(OUT_POSTER), { recursive: true });

const W = 1920;
const H = 1080;
const FPS = 24;
const LEAD_PAD = 0.4;
const TAIL_PAD = 0.6;
const FADE_SEC = 0.45;
const FADE_FRAMES = Math.round(FADE_SEC * FPS);

const SCENE_SCRIPTS = [
  {
    id: 'scene1',
    mode: 'hero-right',
    narration:
      'Halo Bapak dan Ibu Pimpinan Perusahaan! Perkenalkan, saya SI DIKA, Sistem Kasir dan Inventori yang kini dilengkapi One Payment System terpadu, bekerja sama dengan KADIN Indonesia. Bersama kita wujudkan UMKM Naik Kelas, Bisnis Makin Cuan!',
    subtitles: [
      'Halo Bapak dan Ibu Pimpinan Perusahaan!',
      'Perkenalkan SI DIKA — Sistem Kasir, Inventori & One Payment System.',
      'Bekerja sama dengan KADIN Indonesia: UMKM Naik Kelas, Bisnis Makin Cuan!',
    ],
  },
  {
    id: 'scene2',
    mode: 'dock',
    narration:
      'Lebih dari enam puluh lima juta pelaku UMKM menjadi tulang punggung ekonomi Indonesia. Namun pencatatan manual, stok selisih, dan pembayaran terpisah masih menjadi kendala. SI DIKA hadir sebagai solusi operasional digital terpadu.',
    subtitles: [
      'Lebih dari 65 juta UMKM adalah tulang punggung ekonomi Indonesia.',
      'Pencatatan manual, stok selisih, dan pembayaran terpisah kini teratasi.',
      'SI DIKA menyatukan kasir, stok, dan pembayaran dalam satu platform cloud.',
    ],
  },
  {
    id: 'scene3',
    mode: 'dock',
    narration:
      'Pertama, Sistem Kasir dan Inventori SI DIKA. Transaksi selesai dalam hitungan detik, stok terpotong otomatis secara real-time anti-selisih, lengkap dengan peringatan stok menipis dan struk digital siap cetak atau kirim WhatsApp.',
    subtitles: [
      'Pilar 1: Sistem Kasir & Inventori SI DIKA super cepat dan akurat.',
      'Stok terpotong otomatis real-time dengan audit mutasi anti-selisih.',
      'Struk digital rapi siap cetak atau kirim langsung ke WhatsApp pelanggan.',
    ],
  },
  {
    id: 'scene4',
    mode: 'dock',
    narration:
      'Kini dilengkapi One Payment System! Terima pembayaran QRIS nasional, Virtual Account bank, E-Wallet, hingga transfer dalam satu gerbang terpadu. Setiap pembayaran terekonsiliasi otomatis real-time dengan pencairan dana cepat dan transparan.',
    subtitles: [
      'ONE PAYMENT SYSTEM: QRIS, Virtual Account, E-Wallet & Transfer dalam 1 gerbang.',
      'Rekonsiliasi pembayaran otomatis langsung terhubung ke kasir SI DIKA.',
      'Pencairan dana ke rekening usaha lebih cepat, tercatat rapi, dan transparan.',
    ],
  },
  {
    id: 'scene5',
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
    id: 'scene6',
    mode: 'dock',
    narration:
      'Ketiga, Pemasaran Digital. Pelaku usaha dapat membuat kode voucher promo seperti SI DIKA lima belas yang langsung aktif di kasir, serta mengirim broadcast promosi personal untuk meningkatkan transaksi berulang.',
    subtitles: [
      'Pilar 3: Pemasaran Digital dengan kode voucher terintegrasi kasir.',
      'Kirim broadcast WhatsApp personal & salin caption media sosial.',
      'Dorong repeat order dan ukur efektivitas promo secara akurat.',
    ],
  },
  {
    id: 'scene7',
    mode: 'dock',
    narration:
      'Keempat, Analisis Kinerja dan Tata Kelola Empat Peran. Pantau omzet, laba kotor berbasis HPP, ekspor laporan CSV satu klik, serta pemisahan akses Kasir, Pemilik, Admin Pusat, hingga Super Admin Kantor Pusat.',
    subtitles: [
      'Pilar 4: Analisis omzet, laba kotor HPP, dan ekspor pembukuan CSV 1-klik.',
      'Pemisahan akses 4 peran: Kasir, Pemilik, Admin Pusat & Super Admin.',
      'Keamanan Zero-Trust dan Cloud Firestore real-time siap skala nasional.',
    ],
  },
  {
    id: 'scene8',
    mode: 'hero-center',
    narration:
      'Mari bersinergi bersama KADIN Indonesia mempercepat transformasi digital UMKM di seluruh nusantara bersama SI DIKA, Sistem Kasir, Inventori, dan One Payment System. UMKM Naik Kelas, Bisnis Makin Cuan!',
    subtitles: [
      'Mari bersinergi bersama KADIN Indonesia.',
      'SI DIKA — Sistem Kasir, Inventori & One Payment System.',
      'UMKM Naik Kelas, Bisnis Makin Cuan!',
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

function prepareSceneVoice(mp3Path, wavPath, leadPadSec, tailPadSec) {
  const leadMs = Math.round(leadPadSec * 1000);
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-i',
      mp3Path,
      '-af',
      `atempo=1.06,highpass=f=85,equalizer=f=3000:t=q:w=1.2:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=5:release=60,adelay=${leadMs}|${leadMs},apad=pad_dur=${tailPadSec}`,
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

  const norm = new Float32Array(totalFrames);
  for (let f = 0; f < totalFrames; f++) {
    const prev = f > 0 ? rmsList[f - 1] : rmsList[f];
    const next = f + 1 < totalFrames ? rmsList[f + 1] : rmsList[f];
    const smoothed = prev * 0.2 + rmsList[f] * 0.6 + next * 0.2;
    norm[f] = Math.min(1, smoothed / (maxRms * 0.72));
  }

  return { duration: totalFrames / FPS, totalFrames, rms: norm };
}

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

async function createMascotSpriteSet(targetSize) {
  const sprites = [];
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
      let mouthSvg = '';
      if (mouth === 0) {
        mouthSvg = `
          <path d="M 476 489 Q 512.5 516 549 489" fill="none" stroke="#00D4FF" stroke-width="20" stroke-linecap="round" stroke-opacity="0.32"/>
          <path d="M 476 489 Q 512.5 516 549 489" fill="none" stroke="#3BF4FF" stroke-width="12" stroke-linecap="round"/>
          <path d="M 476 489 Q 512.5 516 549 489" fill="none" stroke="#D1FEFF" stroke-width="4.5" stroke-linecap="round"/>
        `;
      } else if (mouth === 1) {
        mouthSvg = `
          <ellipse cx="512.5" cy="498" rx="30" ry="15" fill="#00D4FF" fill-opacity="0.28"/>
          <ellipse cx="512.5" cy="498" rx="25" ry="12" fill="#063147" stroke="#3BF4FF" stroke-width="8"/>
          <ellipse cx="512.5" cy="498" rx="25" ry="12" fill="none" stroke="#C4FEFF" stroke-width="3"/>
        `;
      } else if (mouth === 2) {
        mouthSvg = `
          <path d="M 468 483 Q 512.5 489 557 483 Q 553 526 512.5 528 Q 472 526 468 483 Z" fill="#00D4FF" fill-opacity="0.25"/>
          <path d="M 472 486 Q 512.5 491 553 486 Q 549 522 512.5 524 Q 476 522 472 486 Z" fill="#073248" stroke="#3BF4FF" stroke-width="8" stroke-linejoin="round"/>
          <path d="M 489 514 Q 512.5 504 536 514 Q 525 523 512.5 523 Q 500 523 489 514 Z" fill="#22D3EE" fill-opacity="0.88"/>
          <path d="M 472 486 Q 512.5 491 553 486 Q 549 522 512.5 524 Q 476 522 472 486 Z" fill="none" stroke="#D1FEFF" stroke-width="3" stroke-linejoin="round"/>
        `;
      } else if (mouth === 3) {
        mouthSvg = `
          <path d="M 458 478 Q 512.5 485 567 478 Q 563 538 512.5 540 Q 462 538 458 478 Z" fill="#00D4FF" fill-opacity="0.28"/>
          <path d="M 463 482 Q 512.5 488 562 482 Q 558 533 512.5 535 Q 467 533 463 482 Z" fill="#062B40" stroke="#3BF4FF" stroke-width="9" stroke-linejoin="round"/>
          <path d="M 484 521 Q 512.5 507 541 521 Q 528 533 512.5 533 Q 497 533 484 521 Z" fill="#38BDF8" fill-opacity="0.92"/>
          <path d="M 477 492 Q 512.5 496 548 492" fill="none" stroke="#F0F9FF" stroke-width="6.5" stroke-linecap="round"/>
          <path d="M 463 482 Q 512.5 488 562 482 Q 558 533 512.5 535 Q 467 533 463 482 Z" fill="none" stroke="#D1FEFF" stroke-width="3.2" stroke-linejoin="round"/>
        `;
      } else {
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
          <ellipse cx="512.5" cy="500" rx="68" ry="32" fill="url(#visorPatch)"/>
          <ellipse cx="512.5" cy="498" rx="52" ry="24" fill="#0B273E"/>
          ${mouthSvg}
        </svg>`
      );

      const fullWithFace = await sharp(LOGO_IMG)
        .composite([{ input: facePatchSvg, top: 0, left: 0 }])
        .png()
        .toBuffer();

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

async function renderSubtitleOverlay(text, mode) {
  const isHeroRight = mode === 'hero-right';
  const isHeroCenter = mode === 'hero-center';
  const boxW = isHeroCenter ? 1560 : isHeroRight ? 1320 : 1410;
  const boxH = 104;

  const svg = Buffer.from(
    `<svg width="${boxW}" height="${boxH}" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="${boxW - 4}" height="${boxH - 4}" rx="20" fill="#051633" fill-opacity="0.93" stroke="#F97316" stroke-width="3"/>
      <rect x="18" y="20" width="8" height="${boxH - 40}" rx="4" fill="#22D3EE"/>
      <text x="44" y="42" font-family="Noto Sans" font-size="18" font-weight="800" fill="#22D3EE" letter-spacing="2">SI DIKA · NARASI RESMI SISTEM KASIR, INVENTORI &amp; ONE PAYMENT</text>
      <text x="44" y="80" font-family="Noto Sans" font-size="28" font-weight="700" fill="#FFFFFF">${esc(text)}</text>
    </svg>`
  );

  const { data, info } = await sharp(svg).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

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

function drawVoiceEqualizer(dstRGB, centerX, baseY, rms, t) {
  const numBars = 9;
  const barW = 10;
  const gap = 7;
  const totalW = numBars * barW + (numBars - 1) * gap;
  const startX = Math.round(centerX - totalW / 2);

  drawFilledRectAlpha(dstRGB, W, H, startX - 18, baseY - 38, totalW + 36, 48, 5, 22, 51, 0.88);

  const weights = [0.45, 0.72, 0.9, 1.0, 0.96, 1.0, 0.88, 0.7, 0.45];
  for (let i = 0; i < numBars; i++) {
    const wave = 0.5 + 0.5 * Math.sin(t * 14 + i * 1.15);
    const level = rms > 0.08 ? Math.min(1, rms * weights[i] * (0.55 + 0.65 * wave)) : 0.14;
    const bh = Math.max(6, Math.round(level * 30));
    const bx = startX + i * (barW + gap);
    const by = baseY - 14 - Math.round(bh / 2);
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
  const kadinLogoCard = await sharp(KADIN_LOGO)
    .resize(190, 190, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const kadinLogoClosing = await sharp(KADIN_LOGO)
    .resize(104, 104, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const logoSmall = await prepRoundedImage(LOGO_IMG, 72, 72, 16);
  const kopiBuf = await prepRoundedImage(PROD_KOPI, 210, 210, 20);
  const batikBuf = await prepRoundedImage(PROD_BATIK, 210, 210, 20);
  const tempeBuf = await prepRoundedImage(PROD_TEMPE, 210, 210, 20);

  const plates = [];

  // SCENE 1: OPENING BRAND REVEAL — SI DIKA + ONE PAYMENT SYSTEM + KADIN INDONESIA
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

        <text x="100" y="146" font-family="Noto Sans" font-size="22" font-weight="700" fill="#22D3EE" letter-spacing="3.5">SOLUSI DIGITALISASI UMKM · BEKERJA SAMA DENGAN KADIN INDONESIA</text>
        <text x="100" y="290" font-family="Noto Sans" font-size="136" font-weight="800" fill="#FFFFFF">SI <tspan fill="#F97316">DIKA</tspan></text>
        <text x="100" y="368" font-family="Noto Sans" font-size="38" font-weight="700" fill="#DBEAFE">Sistem Kasir, Inventori &amp; One Payment System</text>
        <text x="100" y="440" font-family="Noto Sans" font-size="26" fill="#CBD5E1">Platform kasir digital, stok otomatis, gerbang pembayaran terpadu,</text>
        <text x="100" y="482" font-family="Noto Sans" font-size="26" fill="#CBD5E1">CRM pelanggan, pemasaran &amp; analitik kinerja bagi perusahaan &amp; UMKM.</text>

        <rect x="100" y="544" width="760" height="86" rx="18" fill="#08234D" stroke="#F97316" stroke-width="3"/>
        <text x="138" y="599" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FFFFFF">UMKM Naik Kelas  <tspan fill="#64748B">|</tspan>  <tspan fill="#FB923C">Bisnis Makin Cuan</tspan></text>

        <!-- One Payment System Highlight Strip -->
        <rect x="100" y="658" width="760" height="232" rx="22" fill="#08234D" stroke="#22D3EE" stroke-width="2"/>
        <text x="136" y="708" font-family="Noto Sans" font-size="20" font-weight="800" fill="#22D3EE" letter-spacing="2">TERINTEGRASI ONE PAYMENT SYSTEM</text>
        <text x="136" y="758" font-family="Noto Sans" font-size="26" font-weight="700" fill="#FFFFFF">QRIS · Virtual Account · E-Wallet · Transfer</text>
        <text x="136" y="802" font-family="Noto Sans" font-size="21" fill="#CBD5E1">Satu sistem pembayaran terpadu, rekonsiliasi otomatis real-time,</text>
        <text x="136" y="838" font-family="Noto Sans" font-size="21" fill="#FB923C">dan pencairan dana cepat langsung ke rekening usaha Anda.</text>

        <!-- Official KADIN Indonesia Cooperation Card -->
        <rect x="910" y="505" width="390" height="385" rx="28" fill="#08234D" stroke="#1E40AF" stroke-width="2.5"/>
        <text x="1105" y="555" text-anchor="middle" font-family="Noto Sans" font-size="18" font-weight="800" fill="#22D3EE" letter-spacing="2.5">BEKERJA SAMA DENGAN</text>
        <rect x="995" y="578" width="220" height="220" rx="24" fill="#FFFFFF" fill-opacity="0.96"/>
        <text x="1105" y="838" text-anchor="middle" font-family="Noto Sans" font-size="24" font-weight="800" fill="#FFFFFF">KADIN INDONESIA</text>
        <text x="1105" y="868" text-anchor="middle" font-family="Noto Sans" font-size="16" fill="#93C5FD">Kamar Dagang dan Industri Indonesia</text>

        <!-- Right Hero Stage Panel for Animated Talking Mascot -->
        <rect x="1340" y="120" width="490" height="770" rx="36" fill="#08234D" fill-opacity="0.88" stroke="#1E40AF" stroke-width="3"/>
        <text x="1585" y="185" text-anchor="middle" font-family="Noto Sans" font-size="22" font-weight="800" fill="#22D3EE" letter-spacing="3">MASKOT INTERAKTIF</text>
        <text x="1585" y="746" text-anchor="middle" font-family="Noto Sans" font-size="44" font-weight="800" fill="#FFFFFF">SI DIKA</text>
        <text x="1585" y="788" text-anchor="middle" font-family="Noto Sans" font-size="21" font-weight="600" fill="#FB923C">Sistem Kasir dan Inventori</text>
      </svg>`,
      [{ input: kadinLogoCard, left: 1010, top: 593 }]
    )
  );

  // SCENE 2: LATAR BELAKANG STRATEGIS UMKM
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

        <rect x="100" y="575" width="1410" height="270" rx="22" fill="#0B2C5F" stroke="#F97316" stroke-width="2"/>
        <text x="148" y="655" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FB923C">Tantangan Nyata UMKM di Lapangan</text>
        <text x="148" y="715" font-family="Noto Sans" font-size="25" fill="#E2E8F0">• Pencatatan kasir masih manual, stok sering selisih, dan omzet sulit dilacak.</text>
        <text x="148" y="762" font-family="Noto Sans" font-size="25" fill="#E2E8F0">• Metode pembayaran terpisah-pisah &amp; rekonsiliasi keuangan menyita waktu.</text>
        <text x="148" y="810" font-family="Noto Sans" font-size="25" font-weight="700" fill="#22D3EE">→ SI DIKA menyatukan kasir, stok &amp; One Payment System dalam satu cloud.</text>
      </svg>`
    )
  );

  // SCENE 3: PILAR 1 — KASIR POS & INVENTORY
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#F3F6FB"/>
        <rect width="${W}" height="104" fill="#051633"/>
        <text x="200" y="66" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FFFFFF">SI <tspan fill="#F97316">DIKA</tspan>   <tspan fill="#93C5FD" font-size="24" font-weight="500">|   PILAR 01 · SISTEM KASIR &amp; INVENTORI</tspan></text>

        <text x="100" y="196" font-family="Noto Sans" font-size="52" font-weight="800" fill="#08234D">Kasir Cepat, Stok Otomatis Akurat</text>
        <text x="100" y="246" font-family="Noto Sans" font-size="25" fill="#475569">Transaksi selesai dalam hitungan detik dengan pemotongan stok atomik dan struk digital.</text>

        <rect x="100" y="295" width="760" height="165" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="138" y="355" font-family="Noto Sans" font-size="28" font-weight="800" fill="#EA580C">01. Transaksi Cepat &amp; Voucher Kasir</text>
        <text x="138" y="400" font-family="Noto Sans" font-size="22" fill="#475569">Pencarian SKU/nama instan, kalkulator kembalian otomatis &amp; multi-metode.</text>
        <text x="138" y="434" font-family="Noto Sans" font-size="20" fill="#64748B">Validasi diskon voucher instan langsung saat checkout.</text>

        <rect x="100" y="485" width="760" height="165" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="138" y="545" font-family="Noto Sans" font-size="28" font-weight="800" fill="#08234D">02. Struk Digital Cetak &amp; Kirim WhatsApp</text>
        <text x="138" y="590" font-family="Noto Sans" font-size="22" fill="#475569">Cetak struk rapi atau salin format teks untuk dikirim ke pelanggan.</text>
        <text x="138" y="624" font-family="Noto Sans" font-size="20" fill="#64748B">Dilengkapi riwayat transaksi dan kontrol Void khusus Pemilik Usaha.</text>

        <rect x="100" y="675" width="760" height="165" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="138" y="735" font-family="Noto Sans" font-size="28" font-weight="800" fill="#08234D">03. Peringatan Stok Menipis &amp; Audit Mutasi</text>
        <text x="138" y="780" font-family="Noto Sans" font-size="22" fill="#475569">Pantau HPP, margin laba, dan buku log mutasi stok anti-selisih.</text>
        <text x="138" y="814" font-family="Noto Sans" font-size="20" fill="#64748B">Stok masuk, penyesuaian, dan penjualan tercatat permanen.</text>

        <rect x="900" y="295" width="920" height="395" rx="24" fill="#051633"/>
        <text x="945" y="352" font-family="Noto Sans" font-size="26" font-weight="700" fill="#FFFFFF">Katalog Produk UMKM Real-Time</text>
        <text x="945" y="622" font-family="JetBrains Mono" font-size="21" font-weight="700" fill="#FB923C">KOP-001 · Rp 24.000</text>
        <text x="1235" y="622" font-family="JetBrains Mono" font-size="21" font-weight="700" fill="#FB923C">BTK-003 · Rp 135.000</text>
        <text x="1525" y="622" font-family="JetBrains Mono" font-size="21" font-weight="700" fill="#FB923C">SNK-002 · Rp 22.000</text>
        <text x="945" y="656" font-family="Noto Sans" font-size="18" fill="#93C5FD">Es Kopi Susu Gula Aren</text>
        <text x="1235" y="656" font-family="Noto Sans" font-size="18" fill="#93C5FD">Syal Batik Parang Navy</text>
        <text x="1525" y="656" font-family="Noto Sans" font-size="18" fill="#93C5FD">Keripik Tempe Renyah</text>

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

  // SCENE 4: DEDICATED ONE PAYMENT SYSTEM SHOWCASE
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="gPay" cx="52%" cy="40%" r="58%">
            <stop offset="0%" stop-color="#0E3A78" stop-opacity="0.85"/>
            <stop offset="100%" stop-color="#051633" stop-opacity="1"/>
          </radialGradient>
        </defs>
        <rect width="${W}" height="${H}" fill="#051633"/>
        <rect width="${W}" height="${H}" fill="url(#gPay)"/>
        <rect width="${W}" height="104" fill="#08234D"/>
        <text x="200" y="66" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FFFFFF">SI <tspan fill="#F97316">DIKA</tspan>   <tspan fill="#22D3EE" font-size="24" font-weight="700">|   ONE PAYMENT SYSTEM TERPADU</tspan></text>

        <text x="100" y="196" font-family="Noto Sans" font-size="54" font-weight="800" fill="#FFFFFF">Satu Gerbang untuk <tspan fill="#FB923C">Semua Pembayaran</tspan></text>
        <text x="100" y="248" font-family="Noto Sans" font-size="25" fill="#CBD5E1">Terima transaksi non-tunai &amp; tunai tanpa perangkat terpisah, dengan rekonsiliasi real-time.</text>

        <!-- 4 Payment Channels -->
        <rect x="100" y="300" width="405" height="215" rx="20" fill="#0B2C5F" stroke="#22D3EE" stroke-width="2.5"/>
        <text x="136" y="354" font-family="JetBrains Mono" font-size="20" font-weight="700" fill="#22D3EE">01 · QRIS DINAMIS</text>
        <text x="136" y="410" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FFFFFF">QRIS Nasional</text>
        <text x="136" y="458" font-family="Noto Sans" font-size="20" fill="#CBD5E1">Nominal otomatis dari kasir,</text>
        <text x="136" y="488" font-family="Noto Sans" font-size="20" fill="#CBD5E1">verifikasi lunas instan.</text>

        <rect x="535" y="300" width="405" height="215" rx="20" fill="#0B2C5F" stroke="#F97316" stroke-width="2.5"/>
        <text x="571" y="354" font-family="JetBrains Mono" font-size="20" font-weight="700" fill="#FB923C">02 · PERBANKAN</text>
        <text x="571" y="410" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FFFFFF">Virtual Account</text>
        <text x="571" y="458" font-family="Noto Sans" font-size="20" fill="#CBD5E1">BCA, Mandiri, BRI, BNI, BSI</text>
        <text x="571" y="488" font-family="Noto Sans" font-size="20" fill="#CBD5E1">otomatis terkonfirmasi.</text>

        <rect x="970" y="300" width="405" height="215" rx="20" fill="#0B2C5F" stroke="#22D3EE" stroke-width="2.5"/>
        <text x="1006" y="354" font-family="JetBrains Mono" font-size="20" font-weight="700" fill="#22D3EE">03 · DOMPET DIGITAL</text>
        <text x="1006" y="410" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FFFFFF">E-Wallet &amp; GasPay</text>
        <text x="1006" y="458" font-family="Noto Sans" font-size="20" fill="#CBD5E1">GoPay, OVO, DANA, ShopeePay</text>
        <text x="1006" y="488" font-family="Noto Sans" font-size="20" fill="#CBD5E1">&amp; ekosistem GasPay lokal.</text>

        <rect x="1405" y="300" width="415" height="215" rx="20" fill="#0B2C5F" stroke="#1E40AF" stroke-width="2.5"/>
        <text x="1441" y="354" font-family="JetBrains Mono" font-size="20" font-weight="700" fill="#93C5FD">04 · MULTI-CHANNEL</text>
        <text x="1441" y="410" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FFFFFF">Tunai &amp; Transfer</text>
        <text x="1441" y="458" font-family="Noto Sans" font-size="20" fill="#CBD5E1">Semua masuk 1 buku kas</text>
        <text x="1441" y="488" font-family="Noto Sans" font-size="20" fill="#CBD5E1">tanpa rekap manual.</text>

        <!-- Unified Settlement & Reconciliation Banner (stops at x=1510 for mascot dock) -->
        <rect x="100" y="560" width="1410" height="295" rx="24" fill="#FFFFFF"/>
        <text x="148" y="628" font-family="Noto Sans" font-size="32" font-weight="800" fill="#08234D">Keunggulan One Payment System SI DIKA</text>

        <rect x="148" y="660" width="410" height="158" rx="16" fill="#F3F6FB" stroke="#CBD5E1" stroke-width="2"/>
        <text x="176" y="706" font-family="Noto Sans" font-size="22" font-weight="800" fill="#EA580C">Rekonsiliasi Otomatis</text>
        <text x="176" y="746" font-family="Noto Sans" font-size="19" fill="#475569">Status lunas langsung tercatat</text>
        <text x="176" y="778" font-family="Noto Sans" font-size="19" fill="#475569">di struk &amp; laporan omzet.</text>

        <rect x="588" y="660" width="410" height="158" rx="16" fill="#F3F6FB" stroke="#CBD5E1" stroke-width="2"/>
        <text x="616" y="706" font-family="Noto Sans" font-size="22" font-weight="800" fill="#08234D">Settlement &amp; Pencairan Cepat</text>
        <text x="616" y="746" font-family="Noto Sans" font-size="19" fill="#475569">Dana tersalur ke rekening UMKM</text>
        <text x="616" y="778" font-family="Noto Sans" font-size="19" fill="#475569">dengan rincian biaya transparan.</text>

        <rect x="1028" y="660" width="438" height="158" rx="16" fill="#051633"/>
        <text x="1056" y="706" font-family="Noto Sans" font-size="22" font-weight="800" fill="#22D3EE">Siap Pembiayaan &amp; Audit</text>
        <text x="1056" y="746" font-family="Noto Sans" font-size="19" fill="#E2E8F0">Arus kas digital terverifikasi</text>
        <text x="1056" y="778" font-family="Noto Sans" font-size="19" fill="#FB923C">memperkuat skor kredit UMKM.</text>
      </svg>`,
      [{ input: logoSmall, left: 100, top: 16 }]
    )
  );

  // SCENE 5: PILAR 2 — DATABASE PELANGGAN (CRM)
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#F3F6FB"/>
        <rect width="${W}" height="104" fill="#051633"/>
        <text x="200" y="66" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FFFFFF">SI <tspan fill="#F97316">DIKA</tspan>   <tspan fill="#93C5FD" font-size="24" font-weight="500">|   PILAR 02 · DATABASE PELANGGAN (CRM)</tspan></text>

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

        <rect x="100" y="585" width="1410" height="260" rx="24" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="148" y="658" font-family="Noto Sans" font-size="32" font-weight="800" fill="#08234D">Terhubung Otomatis dengan Kasir &amp; WhatsApp</text>
        <text x="148" y="718" font-family="Noto Sans" font-size="24" fill="#475569">• Setiap belanja Rp 10.000 otomatis memberikan 1 Poin Loyalitas.</text>
        <text x="148" y="766" font-family="Noto Sans" font-size="24" fill="#475569">• Riwayat total belanja dan frekuensi kunjungan selalu terukur.</text>
        <text x="148" y="814" font-family="Noto Sans" font-size="24" fill="#475569">• Data kontak &amp; preferensi terisolasi ketat per pemilik usaha (UU PDP).</text>
      </svg>`,
      [{ input: logoSmall, left: 100, top: 16 }]
    )
  );

  // SCENE 6: PILAR 3 — PEMASARAN DIGITAL
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#051633"/>
        <rect width="${W}" height="104" fill="#08234D"/>
        <text x="200" y="66" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FFFFFF">SI <tspan fill="#F97316">DIKA</tspan>   <tspan fill="#93C5FD" font-size="24" font-weight="500">|   PILAR 03 · PEMASARAN DIGITAL &amp; VOUCHER</tspan></text>

        <text x="100" y="196" font-family="Noto Sans" font-size="52" font-weight="800" fill="#FFFFFF">Promosi Terukur, <tspan fill="#FB923C">Omzet Melejit</tspan></text>
        <text x="100" y="248" font-family="Noto Sans" font-size="25" fill="#CBD5E1">Buat kode voucher promo dan kirim kampanye personal ke segmen pelanggan yang tepat.</text>

        <rect x="100" y="305" width="720" height="245" rx="22" fill="#0B2C5F" stroke="#F97316" stroke-width="3"/>
        <text x="142" y="365" font-family="Noto Sans" font-size="21" font-weight="700" fill="#22D3EE">VOUCHER AKTIF TERINTEGRASI KASIR</text>
        <text x="142" y="452" font-family="JetBrains Mono" font-size="60" font-weight="800" fill="#FFFFFF">SIDIKA15 <tspan fill="#F97316">15% OFF</tspan></text>
        <text x="142" y="508" font-family="Noto Sans" font-size="21" fill="#CBD5E1">Promo Gajian UMKM Naik Kelas · Otomatis hitung penukaran</text>

        <rect x="100" y="585" width="720" height="245" rx="22" fill="#0B2C5F" stroke="#22D3EE" stroke-width="2"/>
        <text x="142" y="645" font-family="Noto Sans" font-size="21" font-weight="700" fill="#FB923C">VOUCHER KHUSUS MEMBER VIP</text>
        <text x="142" y="732" font-family="JetBrains Mono" font-size="52" font-weight="800" fill="#FFFFFF">VIPCUAN20 <tspan fill="#22D3EE">20% OFF</tspan></text>
        <text x="142" y="788" font-family="Noto Sans" font-size="21" fill="#CBD5E1">Apresiasi Pelanggan Setia &amp; VIP · Dorong repeat order</text>

        <rect x="860" y="305" width="960" height="370" rx="24" fill="#FFFFFF"/>
        <text x="905" y="368" font-family="Noto Sans" font-size="30" font-weight="800" fill="#08234D">Studio Broadcast WhatsApp &amp; Sosial Media</text>
        <rect x="905" y="398" width="870" height="162" rx="16" fill="#F3F6FB" stroke="#CBD5E1" stroke-width="2"/>
        <text x="938" y="445" font-family="Noto Sans" font-size="22" font-weight="700" fill="#08234D">Halo Kak Rina! Promo Gajian UMKM Naik Kelas!</text>
        <text x="938" y="488" font-family="Noto Sans" font-size="20" fill="#475569">Nikmati produk lokal pilihan dengan potongan 15%. Pakai kode SIDIKA15 di kasir!</text>
        <text x="938" y="530" font-family="Noto Sans" font-size="19" font-weight="700" fill="#EA580C">UMKM Naik Kelas, Bisnis Makin Cuan · SI DIKA</text>

        <rect x="905" y="582" width="380" height="68" rx="14" fill="#EA580C"/>
        <text x="975" y="625" font-family="Noto Sans" font-size="22" font-weight="800" fill="#FFFFFF">Kirim ke Segmen VIP</text>
        <rect x="1310" y="582" width="465" height="68" rx="14" fill="#08234D"/>
        <text x="1415" y="625" font-family="Noto Sans" font-size="22" font-weight="800" fill="#FFFFFF">Salin Caption IG / TikTok</text>

        <rect x="860" y="705" width="650" height="125" rx="20" fill="#08234D" stroke="#F97316" stroke-width="2"/>
        <text x="900" y="758" font-family="Noto Sans" font-size="23" font-weight="800" fill="#FB923C">Promosi Tepat Sasaran &amp; Hemat Biaya</text>
        <text x="900" y="800" font-family="Noto Sans" font-size="20" fill="#E2E8F0">Tanpa software tambahan — semua terhubung langsung ke CRM SI DIKA.</text>
      </svg>`,
      [{ input: logoSmall, left: 100, top: 16 }]
    )
  );

  // SCENE 7: PILAR 4 — ANALISIS PENJUALAN & TATA KELOLA 4 PERAN RBAC
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#F3F6FB"/>
        <rect width="${W}" height="104" fill="#051633"/>
        <text x="200" y="66" font-family="Noto Sans" font-size="34" font-weight="800" fill="#FFFFFF">SI <tspan fill="#F97316">DIKA</tspan>   <tspan fill="#93C5FD" font-size="24" font-weight="500">|   PILAR 04 · ANALISIS KINERJA &amp; AKSES 4 PERAN</tspan></text>

        <text x="100" y="196" font-family="Noto Sans" font-size="52" font-weight="800" fill="#08234D">Keputusan Tepat Berbasis Data &amp; Peran</text>
        <text x="100" y="246" font-family="Noto Sans" font-size="25" fill="#475569">Pantau omzet, laba kotor HPP, ekspor CSV, serta kendali 4 peran bisnis yang aman.</text>

        <rect x="100" y="295" width="405" height="145" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="135" y="342" font-family="Noto Sans" font-size="20" fill="#64748B">Omzet Real-Time</text>
        <text x="135" y="405" font-family="JetBrains Mono" font-size="40" font-weight="800" fill="#08234D">Rp 18,4 Jt</text>

        <rect x="540" y="295" width="405" height="145" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="575" y="342" font-family="Noto Sans" font-size="20" fill="#64748B">Laba Kotor HPP</text>
        <text x="575" y="405" font-family="JetBrains Mono" font-size="40" font-weight="800" fill="#059669">42,8%</text>

        <rect x="980" y="295" width="405" height="145" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="1015" y="342" font-family="Noto Sans" font-size="20" fill="#64748B">Tata Kelola Akses</text>
        <text x="1015" y="405" font-family="JetBrains Mono" font-size="40" font-weight="800" fill="#EA580C">4 Peran</text>

        <rect x="1420" y="295" width="400" height="145" rx="18" fill="#051633"/>
        <text x="1455" y="342" font-family="Noto Sans" font-size="20" fill="#93C5FD">Ekspor Pembukuan</text>
        <text x="1455" y="405" font-family="JetBrains Mono" font-size="40" font-weight="800" fill="#FB923C">Unduh CSV</text>

        <rect x="100" y="475" width="1410" height="380" rx="24" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="145" y="535" font-family="Noto Sans" font-size="28" font-weight="800" fill="#08234D">Visualisasi Tren Omzet &amp; Pemisahan Hak Akses 4 Peran</text>

        <rect x="175" y="715" width="95" height="95" rx="10" fill="#08234D"/>
        <rect x="315" y="670" width="95" height="140" rx="10" fill="#0D326B"/>
        <rect x="455" y="635" width="95" height="175" rx="10" fill="#144691"/>
        <rect x="595" y="605" width="95" height="205" rx="10" fill="#08234D"/>
        <rect x="735" y="580" width="95" height="230" rx="10" fill="#EA580C"/>
        <rect x="875" y="548" width="95" height="262" rx="10" fill="#F97316"/>
        <polyline points="222,695 362,650 502,615 642,585 782,560 922,525" fill="none" stroke="#F97316" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="922" cy="525" r="12" fill="#EA580C"/>

        <text x="1030" y="606" font-family="Noto Sans" font-size="26" font-weight="800" fill="#08234D">Zero-Trust 4 Peran RBAC</text>
        <text x="1030" y="654" font-family="Noto Sans" font-size="21" fill="#475569">• Kasir: Fokus POS &amp; tambah pelanggan</text>
        <text x="1030" y="698" font-family="Noto Sans" font-size="21" fill="#475569">• Pemilik: Penuh toko, stok &amp; undang kasir</text>
        <text x="1030" y="742" font-family="Noto Sans" font-size="21" fill="#475569">• Admin Pusat: Pantau nasional &amp; tinjau toko</text>
        <text x="1030" y="786" font-family="Noto Sans" font-size="21" font-weight="700" fill="#EA580C">• Super Admin: Kontrol penuh &amp; audit log</text>
      </svg>`,
      [{ input: logoSmall, left: 100, top: 16 }]
    )
  );

  // SCENE 8: CLOSING CTA
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g8" cx="50%" cy="32%" r="55%">
            <stop offset="0%" stop-color="#144691" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#051633" stop-opacity="1"/>
          </radialGradient>
        </defs>
        <rect width="${W}" height="${H}" fill="#051633"/>
        <rect width="${W}" height="${H}" fill="url(#g8)"/>

        <text x="960" y="608" text-anchor="middle" font-family="Noto Sans" font-size="110" font-weight="800" fill="#FFFFFF">SI <tspan fill="#F97316">DIKA</tspan></text>
        <text x="960" y="670" text-anchor="middle" font-family="Noto Sans" font-size="34" font-weight="700" fill="#DBEAFE">Sistem Kasir, Inventori &amp; One Payment System</text>

        <rect x="1360" y="110" width="450" height="148" rx="22" fill="#08234D" fill-opacity="0.92" stroke="#1E40AF" stroke-width="2.5"/>
        <rect x="1384" y="128" width="112" height="112" rx="16" fill="#FFFFFF"/>
        <text x="1518" y="166" font-family="Noto Sans" font-size="16" font-weight="800" fill="#22D3EE" letter-spacing="2">BEKERJA SAMA DENGAN</text>
        <text x="1518" y="202" font-family="Noto Sans" font-size="26" font-weight="800" fill="#FFFFFF">KADIN INDONESIA</text>
        <text x="1518" y="228" font-family="Noto Sans" font-size="15" fill="#93C5FD">Kamar Dagang &amp; Industri</text>

        <text x="960" y="726" text-anchor="middle" font-family="Noto Sans" font-size="26" fill="#CBD5E1">Mari Bersinergi Bersama Kamar Dagang dan Industri Indonesia</text>

        <rect x="400" y="770" width="1120" height="88" rx="20" fill="#08234D" stroke="#F97316" stroke-width="3"/>
        <text x="960" y="828" text-anchor="middle" font-family="Noto Sans" font-size="42" font-weight="800" fill="#FFFFFF">UMKM Naik Kelas   <tspan fill="#64748B">|</tspan>   <tspan fill="#FB923C">Bisnis Makin Cuan</tspan></text>
      </svg>`,
      [{ input: kadinLogoClosing, left: 1388, top: 132 }]
    )
  );

  return plates;
}

console.log('1/5 Synthesizing Indonesian Neural Voiceover for SI DIKA (8 scenes)...');
const sceneVoices = [];
for (let i = 0; i < SCENE_SCRIPTS.length; i++) {
  const sc = SCENE_SCRIPTS[i];
  const mp3Path = path.join(TMP_DIR, `${sc.id}_raw.mp3`);
  const wavPath = path.join(TMP_DIR, `${sc.id}_voice.wav`);
  const engine = await synthesizeSpeechMp3(sc.narration, mp3Path);
  const voiceMeta = prepareSceneVoice(mp3Path, wavPath, LEAD_PAD, TAIL_PAD);
  console.log(`   [${sc.id}] ${engine} -> ${voiceMeta.duration.toFixed(2)}s (${voiceMeta.totalFrames} frames)`);
  sceneVoices.push({ ...sc, wavPath, ...voiceMeta });
}

console.log('2/5 Aligning master narration audio track & ducked corporate soundtrack...');
const alignedVoiceWavs = [];
const sceneFrameCounts = [];
for (let i = 0; i < sceneVoices.length; i++) {
  const sv = sceneVoices[i];
  const isLast = i === sceneVoices.length - 1;
  sceneFrameCounts.push(sv.totalFrames);
  const outAligned = path.join(TMP_DIR, `${sv.id}_aligned.wav`);
  if (!isLast) {
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
execFileSync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', concatList, '-c', 'copy', masterVoiceWav], {
  stdio: 'ignore',
});

const totalVideoFrames =
  sceneFrameCounts.reduce((acc, n) => acc + n, 0) - (sceneVoices.length - 1) * FADE_FRAMES;
const totalVideoDur = totalVideoFrames / FPS;
console.log(`   Master timeline: ${totalVideoFrames} frames (${totalVideoDur.toFixed(2)}s @ ${FPS}fps)`);

const musicWav = path.join(TMP_DIR, 'music.wav');
generateBackgroundAudio(musicWav, totalVideoDur + 0.5);

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

console.log('3/5 Pre-rendering animated talking SI DIKA sprites & scene plates...');
const spritesDock = await createMascotSpriteSet(300);
const spritesHero = await createMascotSpriteSet(380);
const scenePlates = await buildScenePlates();

const sceneSubtitles = [];
for (const sc of sceneVoices) {
  const subs = [];
  for (const line of sc.subtitles) {
    subs.push(await renderSubtitleOverlay(line, sc.mode));
  }
  sceneSubtitles.push(subs);
}

// Export crisp 16:9 poster image from Scene 1
{
  const posterBuf = Buffer.allocUnsafe(W * H * 3);
  scenePlates[0].copy(posterBuf);
  const heroSprite = spritesHero[0][0];
  alphaBlendRGBAOntoRGB(
    posterBuf,
    W,
    H,
    heroSprite.data,
    heroSprite.width,
    heroSprite.height,
    Math.round(1585 - heroSprite.width / 2),
    Math.round(435 - heroSprite.height / 2)
  );
  drawVoiceEqualizer(posterBuf, 1585, 855, 0.35, 1.2);
  await sharp(posterBuf, { raw: { width: W, height: H, channels: 3 } })
    .resize(1280, 720)
    .png({ compressionLevel: 8 })
    .toFile(OUT_POSTER);
  console.log('   Saved SI DIKA 16:9 video poster:', OUT_POSTER);
}

function renderAnimatedSceneFrame(outBuf, sceneIdx, localFrame) {
  const sv = sceneVoices[sceneIdx];
  const plate = scenePlates[sceneIdx];
  plate.copy(outBuf);

  const fClamped = Math.min(sv.totalFrames - 1, Math.max(0, localFrame));
  const t = fClamped / FPS;
  const rms = sv.rms[fClamped];

  let mouthState = 0;
  if (rms > 0.68) mouthState = 4;
  else if (rms > 0.44) mouthState = 3;
  else if (rms > 0.24) mouthState = 2;
  else if (rms > 0.11) mouthState = 1;
  else mouthState = 0;

  if (mouthState >= 2 && fClamped % 4 === 0 && rms < 0.78) {
    mouthState = Math.max(1, mouthState - 1);
  }

  const blinkCycle = fClamped % Math.round(3.2 * FPS);
  const blinkState = blinkCycle >= 68 && blinkCycle <= 70 ? 1 : 0;
  const bobY = Math.round(Math.sin(t * 4.2) * 5 - rms * 7);

  if (sv.mode === 'hero-right') {
    const sprite = spritesHero[blinkState][mouthState];
    const centerX = 1585;
    const centerY = 435 + bobY;
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

console.log('4/5 Streaming SI DIKA animated lip-synced Full HD frames into FFmpeg...');
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
    '22',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '160k',
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

  for (let f = startF; f < bodyEndF; f++) {
    renderAnimatedSceneFrame(frameBufA, s, f);
    await writeFrame(frameBufA);
    writtenFrames++;
  }

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
  console.log(`   Encoded SI DIKA scene ${s + 1}/${sceneVoices.length} (${writtenFrames}/${totalVideoFrames} frames)`);
}

ffmpeg.stdin.end();
await new Promise((resolve, reject) => {
  ffmpeg.on('close', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`FFmpeg exited ${code}: ${ffmpegErr.slice(-800)}`));
  });
});

fs.rmSync(TMP_DIR, { recursive: true, force: true });
const finalDur = getAudioDuration(OUT_MP4);
const sizeMb = (fs.statSync(OUT_MP4).size / (1024 * 1024)).toFixed(2);
console.log(`5/5 DONE! SI DIKA Video saved: ${OUT_MP4} (${finalDur.toFixed(1)}s, ${sizeMb} MB)`);
process.exit(0);
