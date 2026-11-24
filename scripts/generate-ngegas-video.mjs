import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import sharp from 'sharp';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const ROOT = process.cwd();
const TMP_DIR = path.join(ROOT, '.tmp_video_ngegas');
const OUT_MP4 = path.join(ROOT, 'public/downloads/Video_Promosi_NgeGas.mp4');
const OUT_POSTER = path.join(ROOT, 'public/images/video-poster-ngegas.png');
const KADIN_LOGO = path.join(ROOT, 'public/assets/aistudio/image_33c655e3.png');
const LOGO_IMG = path.join(ROOT, 'public/images/si-kadi-logo.jpg');

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
    id: 'ng_scene1',
    mode: 'hero-right',
    narration:
      'Halo Bapak dan Ibu Pimpinan Perusahaan! Perkenalkan ngeGas, Super-app Ekosistem Desa dan Daerah. Ojek, makanan, dan kirim barang di sekitarmu — tinggal ngeGas! Menghubungkan warga, mitra driver, dan warung lokal dalam satu platform terpadu.',
    subtitles: [
      'Perkenalkan ngeGas! — Super-app Ekosistem Desa & Daerah.',
      'Ojek, makanan, dan kirim barang di sekitarmu. Tinggal ngeGas!',
      'Menghubungkan warga, mitra driver, dan warung lokal dalam satu platform terpadu.',
    ],
  },
  {
    id: 'ng_scene2',
    mode: 'dock',
    narration:
      'Dalam satu aplikasi, warga dapat memesan GasMotor untuk ojek antar jemput dari dusun hingga pusat kecamatan, GasMobil untuk perjalanan keluarga, serta GasMakan langsung dari warung dan toko lokal terdekat.',
    subtitles: [
      'GasMotor: Ojek motor dari dusun sampai pusat kecamatan dengan tarif jelas.',
      'GasMobil: Antar jemput keluarga atau membawa barang lebih banyak.',
      'GasMakan: Pesan makanan langsung dari warung & toko lokal di sekitarmu.',
    ],
  },
  {
    id: 'ng_scene3',
    mode: 'dock',
    narration:
      'NgeGas juga menggerakkan ekonomi desa lewat GasKirim untuk pengiriman barang, GasAngkut armada pickup dan truk kecil pengangkut hasil panen, serta GasBelanja dari Koperasi, BUMDes, dan warung terdekat terhubung dengan One Payment System.',
    subtitles: [
      'GasKirim & GasAngkut: Kirim paket hingga angkut hasil panen (pickup & truk kecil).',
      'GasBelanja: Belanja kebutuhan harian dari Koperasi, BUMDes & warung lokal.',
      'Terintegrasi pembayaran GasPay & One Payment System ekosistem SI DIKA.',
    ],
  },
  {
    id: 'ng_scene4',
    mode: 'dock',
    narration:
      'Pemilik warung, koperasi, dan BUMDes dapat mengelola menu, jam buka, hingga membantu pemesanan warga tanpa HP. Sementara mitra driver lokal bebas memilih zona kerja motor atau mobil dengan ringkasan pendapatan harian transparan.',
    subtitles: [
      'Mitra Usaha (Warung, Koperasi, BUMDes): Kelola menu & bantu warga tanpa HP.',
      'Mitra Driver Lokal: Pilih zona kerja motor/mobil, online-offline fleksibel.',
      'Pendapatan harian tercatat transparan langsung di aplikasi Mitra Driver.',
    ],
  },
  {
    id: 'ng_scene5',
    mode: 'dock',
    narration:
      'Keunggulan utama ngeGas adalah pengaturan presisi per zona wilayah. Layanan, tarif, dan jam operasional disesuaikan tiap daerah dengan persetujuan dua staf, verifikasi KTP, SIM, dan STNK driver, pantauan GPS langsung, serta tombol SOS darurat.',
    subtitles: [
      'Layanan, tarif & jam operasional diatur presisi untuk setiap zona wilayah.',
      'Driver terverifikasi KTP, SIM, STNK & selfie oleh tim Kantor Pusat.',
      'Pantau perjalanan GPS langsung, tombol SOS darurat & tarif berjejak audit.',
    ],
  },
  {
    id: 'ng_scene6',
    mode: 'hero-center',
    narration:
      'Mari wujudkan kemandirian ekonomi desa dan daerah bersama ngeGas, SI DIKA, dan One Payment System, bekerja sama dengan KADIN Indonesia. Ojek, makanan, dan kirim barang di sekitarmu — tinggal ngeGas!',
    subtitles: [
      'Sinergi ngeGas! × SI DIKA × One Payment System bersama KADIN Indonesia.',
      'Membangun ekosistem transportasi, logistik & UMKM desa dan daerah.',
      'Ojek, makanan, dan kirim barang di sekitarmu. Tinggal ngeGas!',
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

// Energetic upbeat modern mobility soundtrack (brighter major progression)
function generateUpbeatBackgroundAudio(outWavPath, totalSeconds) {
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
    [293.66, 369.99, 440.0, 554.37], // Dmaj7
    [220.0, 329.63, 440.0, 493.88], // Aadd9
    [246.94, 293.66, 369.99, 440.0], // Bm7
    [196.0, 293.66, 369.99, 392.0], // Gmaj7
  ];
  const arpeggio = [587.33, 739.99, 880.0, 739.99, 659.25, 739.99, 880.0, 987.77];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.floor(t / 3.5) % chords.length;
    const chord = chords[chordIdx];
    const chordLocalT = t % 3.5;
    const chordEnv = Math.min(1, chordLocalT / 0.2) * Math.min(1, (3.5 - chordLocalT) / 0.3);

    let padL = 0;
    let padR = 0;
    for (let c = 0; c < chord.length; c++) {
      const f = chord[c];
      const v = Math.sin(2 * Math.PI * f * t) + 0.16 * Math.sin(2 * Math.PI * f * 2 * t);
      padL += v * (c % 2 === 0 ? 0.09 : 0.05);
      padR += v * (c % 2 === 1 ? 0.09 : 0.05);
    }

    const stepIdx = Math.floor(t * 2.5) % arpeggio.length;
    const stepT = (t * 2.5) % 1;
    const pluckEnv = Math.exp(-stepT * 6.0);
    const pluck = Math.sin(2 * Math.PI * arpeggio[stepIdx] * t) * pluckEnv * 0.09;

    const beatT = t % 0.45;
    const bass = Math.sin(2 * Math.PI * (chord[0] * 0.5) * t) * Math.exp(-beatT * 6.5) * 0.14;

    const fadeIn = Math.min(1, t / 1.2);
    const fadeOut = Math.min(1, Math.max(0, (totalSeconds - t) / 2.0));
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

  // ngeGas Red & Electric Blue accent ring
  const ringFrameSvg = Buffer.from(
    `<svg width="${targetSize}" height="${targetSize}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${r}" cy="${r}" r="${r - borderWidth / 2 - 2}" fill="none" stroke="#EF4444" stroke-width="${borderWidth}"/>
      <circle cx="${r}" cy="${r}" r="${r - borderWidth - 4}" fill="none" stroke="#38BDF8" stroke-width="2.5" stroke-opacity="0.85"/>
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
      <rect x="2" y="2" width="${boxW - 4}" height="${boxH - 4}" rx="20" fill="#051633" fill-opacity="0.94" stroke="#EF4444" stroke-width="3"/>
      <rect x="18" y="20" width="8" height="${boxH - 40}" rx="4" fill="#38BDF8"/>
      <text x="44" y="42" font-family="Noto Sans" font-size="18" font-weight="800" fill="#38BDF8" letter-spacing="2">ngeGas! · SUPER-APP EKOSISTEM DESA &amp; DAERAH · GAZZKEUN.CLOUD</text>
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
    const isRed = i % 2 === 1;
    drawFilledRectAlpha(
      dstRGB,
      W,
      H,
      bx,
      by,
      barW,
      bh,
      isRed ? 239 : 56,
      isRed ? 68 : 189,
      isRed ? 68 : 248,
      0.96
    );
  }
}

async function renderSceneRGB(svgMarkup, overlays = []) {
  const base = sharp(Buffer.from(svgMarkup)).resize(W, H);
  if (overlays.length > 0) base.composite(overlays);
  return base.removeAlpha().raw().toBuffer();
}

async function buildScenePlates() {
  const kadinLogoCard = await sharp(KADIN_LOGO)
    .resize(175, 175, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const kadinLogoClosing = await sharp(KADIN_LOGO)
    .resize(104, 104, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const plates = [];

  // SCENE 1: OPENING REVEAL — ngeGas! SUPER-APP EKOSISTEM DESA & DAERAH
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ng1" cx="72%" cy="44%" r="60%">
            <stop offset="0%" stop-color="#153B75" stop-opacity="0.88"/>
            <stop offset="100%" stop-color="#051633" stop-opacity="1"/>
          </radialGradient>
        </defs>
        <rect width="${W}" height="${H}" fill="#051633"/>
        <rect width="${W}" height="${H}" fill="url(#ng1)"/>
        <rect x="0" y="0" width="20" height="${H}" fill="#EF4444"/>

        <text x="100" y="138" font-family="Noto Sans" font-size="22" font-weight="800" fill="#38BDF8" letter-spacing="3">SUPER-APP EKOSISTEM DESA &amp; DAERAH · GAZZKEUN.CLOUD</text>
        <text x="100" y="275" font-family="Noto Sans" font-size="132" font-weight="800" fill="#EF4444">nge<tspan fill="#38BDF8">Gas!</tspan></text>
        <text x="100" y="348" font-family="Noto Sans" font-size="38" font-weight="700" fill="#FFFFFF">Ojek, makanan, dan kirim barang di sekitarmu.</text>
        <text x="100" y="404" font-family="Noto Sans" font-size="25" fill="#CBD5E1">Menghubungkan warga, mitra driver, dan warung lokal dalam satu platform.</text>
        <text x="100" y="442" font-family="Noto Sans" font-size="25" fill="#CBD5E1">Layanan, tarif &amp; jam operasional diatur presisi untuk setiap zona wilayah.</text>

        <!-- Live Telemetry Route Map Card (inspired by gazzkeun.cloud) -->
        <rect x="100" y="492" width="770" height="398" rx="26" fill="#08234D" stroke="#38BDF8" stroke-width="2.5"/>
        <text x="136" y="540" font-family="JetBrains Mono" font-size="18" font-weight="700" fill="#38BDF8">TELEMETRI LANGSUNG · ZONA CIWIDEY BARAT</text>
        <text x="645" y="540" font-family="JetBrains Mono" font-size="18" font-weight="700" fill="#10B981">GPS 100% AKURAT</text>
        <!-- Stylized Grid & Route SVG -->
        <rect x="136" y="562" width="698" height="198" rx="18" fill="#051633" stroke="#1E3A8A" stroke-width="1.5"/>
        <line x1="136" y1="628" x2="834" y2="628" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1"/>
        <line x1="136" y1="694" x2="834" y2="694" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1"/>
        <line x1="310" y1="562" x2="310" y2="760" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1"/>
        <line x1="485" y1="562" x2="485" y2="760" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1"/>
        <line x1="660" y1="562" x2="660" y2="760" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1"/>
        <path d="M 190 715 C 290 708, 390 658, 495 642" fill="none" stroke="#38BDF8" stroke-width="7" stroke-linecap="round"/>
        <path d="M 495 642 C 590 626, 670 605, 760 595" fill="none" stroke="#EF4444" stroke-width="7" stroke-linecap="round"/>
        <circle cx="190" cy="715" r="12" fill="#38BDF8" stroke="#FFFFFF" stroke-width="3"/>
        <circle cx="495" cy="642" r="26" fill="none" stroke="#38BDF8" stroke-opacity="0.45" stroke-width="2"/>
        <circle cx="495" cy="642" r="10" fill="#F97316" stroke="#FFFFFF" stroke-width="3"/>
        <circle cx="760" cy="595" r="12" fill="#EF4444" stroke="#FFFFFF" stroke-width="3"/>
        <text x="160" y="746" font-family="Noto Sans" font-size="16" font-weight="700" fill="#93C5FD">Warung Bu Dewi</text>
        <text x="645" y="630" font-family="Noto Sans" font-size="16" font-weight="700" fill="#FCA5A5">Jl. Raya Ciwidey</text>

        <text x="136" y="808" font-family="Noto Sans" font-size="22" font-weight="800" fill="#FFFFFF">Budi Santoso (Driver ★ 4.9) · Honda Vario 125</text>
        <text x="136" y="848" font-family="JetBrains Mono" font-size="22" font-weight="700" fill="#38BDF8">± 6 menit   <tspan fill="#64748B">|</tspan>   <tspan fill="#FB923C">Rp 12.000 (GasPay / One Payment)</tspan></text>

        <!-- KADIN Cooperation Card -->
        <rect x="910" y="492" width="390" height="398" rx="28" fill="#08234D" stroke="#1E40AF" stroke-width="2.5"/>
        <text x="1105" y="544" text-anchor="middle" font-family="Noto Sans" font-size="18" font-weight="800" fill="#38BDF8" letter-spacing="2.5">BEKERJA SAMA DENGAN</text>
        <rect x="1002" y="570" width="206" height="206" rx="22" fill="#FFFFFF" fill-opacity="0.96"/>
        <text x="1105" y="822" text-anchor="middle" font-family="Noto Sans" font-size="24" font-weight="800" fill="#FFFFFF">KADIN INDONESIA</text>
        <text x="1105" y="856" text-anchor="middle" font-family="Noto Sans" font-size="16" fill="#93C5FD">Ekosistem SI DIKA &amp; ngeGas!</text>

        <!-- Right Hero Stage Panel for Animated Talking Presenter -->
        <rect x="1340" y="120" width="490" height="770" rx="36" fill="#08234D" fill-opacity="0.9" stroke="#EF4444" stroke-width="3"/>
        <text x="1585" y="185" text-anchor="middle" font-family="Noto Sans" font-size="21" font-weight="800" fill="#38BDF8" letter-spacing="3">PRESENTER EKOSISTEM</text>
        <text x="1585" y="746" text-anchor="middle" font-family="Noto Sans" font-size="44" font-weight="800" fill="#EF4444">nge<tspan fill="#38BDF8">Gas!</tspan></text>
        <text x="1585" y="788" text-anchor="middle" font-family="Noto Sans" font-size="21" font-weight="600" fill="#FFFFFF">Tinggal ngeGas!</text>
      </svg>`,
      [{ input: kadinLogoCard, left: 1018, top: 585 }]
    )
  );

  // SCENE 2: LAYANAN UTAMA HARIAN — GasMotor, GasMobil, GasMakan
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#F3F6FB"/>
        <rect width="${W}" height="104" fill="#051633"/>
        <text x="100" y="66" font-family="Noto Sans" font-size="38" font-weight="800" fill="#EF4444">nge<tspan fill="#38BDF8">Gas!</tspan>   <tspan fill="#CBD5E1" font-size="24" font-weight="500">|   LAYANAN UTAMA SEHARI-HARI</tspan></text>

        <text x="100" y="196" font-family="Noto Sans" font-size="52" font-weight="800" fill="#08234D">Satu Aplikasi untuk Kebutuhan Warga</text>
        <text x="100" y="246" font-family="Noto Sans" font-size="25" fill="#475569">Pesan transportasi dan makanan dari warung sekitar — ongkos tampil jelas sebelum memesan.</text>

        <!-- 3 Primary Service Cards -->
        <rect x="100" y="295" width="545" height="285" rx="22" fill="#FFFFFF" stroke="#EF4444" stroke-width="3"/>
        <text x="140" y="352" font-family="JetBrains Mono" font-size="20" font-weight="700" fill="#EF4444">LAYANAN UTAMA 01</text>
        <text x="140" y="416" font-family="Noto Sans" font-size="44" font-weight="800" fill="#08234D">GasMotor</text>
        <text x="140" y="466" font-family="Noto Sans" font-size="22" fill="#475569">Ojek motor antar jemput jarak dekat,</text>
        <text x="140" y="500" font-family="Noto Sans" font-size="22" fill="#475569">dari dusun sampai pusat kecamatan.</text>
        <text x="140" y="544" font-family="Noto Sans" font-size="19" font-weight="700" fill="#059669">✓ Pantau langsung &amp; tombol SOS</text>

        <rect x="685" y="295" width="545" height="285" rx="22" fill="#FFFFFF" stroke="#2563EB" stroke-width="3"/>
        <text x="725" y="352" font-family="JetBrains Mono" font-size="20" font-weight="700" fill="#2563EB">LAYANAN UTAMA 02</text>
        <text x="725" y="416" font-family="Noto Sans" font-size="44" font-weight="800" fill="#08234D">GasMobil</text>
        <text x="725" y="466" font-family="Noto Sans" font-size="22" fill="#475569">Berangkat bersama keluarga atau</text>
        <text x="725" y="500" font-family="Noto Sans" font-size="22" fill="#475569">membawa barang lebih banyak.</text>
        <text x="725" y="544" font-family="Noto Sans" font-size="19" font-weight="700" fill="#2563EB">✓ Driver terdekat mendapat tawaran dulu</text>

        <rect x="1270" y="295" width="550" height="285" rx="22" fill="#051633"/>
        <text x="1310" y="352" font-family="JetBrains Mono" font-size="20" font-weight="700" fill="#FB923C">LAYANAN UTAMA 03</text>
        <text x="1310" y="416" font-family="Noto Sans" font-size="44" font-weight="800" fill="#FFFFFF">GasMakan</text>
        <text x="1310" y="466" font-family="Noto Sans" font-size="22" fill="#CBD5E1">Pesan dari warung &amp; toko sekitarmu.</text>
        <text x="1310" y="500" font-family="Noto Sans" font-size="22" fill="#CBD5E1">Toko menyiapkan, driver mengantar.</text>
        <text x="1310" y="544" font-family="Noto Sans" font-size="19" font-weight="700" fill="#38BDF8">✓ Terhubung kasir UMKM SI DIKA</text>

        <!-- 4-Step Flow Strip (stops at x=1510 for mascot dock) -->
        <rect x="100" y="615" width="1410" height="240" rx="24" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <text x="145" y="675" font-family="Noto Sans" font-size="28" font-weight="800" fill="#08234D">Pesan Cepat dalam 4 Langkah Mudah</text>

        <rect x="145" y="706" width="310" height="118" rx="16" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
        <text x="170" y="746" font-family="JetBrains Mono" font-size="20" font-weight="800" fill="#EF4444">01. Pilih Layanan</text>
        <text x="170" y="788" font-family="Noto Sans" font-size="18" fill="#475569">Ojek, mobil, atau makanan</text>

        <rect x="478" y="706" width="310" height="118" rx="16" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
        <text x="503" y="746" font-family="JetBrains Mono" font-size="20" font-weight="800" fill="#2563EB">02. Lihat Ongkos</text>
        <text x="503" y="788" font-family="Noto Sans" font-size="18" fill="#475569">Tarif transparan per zona</text>

        <rect x="811" y="706" width="310" height="118" rx="16" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
        <text x="836" y="746" font-family="JetBrains Mono" font-size="20" font-weight="800" fill="#EA580C">03. Driver Jemput</text>
        <text x="836" y="788" font-family="Noto Sans" font-size="18" fill="#475569">Tawaran ke driver terdekat</text>

        <rect x="1144" y="706" width="330" height="118" rx="16" fill="#051633"/>
        <text x="1169" y="746" font-family="JetBrains Mono" font-size="20" font-weight="800" fill="#38BDF8">04. Pantau &amp; Nilai</text>
        <text x="1169" y="788" font-family="Noto Sans" font-size="18" fill="#E2E8F0">Ikuti posisi driver di peta</text>
      </svg>`
    )
  );

  // SCENE 3: EKOSISTEM EKONOMI DESA — GasKirim, GasAngkut, GasBelanja + One Payment
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#051633"/>
        <rect width="${W}" height="104" fill="#08234D"/>
        <text x="100" y="66" font-family="Noto Sans" font-size="38" font-weight="800" fill="#EF4444">nge<tspan fill="#38BDF8">Gas!</tspan>   <tspan fill="#93C5FD" font-size="24" font-weight="500">|   LOGISTIK, HASIL PANEN &amp; EKONOMI DESA</tspan></text>

        <text x="100" y="196" font-family="Noto Sans" font-size="52" font-weight="800" fill="#FFFFFF">Menggerakkan <tspan fill="#38BDF8">Logistik &amp; Ekonomi Lokal</tspan></text>
        <text x="100" y="248" font-family="Noto Sans" font-size="25" fill="#CBD5E1">Menghubungkan petani, Koperasi, BUMDes, dan warung rakyat dalam rantai distribusi modern.</text>

        <rect x="100" y="305" width="545" height="270" rx="22" fill="#0B2C5F" stroke="#38BDF8" stroke-width="2.5"/>
        <text x="140" y="362" font-family="JetBrains Mono" font-size="20" font-weight="700" fill="#38BDF8">LOGISTIK CEPAT</text>
        <text x="140" y="426" font-family="Noto Sans" font-size="44" font-weight="800" fill="#FFFFFF">GasKirim</text>
        <text x="140" y="478" font-family="Noto Sans" font-size="22" fill="#CBD5E1">Kirim barang langsung dari rumah</text>
        <text x="140" y="514" font-family="Noto Sans" font-size="22" fill="#CBD5E1">atau dari titik mitra desa terdekat.</text>

        <rect x="685" y="305" width="545" height="270" rx="22" fill="#0B2C5F" stroke="#F97316" stroke-width="2.5"/>
        <text x="725" y="362" font-family="JetBrains Mono" font-size="20" font-weight="700" fill="#FB923C">ARMADA HASIL PANEN</text>
        <text x="725" y="426" font-family="Noto Sans" font-size="44" font-weight="800" fill="#FFFFFF">GasAngkut</text>
        <text x="725" y="478" font-family="Noto Sans" font-size="22" fill="#CBD5E1">Armada pickup, bak &amp; truk kecil</text>
        <text x="725" y="514" font-family="Noto Sans" font-size="22" fill="#CBD5E1">tarif per perjalanan atau per karung.</text>

        <rect x="1270" y="305" width="550" height="270" rx="22" fill="#0B2C5F" stroke="#EF4444" stroke-width="2.5"/>
        <text x="1310" y="362" font-family="JetBrains Mono" font-size="20" font-weight="700" fill="#FCA5A5">KOPERASI &amp; BUMDES</text>
        <text x="1310" y="426" font-family="Noto Sans" font-size="44" font-weight="800" fill="#FFFFFF">GasBelanja</text>
        <text x="1310" y="478" font-family="Noto Sans" font-size="22" fill="#CBD5E1">Belanja kebutuhan dari Koperasi,</text>
        <text x="1310" y="514" font-family="Noto Sans" font-size="22" fill="#CBD5E1">BUMDes &amp; warung lokal sampai rumah.</text>

        <!-- Synergy Box (stops at x=1510) -->
        <rect x="100" y="612" width="1410" height="240" rx="24" fill="#FFFFFF"/>
        <text x="148" y="678" font-family="Noto Sans" font-size="32" font-weight="800" fill="#08234D">Sinergi ngeGas! × SI DIKA × One Payment System</text>
        <text x="148" y="732" font-family="Noto Sans" font-size="23" fill="#475569">• Pembayaran terintegrasi lewat GasPay, QRIS, Virtual Account &amp; Tunai.</text>
        <text x="148" y="776" font-family="Noto Sans" font-size="23" fill="#475569">• Pesanan warung &amp; Koperasi langsung sinkron ke stok dan pembukuan SI DIKA.</text>
        <text x="148" y="820" font-family="Noto Sans" font-size="23" font-weight="700" fill="#EA580C">• Perputaran ekonomi tetap berada di desa &amp; daerah setempat.</text>
      </svg>`
    )
  );

  // SCENE 4: MITRA USAHA & MITRA DRIVER LOKAL
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#F3F6FB"/>
        <rect width="${W}" height="104" fill="#051633"/>
        <text x="100" y="66" font-family="Noto Sans" font-size="38" font-weight="800" fill="#EF4444">nge<tspan fill="#38BDF8">Gas!</tspan>   <tspan fill="#CBD5E1" font-size="24" font-weight="500">|   MITRA USAHA &amp; MITRA DRIVER LOKAL</tspan></text>

        <text x="100" y="196" font-family="Noto Sans" font-size="52" font-weight="800" fill="#08234D">Tumbuh Bersama Mitra di Daerahmu</text>
        <text x="100" y="246" font-family="Noto Sans" font-size="25" fill="#475569">Memberdayakan warung rakyat, Koperasi, BUMDes, serta pengemudi lokal terverifikasi.</text>

        <!-- Left Card: Mitra Usaha -->
        <rect x="100" y="295" width="760" height="550" rx="24" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <rect x="100" y="295" width="760" height="84" rx="24" fill="#051633"/>
        <text x="140" y="348" font-family="Noto Sans" font-size="28" font-weight="800" fill="#FFFFFF">Untuk Mitra Usaha, Koperasi &amp; BUMDes</text>

        <text x="140" y="438" font-family="Noto Sans" font-size="24" font-weight="800" fill="#EA580C">01. Jangkau Pembeli Lebih Luas</text>
        <text x="140" y="476" font-family="Noto Sans" font-size="21" fill="#475569">Terima pesanan GasMakan &amp; GasBelanja; tandai siap, driver jemput.</text>

        <text x="140" y="544" font-family="Noto Sans" font-size="24" font-weight="800" fill="#08234D">02. Kelola Menu &amp; Jam Buka Sendiri</text>
        <text x="140" y="582" font-family="Noto Sans" font-size="21" fill="#475569">Kontrol penuh ketersediaan produk &amp; jam operasional dari aplikasi.</text>

        <text x="140" y="650" font-family="Noto Sans" font-size="24" font-weight="800" fill="#059669">03. Inklusif — Bantu Warga Tanpa HP</text>
        <text x="140" y="688" font-family="Noto Sans" font-size="21" fill="#475569">Mitra Usaha dapat memasukkan pesanan bagi warga yang belum punya HP.</text>

        <text x="140" y="756" font-family="Noto Sans" font-size="24" font-weight="800" fill="#2563EB">04. Terverifikasi Resmi Kantor Pusat</text>
        <text x="140" y="794" font-family="Noto Sans" font-size="21" fill="#475569">Seluruh toko diverifikasi tim ngeGas sebelum mulai melayani warga.</text>

        <!-- Right Card: Mitra Driver (height clears bottom-right mascot dock) -->
        <rect x="900" y="295" width="920" height="395" rx="24" fill="#08234D" stroke="#38BDF8" stroke-width="2.5"/>
        <text x="945" y="356" font-family="Noto Sans" font-size="28" font-weight="800" fill="#38BDF8">Untuk Mitra Driver Lokal (Motor &amp; Mobil)</text>
        <text x="945" y="418" font-family="Noto Sans" font-size="23" font-weight="700" fill="#FFFFFF">• Pilih Zona Kerja di Wilayah yang Kamu Kenal</text>
        <text x="945" y="468" font-family="Noto Sans" font-size="23" font-weight="700" fill="#FFFFFF">• Bebas Atur Waktu Online &amp; Offline Sesukamu</text>
        <text x="945" y="518" font-family="Noto Sans" font-size="23" font-weight="700" fill="#FFFFFF">• Ringkasan Pendapatan Harian Transparan di Aplikasi</text>
        <text x="945" y="568" font-family="Noto Sans" font-size="23" font-weight="700" fill="#FB923C">• Pendaftaran Resmi: KTP, SIM, STNK &amp; Foto Selfie</text>
        <text x="945" y="628" font-family="Noto Sans" font-size="20" fill="#CBD5E1">Disetujui tim Kantor Pusat dengan standar privasi data yang ketat.</text>

        <!-- Compact Callout Left of Mascot Dock -->
        <rect x="900" y="718" width="610" height="127" rx="20" fill="#FFFFFF" stroke="#EF4444" stroke-width="2.5"/>
        <text x="940" y="770" font-family="Noto Sans" font-size="23" font-weight="800" fill="#EF4444">Membuka Lapangan Kerja di Daerah</text>
        <text x="940" y="810" font-family="Noto Sans" font-size="20" fill="#475569">Driver &amp; warung lokal menjadi penggerak utama ekonomi wilayah.</text>
      </svg>`
    )
  );

  // SCENE 5: PRESISI PER ZONA & KEAMANAN BERLAPIS
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#051633"/>
        <rect width="${W}" height="104" fill="#08234D"/>
        <text x="100" y="66" font-family="Noto Sans" font-size="38" font-weight="800" fill="#EF4444">nge<tspan fill="#38BDF8">Gas!</tspan>   <tspan fill="#93C5FD" font-size="24" font-weight="500">|   PRESISI ZONA &amp; KEAMANAN BERLAPIS</tspan></text>

        <text x="100" y="196" font-family="Noto Sans" font-size="52" font-weight="800" fill="#FFFFFF">Dibuat Supaya Warga <tspan fill="#38BDF8">Tenang &amp; Aman</tspan></text>
        <text x="100" y="248" font-family="Noto Sans" font-size="25" fill="#CBD5E1">Tata kelola wilayah transparan, verifikasi identitas ketat, dan perlindungan perjalanan.</text>

        <rect x="100" y="305" width="405" height="240" rx="20" fill="#0B2C5F" stroke="#38BDF8" stroke-width="2.5"/>
        <text x="135" y="362" font-family="JetBrains Mono" font-size="19" font-weight="700" fill="#38BDF8">01 · PRESISI ZONA</text>
        <text x="135" y="420" font-family="Noto Sans" font-size="30" font-weight="800" fill="#FFFFFF">Tarif per Zona</text>
        <text x="135" y="472" font-family="Noto Sans" font-size="20" fill="#CBD5E1">Layanan, ongkos &amp; jam buka</text>
        <text x="135" y="506" font-family="Noto Sans" font-size="20" fill="#CBD5E1">sesuai karakteristik wilayah.</text>

        <rect x="535" y="305" width="405" height="240" rx="20" fill="#0B2C5F" stroke="#10B981" stroke-width="2.5"/>
        <text x="570" y="362" font-family="JetBrains Mono" font-size="19" font-weight="700" fill="#34D399">02 · VERIFIKASI</text>
        <text x="570" y="420" font-family="Noto Sans" font-size="30" font-weight="800" fill="#FFFFFF">Driver Diperiksa</text>
        <text x="570" y="472" font-family="Noto Sans" font-size="20" fill="#CBD5E1">KTP, SIM, STNK &amp; selfie</text>
        <text x="570" y="506" font-family="Noto Sans" font-size="20" fill="#CBD5E1">lolos kurasi Kantor Pusat.</text>

        <rect x="970" y="305" width="405" height="240" rx="20" fill="#0B2C5F" stroke="#F97316" stroke-width="2.5"/>
        <text x="1005" y="362" font-family="JetBrains Mono" font-size="19" font-weight="700" fill="#FB923C">03 · TELEMETRI GPS</text>
        <text x="1005" y="420" font-family="Noto Sans" font-size="30" font-weight="800" fill="#FFFFFF">Pantau Langsung</text>
        <text x="1005" y="472" font-family="Noto Sans" font-size="20" fill="#CBD5E1">Posisi driver &amp; estimasi tiba</text>
        <text x="1005" y="506" font-family="Noto Sans" font-size="20" fill="#CBD5E1">terlihat real-time di peta.</text>

        <rect x="1405" y="305" width="415" height="240" rx="20" fill="#7F1D1D" stroke="#EF4444" stroke-width="3"/>
        <text x="1440" y="362" font-family="JetBrains Mono" font-size="19" font-weight="700" fill="#FCA5A5">04 · DARURAT</text>
        <text x="1440" y="420" font-family="Noto Sans" font-size="30" font-weight="800" fill="#FFFFFF">Tombol SOS</text>
        <text x="1440" y="472" font-family="Noto Sans" font-size="20" fill="#FECACA">Bantuan cepat saat keadaan</text>
        <text x="1440" y="506" font-family="Noto Sans" font-size="20" fill="#FECACA">darurat selama perjalanan.</text>

        <rect x="100" y="585" width="1410" height="260" rx="24" fill="#FFFFFF"/>
        <text x="148" y="656" font-family="Noto Sans" font-size="32" font-weight="800" fill="#08234D">Tata Kelola Anti-Sepihak &amp; Privasi Terjaga</text>
        <text x="148" y="716" font-family="Noto Sans" font-size="24" fill="#475569">• Perubahan tarif &amp; kebijakan zona wajib persetujuan dua staf + jejak audit permanen.</text>
        <text x="148" y="764" font-family="Noto Sans" font-size="24" fill="#475569">• Persetujuan eksplisit pengguna sebelum pemrosesan data identitas pribadi.</text>
        <text x="148" y="812" font-family="Noto Sans" font-size="24" font-weight="700" fill="#2563EB">• Siap diimplementasikan di kecamatan, kabupaten &amp; jaringan KADIN daerah.</text>
      </svg>`
    )
  );

  // SCENE 6: CLOSING CTA — ngeGas! × SI DIKA × KADIN INDONESIA
  plates.push(
    await renderSceneRGB(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ng6" cx="50%" cy="32%" r="58%">
            <stop offset="0%" stop-color="#153B75" stop-opacity="0.88"/>
            <stop offset="100%" stop-color="#051633" stop-opacity="1"/>
          </radialGradient>
        </defs>
        <rect width="${W}" height="${H}" fill="#051633"/>
        <rect width="${W}" height="${H}" fill="url(#ng6)"/>

        <text x="960" y="596" text-anchor="middle" font-family="Noto Sans" font-size="112" font-weight="800" fill="#EF4444">nge<tspan fill="#38BDF8">Gas!</tspan></text>
        <text x="960" y="662" text-anchor="middle" font-family="Noto Sans" font-size="34" font-weight="700" fill="#FFFFFF">Super-app Ekosistem Desa &amp; Daerah · www.gazzkeun.cloud</text>

        <rect x="1360" y="110" width="450" height="148" rx="22" fill="#08234D" fill-opacity="0.92" stroke="#1E40AF" stroke-width="2.5"/>
        <rect x="1384" y="128" width="112" height="112" rx="16" fill="#FFFFFF"/>
        <text x="1518" y="166" font-family="Noto Sans" font-size="16" font-weight="800" fill="#38BDF8" letter-spacing="2">BEKERJA SAMA DENGAN</text>
        <text x="1518" y="202" font-family="Noto Sans" font-size="26" font-weight="800" fill="#FFFFFF">KADIN INDONESIA</text>
        <text x="1518" y="228" font-family="Noto Sans" font-size="15" fill="#93C5FD">Sinergi SI DIKA &amp; One Payment</text>

        <text x="960" y="720" text-anchor="middle" font-family="Noto Sans" font-size="26" fill="#CBD5E1">Ojek, makanan, dan kirim barang di sekitarmu — diatur presisi setiap zona wilayah.</text>

        <rect x="360" y="766" width="1200" height="90" rx="20" fill="#08234D" stroke="#EF4444" stroke-width="3"/>
        <text x="960" y="825" text-anchor="middle" font-family="Noto Sans" font-size="40" font-weight="800" fill="#FFFFFF">SI DIKA &amp; One Payment   <tspan fill="#64748B">|</tspan>   <tspan fill="#38BDF8">Tinggal </tspan><tspan fill="#EF4444">nge</tspan><tspan fill="#38BDF8">Gas!</tspan></text>
      </svg>`,
      [{ input: kadinLogoClosing, left: 1388, top: 132 }]
    )
  );

  return plates;
}

console.log('1/5 Synthesizing Indonesian Neural Voiceover for ngeGas! (6 scenes)...');
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

console.log('2/5 Aligning ngeGas narration track & upbeat soundtrack...');
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
generateUpbeatBackgroundAudio(musicWav, totalVideoDur + 0.5);

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

console.log('3/5 Pre-rendering animated presenter sprites & ngeGas scene plates...');
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
  console.log('   Saved ngeGas 16:9 video poster:', OUT_POSTER);
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
      drawPulsingRing(outBuf, W, H, centerX, centerY, 200 + rms * 28, 8, 56, 189, 248, 0.35 + rms * 0.4);
      drawPulsingRing(outBuf, W, H, centerX, centerY, 224 + rms * 42, 6, 239, 68, 68, 0.25 + rms * 0.35);
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
      drawPulsingRing(outBuf, W, H, centerX, centerY, 198 + rms * 26, 8, 56, 189, 248, 0.38 + rms * 0.38);
      drawPulsingRing(outBuf, W, H, centerX, centerY, 222 + rms * 38, 6, 239, 68, 68, 0.26 + rms * 0.32);
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
      drawPulsingRing(outBuf, W, H, centerX, centerY, 158 + rms * 22, 7, 56, 189, 248, 0.4 + rms * 0.4);
      drawPulsingRing(outBuf, W, H, centerX, centerY, 178 + rms * 34, 5, 239, 68, 68, 0.26 + rms * 0.34);
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

console.log('4/5 Streaming ngeGas animated lip-synced Full HD frames into FFmpeg...');
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
  console.log(`   Encoded ngeGas scene ${s + 1}/${sceneVoices.length} (${writtenFrames}/${totalVideoFrames} frames)`);
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
console.log(`5/5 DONE! ngeGas Video saved: ${OUT_MP4} (${finalDur.toFixed(1)}s, ${sizeMb} MB)`);
process.exit(0);
