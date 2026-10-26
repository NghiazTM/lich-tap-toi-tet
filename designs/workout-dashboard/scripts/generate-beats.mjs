import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Original procedural music. No samples, recordings or third-party melodies.
const sampleRate = 22050;
const beats = 96;
const output = fileURLToPath(new URL('../assets/audio/', import.meta.url));
await mkdir(output, { recursive: true });
const specifications = [
  { file: 'vao-nhip-100.wav', bpm: 100, seed: 913, energy: 0.7 },
  { file: 'giu-nhip-120.wav', bpm: 120, seed: 1729, energy: 0.9 },
  { file: 'but-toc-140.wav', bpm: 140, seed: 4177, energy: 1.1 },
];

for (const spec of specifications) {
  const duration = beats * 60 / spec.bpm;
  const count = Math.floor(duration * sampleRate);
  const samples = new Float32Array(count);
  const beatLength = 60 / spec.bpm;
  const roots = [55, 43.6535, 65.4064, 49];
  const thirds = [1.189207, 1.259921, 1.259921, 1.259921];
  const melody = [0, 7, 12, 7, 3, 7, 10, 7];
  let seed = spec.seed;
  let previousNoise = 0;
  let peak = 0;
  for (let index = 0; index < count; index++) {
    const time = index / sampleRate;
    const beat = time / beatLength;
    const beatIndex = Math.floor(beat);
    const beatTime = (beat - beatIndex) * beatLength;
    const halfIndex = Math.floor(beat * 2);
    const halfTime = (beat * 2 - halfIndex) * beatLength / 2;
    const barTime = time % (beatLength * 4);
    const chord = Math.floor(beat / 16) % roots.length;
    const root = roots[chord];
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    const brightNoise = noise - previousNoise * 0.78;
    previousNoise = noise;
    // A pitched kick, backbeat snare, offbeat hats and a quiet syncopated shaker.
    let value = Math.sin(2 * Math.PI * (46 * beatTime + 2.6 * (1 - Math.exp(-34 * beatTime)))) * Math.exp(-beatTime * 15) * 0.57;
    if (beatIndex % 4 === 1 || beatIndex % 4 === 3) {
      value += (noise * 0.25 + Math.sin(2 * Math.PI * 165 * beatTime) * 0.13) * Math.exp(-beatTime * 23);
    }
    value += brightNoise * Math.exp(-halfTime * (halfIndex % 2 ? 52 : 105)) * (halfIndex % 2 ? 0.075 : 0.045) * spec.energy;
    const sixteenthTime = (beat * 4 % 1) * beatLength / 4;
    if (spec.energy > 0.8) value += brightNoise * Math.exp(-sixteenthTime * 150) * 0.018;
    const bassFrequency = root * ([0, 0, 7, 0, 0, 12, 7, 0][beatIndex % 8] === 0 ? 1 : Math.pow(2, [0, 0, 7, 0, 0, 12, 7, 0][beatIndex % 8] / 12));
    const bassEnvelope = Math.min(1, beatTime / 0.012) * Math.exp(-beatTime * 5.5);
    value += (Math.sin(2 * Math.PI * bassFrequency * time) * 0.14 + Math.sin(4 * Math.PI * bassFrequency * time) * 0.025) * bassEnvelope;
    const padEnvelope = Math.min(1, barTime / 0.3) * Math.min(1, (beatLength * 4 - barTime) / 0.3);
    const chordBase = root * 4;
    value += (Math.sin(2 * Math.PI * chordBase * time) + Math.sin(2 * Math.PI * chordBase * thirds[chord] * time) + Math.sin(2 * Math.PI * chordBase * 1.498307 * time)) * padEnvelope * 0.023;
    const note = root * 8 * Math.pow(2, melody[halfIndex % 8] / 12);
    value += (Math.sin(2 * Math.PI * note * time) + Math.sin(4 * Math.PI * note * time) * 0.15) * Math.min(1, halfTime / 0.009) * Math.exp(-halfTime * 15) * 0.038;
    const fade = Math.min(1, time / 0.025, (duration - time) / 0.04);
    value *= fade;
    samples[index] = value;
    peak = Math.max(peak, Math.abs(value));
  }
  const buffer = Buffer.alloc(44 + count * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(count * 2, 40);
  for (let index = 0; index < count; index++) buffer.writeInt16LE(Math.round(samples[index] / peak * 0.76 * 32767), 44 + index * 2);
  await writeFile(new URL(`../assets/audio/${spec.file}`, import.meta.url), buffer);
  console.log(`${spec.file}: ${spec.bpm} BPM, ${(count / sampleRate).toFixed(2)} s, ${(buffer.length / 1048576).toFixed(2)} MiB`);
}
