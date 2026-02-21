import puppeteer from 'puppeteer';
import fs from 'fs';

async function getAntam1gBuyback() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  await page.goto('https://galeri24.co.id/harga-emas', {
    waitUntil: 'networkidle2',
  });

  // wait until ANTAM table rendered
  await page.waitForSelector('#ANTAM .min-w-\\[400px\\]');

  const result = await page.evaluate(() => {
    const rows = document.querySelectorAll('#ANTAM .min-w-\\[400px\\] > div');

    for (const row of rows) {
      const cols = row.querySelectorAll('div');

      if (cols.length === 3) {
        const weight = cols[0].innerText.trim();

        if (weight === '1') {
          const buyback = cols[2].innerText.trim();

          return {
            weight: '1g',
            buybackRaw: buyback,
            buybackNumber: Number(buyback.replace(/[Rp.]/g, '')),
          };
        }
      }
    }

    return null;
  });

  await browser.close();
  return result;
}

async function getUBS1gBuyback() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();

  await page.goto('https://ubslifestyle.com/harga-buyback-hari-ini/', { waitUntil: 'networkidle2' });

  await page.waitForSelector('.table-product-wrapper table tbody tr');

  const result = await page.evaluate(() => {
    const rows = document.querySelectorAll('.table-product-wrapper table tbody tr');

    for (const row of rows) {
      const cols = row.querySelectorAll('td');

      if (cols.length === 3) {
        // normalize: " 1 Gram " -> "1"
        const weight = cols[0].innerText.replace('Gram', '').replace(',', '.').trim();

        if (weight === '1') {
          const buyback = cols[2].innerText.trim();

          return {
            weight: '1g',
            buybackRaw: buyback,
            buybackNumber: Number(buyback.replace(/[Rp.]/g, '')),
          };
        }
      }
    }

    return null;
  });

  await browser.close();
  return result;
}

async function getSpotGramIDR() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();

  await page.goto('https://harga-emas.org/', {
    waitUntil: 'networkidle2',
  });

  await page.waitForSelector('table');

  const result = await page.evaluate(() => {
    const rows = document.querySelectorAll('table tr');

    for (const row of rows) {
      const cols = row.querySelectorAll('td');

      if (cols.length === 3) {
        const satuan = cols[0].innerText.toLowerCase().trim();

        if (satuan === 'gram (gr)') {
          let idr = cols[2].innerText.trim();

          // remove "(+21.740,03)"
          idr = idr.split('(')[0].trim();

          // remove decimal ",13"
          idr = idr.split(',')[0].trim();

          return {
            type: 'spot',
            unit: 'gram',
            currency: 'IDR',
            priceRaw: idr,
            priceNumber: Number(idr.replace(/\./g, '')),
          };
        }
      }
    }

    return null;
  });

  await browser.close();
  return result;
}

getAntam1gBuyback().then(console.log);
getUBS1gBuyback().then(console.log);
getSpotGramIDR().then(console.log);

const data = {
  spot_idr: (await getSpotGramIDR()).priceNumber,
  antam_buyback_1g: (await getAntam1gBuyback()).buybackNumber,
  ubs_buyback_1g: (await getUBS1gBuyback()).buybackNumber,
  updated_at: new Date().toISOString(),
};

fs.writeFileSync('result.json', JSON.stringify(data, null, 2));
console.log('result.json updated');
