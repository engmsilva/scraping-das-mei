import { PDFBarcodeJs } from 'pdf-barcode';
import winston from 'winston';
import { addDac } from './addDAC.js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console()
  ]
});

// path to save the DAS tab
const downloadPath = process.cwd() + '/bin';

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

//Reads the barcode from a PDF file
function readBarcodePDF(header) {
  if (typeof header['content-disposition'] === "string") {
    if(header['content-disposition'].includes('filename')) {
      const filename = header['content-disposition'].replace("attachment; filename=", "");
      const filePath = new URL(`file:///${downloadPath + "/" + filename}`).href;
      PDFBarcodeJs.decodeSinglePage(filePath, 1, configs, (response) => {
       const barcode = response.codes[0];
       const barcodeWithDAC = addDac(barcode);
       logger.info(`Barcode: ${barcodeWithDAC}`);
      });
    };
  }
}

export { readBarcodePDF };