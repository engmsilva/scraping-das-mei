import fetch from 'node-fetch';

async function validateCNPJ(cnpj) {

 // Checks if the CNPJ only contains numbers
  if(!(/^\d+$/.test(cnpj))) return [false, 'Por favor, digite apenas números.'];

  // Check if the CNPJ has an empty value
  if(cnpj == '') return [false, 'Por favor, informe o número do CNPJ.'];

  // Check if the CNPJ has 14 characters
  if (cnpj.length != 14) return [false, 'Por favor, informe o número do CNPJ com 14 dígitos.'];


  // Eliminate known invalid CNPJs
  if (cnpj == "00000000000000" ||
      cnpj == "11111111111111" ||
      cnpj == "22222222222222" ||
      cnpj == "33333333333333" ||
      cnpj == "44444444444444" ||
      cnpj == "55555555555555" ||
      cnpj == "66666666666666" ||
      cnpj == "77777777777777" ||
      cnpj == "88888888888888" ||
      cnpj == "99999999999999")
      return [false, 'Por favor, informe o número do CNPJ válido.'];

  // Calculate the first check digit
  let soma = 0;
  let peso = 5;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpj.charAt(i)) * peso;
    peso--;
    if (peso < 2) {
      peso = 9;
    }
  }
  let digito1 = soma % 11 < 2 ? 0 : 11 - soma % 11;

  // Calculate the second check digit
  soma = 0;
  peso = 6;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpj.charAt(i)) * peso;
    peso--;
    if (peso < 2) {
      peso = 9;
    }
  }
  let digito2 = soma % 11 < 2 ? 0 : 11 - soma % 11;

  // Checks if the calculated check digits are equal to the CNPJ digits
  if (parseInt(cnpj.charAt(12)) !== digito1 || parseInt(cnpj.charAt(13)) !== digito2) {
    return [false, 'Por favor, informe o número do CNPJ válido.'];
  }

 // Checks if the CNPJ legal code is 213-5 - Empresário (Individual)
  const url = `https://www.receitaws.com.br/v1/cnpj/${cnpj}`;
  const response = await fetch(url);
  const data = await response.json();

  if(data.status === 'ERROR') return [false, 'CNPJ inválido.'];
  const natureza_juridica = data.natureza_juridica.replace(/\D/g, '');

 if (natureza_juridica !== '2135') {
    return [false, 'Por favor, informe um CNPJ válido que pertence ao MEI.'];
  }

  return [true];

}

export { validateCNPJ };