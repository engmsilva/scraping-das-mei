import { createRequire } from 'module';
import dotenv from 'dotenv';
import { logger } from './loggers.js';

// Load environment variables from .env file
dotenv.config();

function sendSMS(msg) {
  //Send sms if TWILIO ENABLE SEND environment variable is set to true
  if(process.env.TWILIO_ENABLE_SEND.toLowerCase() === 'true') {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const require = createRequire(import.meta.url);
    const client = require('twilio')(accountSid, authToken);
    client.messages
    .create({
      body: `Código de barra da guia do DAS: ${msg}`,
      from: process.env.TWILIO_CELL_FROM,
      to: process.env.TWILIO_CELL_TO
    })
    .then(message => logger.info(message.body));
  }
};

export { sendSMS };