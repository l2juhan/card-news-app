/**
 * build/icon.html → icon.png(1024) → icon.iconset → icon.icns (macOS only)
 *   node build/generate-icons.cjs
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const buildDir = __dirname;
const htmlPath = path.join(buildDir, 'icon.html');
const pngPath = path.join(buildDir, 'icon.png');
const iconsetDir = path.join(buildDir, 'icon.iconset');
const icnsPath = path.join(buildDir, 'icon.icns');

async function main() {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 1024, deviceScaleFactor: 1 });
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: pngPath, type: 'png', omitBackground: true });
  await browser.close();
  console.log('icon.png 생성 완료:', pngPath);

  if (process.platform !== 'darwin') {
    console.log('macOS가 아니므로 .icns 생성 건너뜀.');
    return;
  }

  if (fs.existsSync(iconsetDir)) {
    fs.rmSync(iconsetDir, { recursive: true });
  }
  fs.mkdirSync(iconsetDir);

  const sizes = [
    { size: 16, name: 'icon_16x16.png' },
    { size: 32, name: 'icon_16x16@2x.png' },
    { size: 32, name: 'icon_32x32.png' },
    { size: 64, name: 'icon_32x32@2x.png' },
    { size: 128, name: 'icon_128x128.png' },
    { size: 256, name: 'icon_128x128@2x.png' },
    { size: 256, name: 'icon_256x256.png' },
    { size: 512, name: 'icon_256x256@2x.png' },
    { size: 512, name: 'icon_512x512.png' },
    { size: 1024, name: 'icon_512x512@2x.png' },
  ];

  for (const { size, name } of sizes) {
    const out = path.join(iconsetDir, name);
    execSync(`sips -z ${size} ${size} "${pngPath}" --out "${out}"`, { stdio: 'pipe' });
  }

  execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`, { stdio: 'pipe' });
  fs.rmSync(iconsetDir, { recursive: true });
  console.log('icon.icns 생성 완료:', icnsPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
