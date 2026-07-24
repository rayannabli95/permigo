import pw from '/Users/macbookm3/Desktop/permigo-v7/permigo-game/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1300, height: 1300 } });
await page.goto('file:///private/tmp/claude-501/-Users-macbookm3-Desktop-permigo-v7/5e14c278-0238-4c01-8093-789b5077043d/scratchpad/base.html');
await page.waitForTimeout(500);
const out = await page.evaluate(async () => {
  const img = document.querySelector('img');
  await img.decode();
  const c = document.createElement('canvas');
  c.width = 1254; c.height = 1254;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, 1254, 1254).data;
  const px = (x, y) => {
    const i = (Math.round(y) * 1254 + Math.round(x)) * 4;
    return [d[i], d[i + 1], d[i + 2]];
  };
  const classify = ([r, g, b]) => {
    if (b > r + 15 && b > 100) return 'BLUE';
    if (g > r + 12 && g > b + 12 && g > 120) return 'GREENRING';
    if (g > r + 10 && g < 120) return 'GRASS';
    if (r > 200 && g > 200 && b > 200) return 'WHITE';
    return 'GRAY';
  };
  // walk along NE diagonal (45 deg, no branch there)
  const cx = 627, cy = 627;
  const lines = [];
  let prev = '';
  for (let r = 0; r < 620; r += 2) {
    const x = cx + r * Math.SQRT1_2, y = cy - r * Math.SQRT1_2;
    const cl = classify(px(x, y));
    if (cl !== prev) { lines.push(`r=${r} ${prev}->${cl} rgb=${px(x, y)}`); prev = cl; }
  }
  // road half-width: walk east along y=627+*, find south edge of east branch (x=1100)
  const edges = [];
  prev = '';
  for (let y = 627; y < 900; y += 2) {
    const cl = classify(px(1180, y));
    if (cl !== prev) { edges.push(`E-branch x=1180 y=${y} ${prev}->${cl}`); prev = cl; }
  }
  prev = '';
  for (let y = 627; y > 350; y -= 2) {
    const cl = classify(px(1180, y));
    if (cl !== prev) { edges.push(`E-branch-up x=1180 y=${y} ${prev}->${cl}`); prev = cl; }
  }
  prev = '';
  for (let x = 627; x < 900; x += 2) {
    const cl = classify(px(x, 1180));
    if (cl !== prev) { edges.push(`S-branch y=1180 x=${x} ${prev}->${cl}`); prev = cl; }
  }
  prev = '';
  for (let x = 627; x > 350; x -= 2) {
    const cl = classify(px(x, 1180));
    if (cl !== prev) { edges.push(`S-branch-left y=1180 x=${x} ${prev}->${cl}`); prev = cl; }
  }
  return { rings: lines, edges };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
