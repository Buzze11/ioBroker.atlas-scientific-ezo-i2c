/* 
This script is created for use in the "Script execution" JavaScript adapter. The data points must of course be adapted to the local setup
It checks the temperature values supplied by the RTD sensor, truncates the decimal places to 1. 
If a change from the old to the new value occurred, the temp_compensation states of the desired (target) sensors are set with time offset
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