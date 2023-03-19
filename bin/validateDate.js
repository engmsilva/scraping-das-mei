
function validateYear(year) {

   // determine the current year
   const now = new Date();
   const currentYear = now.getFullYear();

   // determines the start year of the MEI validity
   const minYear = 2009;

   // check if the input year is a string containing only numbers
  if(!/^\d+$/.test(year)) return [false, 'Por favor, digite um número.'];

  // check if the year has 4 digits
  if(year.length !== 4) return [false, 'O ano precisa conter 4 dígitos.'];

  // check if the year is within the allowed range
  if(parseInt(year, 10) < minYear || parseInt(year, 10) > currentYear) return [false, `O ano deve estar entre 2009 e ${currentYear}.`];

  return [true];

}

function validateMonth(month) {
  // check if the input month is a string containing only numbers
  if(!/^\d+$/.test(month)) return [false, 'Por favor, digite um número.'];

  // check if the month has 2 digits
  if(month.length !== 2) return [false, 'O ano precisa conter 2 dígitos.'];

  // check if the month is within the allowed range
  if(parseInt(month, 10) < 1 || parseInt(month, 10) > 12) return [false, 'O valor digitado não é um mês válido.'];

  return [true];



}

export { validateYear, validateMonth };