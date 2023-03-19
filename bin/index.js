#!/usr/bin/env node
import inquirer from 'inquirer';
import { validateCNPJ } from './validateCNPJ.js';
import { validateYear, validateMonth } from './validateDate.js';
import { scraping } from './scraping.js';

console.log = function() {};

async function main() {
  console.log('\x1b[36m', '**************************', '\x1b[0m');
  console.log('\x1b[36m', '** Emissão Guia DAS MEI **', '\x1b[0m');
  console.log('\x1b[36m', '**************************', '\x1b[0m');
  console.log('');
  const d = new Date();
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
      default: '34295973000117',
      async validate(value) {
        const valid = await validateCNPJ(value);
        return valid[0] || valid[1];
      },
      filter(answers) {
        return answers.toString();
      }
    },
    {
      type: 'input',
      name: 'year',
      message: 'Informe o ano:',
      default: d.getFullYear(),
      validate(value) {
        const valid = validateYear(value);
        return valid[0] || valid[1];
      },
      filter(answers) {
        return answers.toString();
      }
    },
    {
      type: 'input',
      name: 'month',
      message: 'Informe o mês:',
      default: ("0" + (d.getMonth())).slice(-2),
      validate(value) {
        const valid = validateMonth(value);
        return valid[0] || valid[1];
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

