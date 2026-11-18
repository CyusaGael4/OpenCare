/**
 * Generate display derivatives of the official OpenCare logo.
 *
 * The supplied logo is a 2000×2000 PNG with the lockup occupying the upper
 * portion and a large white margin around it, so using it directly at navbar
 * sizes renders a tiny, off-centre mark.
 *
 * This script only *trims* the original — it never redraws, recolours or
 * replaces the logo. The source file is read-only here.
 *
 * Run: npm run assets   (from frontend/)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, '..');
const source = path.join(frontendRoot, 'assets', 'Green and White Modern Medical Logo.png');
const publicDir = path.join(frontendRoot, 'public');

async function main() {
  await fs.access(source);
  await fs.mkdir(publicDir, { recursive: true });

  const original = sharp(source);
  const meta = await original.metadata();

  // Trim the uniform white margin away from the lockup.
  const trimmedBuffer = await sharp(source)
    .flatten({ background: '#ffffff' })
    .trim({ threshold: 10 })
    .png()
    .toBuffer({ resolveWithObject: true });

  const lockup = trimmedBuffer.info;
  console.log(`source: ${meta.width}×${meta.height} → trimmed lockup: ${lockup.width}×${lockup.height}`);

  // Full lockup for headers and the auth panel.
  await sharp(trimmedBuffer.data)
    .resize({ width: 900, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, 'opencare-logo.png'));

  /*
   * Square mark for compact spaces and the favicon. The stethoscope-and-cross
   * mark sits at the left of the lockup; the crop stops just before the "O" of
   * the wordmark so the chest piece is not clipped.
   */
  const markSize = Math.round(lockup.width * 0.45);
  await sharp(trimmedBuffer.data)
    .extract({ left: 0, top: 0, width: markSize, height: lockup.height })
    .resize({
      width: 256,
      height: 256,
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, 'opencare-mark.png'));

  const logoStat = await fs.stat(path.join(publicDir, 'opencare-logo.png'));
  const markStat = await fs.stat(path.join(publicDir, 'opencare-mark.png'));
  console.log(`public/opencare-logo.png  ${(logoStat.size / 1024).toFixed(1)} kB`);
  console.log(`public/opencare-mark.png  ${(markStat.size / 1024).toFixed(1)} kB`);
}

main().catch((error) => {
  console.error('Asset preparation failed:', error.message);
  process.exit(1);
});
