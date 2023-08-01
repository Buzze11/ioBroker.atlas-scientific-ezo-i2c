/* 
Dieses Script ist zur Verwendung im Adapter "Skriptausführung" JavaScript erstellt. Die Datenpunkte müssen natürlich an das lokale Setup angepasst werden
Es überprüft die vom RTD Sensor gelieferten Temperaturwerte, kürzt die Nachkommastellen auf 1. 
Ist eine Änderung vom alten zum neuen Wert aufgetreten, werden die temp_compensation states der gewünschten (ziel)Sensoren mit Zeitversatz gesetzt
*/  

 

/*
console.log('Start temp compensation Script');

const ph_temp_compensation = 'atlas-scientific-ezo-i2c.0.0x62.Temperature_compensation';
const do_temp_compensation = 'atlas-scientific-ezo-i2c.0.0x61.Temperature_compensation';

on({id: 'atlas-scientific-ezo-i2c.0.0x63.Temperature', change: "any"}, function (obj) { 

  const newTemptring = obj.state.val;
  const oldTempString = obj.oldState.val;
  const newTempCut = parseFloat(newTemptring).toFixed(1);
  const oldTempCut = parseFloat(oldTempString).toFixed(1);

  console.log('Temp value received: Old:' + oldTempCut + ' New:' + newTempCut );

  if(!(newTempCut === oldTempCut))
  {
    console.log('Temp changed from ' + oldTempCut + ' to' + newTempCut );
    console.log('Setting state ph_temp_compensation: ' + newTempCut);
    setStateDelayed(ph_temp_compensation, newTempCut, 5000);
    console.log('Setting state do_temp_compensation: ' + newTempCut);
    setStateDelayed(do_temp_compensation, newTempCut, 8000);
  }
});
*/