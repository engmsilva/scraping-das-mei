#!/usr/bin/env node

import puppeteer from 'puppeteer-extra';
import { executablePath } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import UserPreferencesPlugin from 'puppeteer-extra-plugin-user-preferences';
import { PDFBarcodeJs } from 'pdf-barcode';
import inquirer from 'inquirer';

// path to save the DAS tab
const downloadPath = process.cwd() + '/bin';

// Applies techniques to make detection of puppeteer harder
puppeteer.use(StealthPlugin());

// blocker for ads and trackers
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

//configure file download options
puppeteer.use(
  UserPreferencesPlugin({
    userPrefs: {
      download: {
        prompt_for_download: false,
        open_pdf_in_system_reader: true,
        default_directory: downloadPath,
      },
      plugins: {
        always_open_pdf_externally: true,
      },
    },
  })
);

const configs = {
  scale: {
      once: true,
      value: 3,
      start: 3,
      step: 0.6,
      stop: 4.8
  },
  resultOpts: {
      singleCodeInPage: true,
      multiCodesInPage: false,
      maxCodesInPage: 1
  },
  patches: [
      "x-small",
      "small",
      "medium"
  ],
  improve: true,
  noisify: true,
  quagga: {
      inputStream: {},
      locator: {
          halfSample: false
      },
      decoder: {
          readers: [
              "i2of5_reader",
          ],
        multiple: false
      },
      locate: true
  }
};

// It adds the DAC (Self-Conference Digit) to the bar code
//to build the “2 of 5 interleaved” type typeable line code,
//according to Febraban's standard layout.
function addDac(barcode) {
  const factorDac = '43298765432';
  const module4 = barcode.match(/.{1,11}/g);

  const dac = module4.map((module) => {
    const module11 = module.match(/.{1,1}/g);

    const module11MultSum = module11.reduce((accumulator, value, index) => {
      const mult = value * factorDac[index];
      return accumulator + mult;
    }, 0);

    const restDivision = module11MultSum % 11;
    const dv = 11 - restDivision;

    if(restDivision === 0 || restDivision === 1) return 0;

    if (restDivision === 10) return 1;

    return dv;
  });

  const addDac = module4.map((m,i) => m + dac[i].toString());

  return addDac.join('');
};

//Reads the barcode from a PDF file
function readBarcodePDF(header) {
  if (typeof header['content-disposition'] === "string") {
    if(header['content-disposition'].includes('filename')) {
      const filename = header['content-disposition'].replace("attachment; filename=", "");
      const filePath = new URL(`file:///${downloadPath + "/" + filename}`).href;
      PDFBarcodeJs.decodeSinglePage(filePath, 1, configs, (response) => {
       const barcode = response.codes[0];
       console.log('Barcode: ', addDac(barcode));
      });
    };
  }
}

async function scraping(answers) {
  const { cnpj, month, year, headless } = answers;

  // const cnpj = '34.295.973/0001-17';

  // Launch a browser instance with arguments and options
  const browser = await puppeteer.launch({
    headless,
    args: [
      '--start-maximized',
    ],
    defaultViewport: null,
    executablePath: executablePath()
  });

  // Create a new page
  const page = await browser.newPage();

  // Configure download options and readBarcodePDF when set to true in headless mode
  if(headless) {

    page.on('response', resp => {
      const header = resp.headers();
      readBarcodePDF(header);
    });

    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadPath
    });
  }

  // Stage 1 - Open the Receita Federal website
  await page.goto('http://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao',
  {
    waitUntil: "networkidle2",
  });

  // Stagio 2 - Fill in the CNPJ field
  await page.waitForSelector('input[id=cnpj]');
  await page.evaluate((val) => {
    document.querySelector('input[id=cnpj]').value = val;
    document.querySelector('button[type=submit]').click();
  }, cnpj);

  // Stage 3 - Select and click on the " Emitir Guia de Pagamento (DAS)" menu
  await page.waitForSelector('a[href="/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/emissao"]');
  await page.click('a[href="/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/emissao"]');

  // Stage 4 - Select calendar year
  await page.select('#anoCalendarioSelect', year)
  await page.evaluate(() => {
    document.querySelector('button[type=submit]').click();
});

  // Stage 5 - Select calendar month
  const selectMonth = await page.waitForSelector(`[value="${year + month}"]`);
  await selectMonth.click();
  await page.click('#btnEmitirDas');

  //Stage 6 - Select and click on the "Imprimir/Visualizar PDF" button
  await page.waitForSelector('a[href="/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/emissao/imprimir"]');
  await page.click('a[href="/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/emissao/imprimir"]');

  // wait for the file to finish downloading
  await page.waitForTimeout(1000);

  // close the browser
  await browser.close();
}

async function main() {
  console.log('\x1b[36m', '**************************', '\x1b[0m');
  console.log('\x1b[36m', '** Emissão Guia DAS MEI **', '\x1b[0m');
  console.log('\x1b[36m', '**************************', '\x1b[0m');
  console.log('');
  inquirer
  .prompt([
    {
      type: "list",
      name: "headless",
      message: "Usar modo interativo (headless off)?",
      choices: ["Não", "Sim"],
      filter(answers) {
        return answers === 'Sim' ? false : true;
      }
    },
    {
      type: 'input',
      name: 'cnpj',
      message: 'Informe o CNPJ:',
      validate(value) {
        const valid = !isNaN(Number(value));
        return valid || 'Por favor, digite um número.';
      },
      filter(answers) {
        return answers.toString();
      }
    },
    {
      type: 'input',
      name: 'year',
      message: 'Informe o ano:',
      validate(value) {
        const valid = !isNaN(Number(value));
        return valid || 'Por favor, digite um número.';
      },
      filter(answers) {
        return answers.toString();
      }
    },
    {
      type: 'input',
      name: 'month',
      message: 'Informe o mês:',
      validate(value) {
        const valid = !isNaN(Number(value));
        return valid || 'Por favor, digite um número.';
      },
      filter(answers) {
        return answers.toString();
      }
    },
  ])
  .then((answers) => {
    scraping(answers);
  });

}

main();

