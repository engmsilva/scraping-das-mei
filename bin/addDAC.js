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

export { addDac };