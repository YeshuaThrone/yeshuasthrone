#!/usr/bin/env node
/**
 * Writes public/test-audio/tone.wav: a 3-second 440 Hz sine, 16-bit mono 8 kHz.
 * Used by the /dev/player route and the Playwright player suite.
 * Run: node scripts/generate-test-audio.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 8000;
const SECONDS = 3;
const FREQUENCY = 440;
const AMPLITUDE = 0.4;

export function sineWav({ sampleRate = SAMPLE_RATE, seconds = SECONDS, frequency = FREQUENCY } = {}) {
  const frames = sampleRate * seconds;
  const dataBytes = frames * 2; // 16-bit mono
  const buf = Buffer.alloc(44 + dataBytes);

  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20); // PCM format
  buf.writeUInt16LE(1, 22); // channels
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write("data", 36);
  buf.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < frames; i++) {
    const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * AMPLITUDE;
    buf.writeInt16LE(Math.round(sample * 0x7fff), 44 + i * 2);
  }
  return buf;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const out = resolve(dirname(fileURLToPath(import.meta.url)), "../public/test-audio/tone.wav");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, sineWav());
  console.log(`wrote ${out}`);
}
