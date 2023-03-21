import puppeteer from 'puppeteer-extra';
import { executablePath } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import UserPreferencesPlugin from 'puppeteer-extra-plugin-user-preferences';
import { readBarcodePDF } from './readBarcodePDF.js';
import { logger } from './loggers.js';

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

async function scraping(answers) {
  const { cnpj, month, year, headless } = answers;

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
  try {
    // wait for the error modal
    await page.waitForSelector('#toast-container .toast-message', { timeout: 500, visible: true });
    // capture the text of the error modal
    const modalText0 = await page.$eval('#toast-container .toast-message', el => el.textContent.trim());

    // if any error modal is found on the page, a message is displayed on the console and the application is terminated.
    if(modalText0.includes('É necessário selecionar o ano-calendário.')) {
      await browser.close();
      logger.info('Não existe informações do DAS disponível para o ano-calendário.');
      return [false, modalText0];
    }
  } catch (error) {
    // Ignore the error
  }

  // Stage 5 - Select calendar month
  const selectMonth = await page.waitForSelector(`[value="${year + month}"]`);
  await selectMonth.click();
  await page.click('#btnEmitirDas');

  try {
    // wait for the error modal
    await page.waitForSelector('#toast-container .toast-message', { timeout: 500, visible: true });

    // capture the text of the error modal
    const modalText1 = await page.$eval('#toast-container .toast-message', el => el.textContent.trim());

    // if any error modal is found on the page, a message is displayed on the console and the application is terminated.
    if(
      modalText1.includes('Já existe pagamento para o PA') ||
      modalText1.includes('É necessário selecionar o(s) período(s) para emissão do DAS.')
      ) {
    const msg =  modalText1.includes('Já existe pagamento para o PA') ? modalText1 : 'DAS não disponível para o período.'
    await browser.close();
    logger.info(msg);
    return [false, modalText1];
    }
  } catch (error) {
    // Ignore the error
  }

  //Stage 6 - Select and click on the "Imprimir/Visualizar PDF" button
  await page.waitForSelector('a[href="/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/emissao/imprimir"]');
  await page.click('a[href="/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/emissao/imprimir"]');

  // wait for the file to finish downloading
  await page.waitForTimeout(1000);

  // close the browser
  await browser.close();

}

export { scraping };