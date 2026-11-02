/* Runs untrusted learner code only inside a dedicated Worker. No DOM access. */
self.onmessage = (event) => {
  const {code, mode, args, expected} = event.data;
  const safeError = e => String(e && e.message ? e.message : e).slice(0,220);
  try {
    const calculateTotal = new Function('"use strict";\n' + code + '\n;return calculateTotal;')();
    if (typeof calculateTotal !== 'function') throw new Error('Потрібна функція calculateTotal().');
    const cases = mode === 'custom'
      ? [{name:'Власний тест',args,kind:expected.kind,want:expected.value}]
      : [
        {name:'Звичайна знижка',args:[100,2,10],kind:'value',want:180},
        {name:'Нульова кількість',args:[100,0,10],kind:'value',want:0},
        {name:'Знижка 100%',args:[100,1,100],kind:'value',want:0},
        {name:'Помилковий відсоток',args:[100,1,101],kind:'throws'},
        {name:'Дробова кількість',args:[100,1.5,10],kind:'throws'}
      ];
    const results = cases.map(test => {
      let actual, didThrow=false, err='';
      try {actual=calculateTotal(...test.args)} catch(e){didThrow=true;err=safeError(e)}
      const passed=test.kind==='throws'?didThrow:(!didThrow && typeof actual==='number' && Object.is(actual,test.want));
      const observed=didThrow?'Виняток: '+err:(typeof actual==='undefined'?'undefined':String(actual));
      return {name:test.name,passed,expected:test.kind==='throws'?'Виняток':String(test.want),observed};
    });
    self.postMessage({ok:true,results});
  } catch(e) {self.postMessage({ok:false,error:safeError(e)});}
};
