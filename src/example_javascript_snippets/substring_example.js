/* 
This script is created for use in the "Script execution" JavaScript adapter. The data points must of course be adapted to the local setup
The script splits the value string supplied by the DO sensor, which can contain mg/L as well as % depending on the activated parameters, into two values and stores them in two 
data points.

*/



/*
console.log('Start');

const DO_mg_L = 'javascript.' + instance + '.DO_Sensor.DO_mg_L';
createState(DO_mg_L, 0, {"type": "string", read: true, write: false, role: "value.do", unit: "mg/L"});
const DO_Percent = 'javascript.' + instance + '.DO_Sensor.DO_Percent';
createState(DO_Percent, 0, {"type": "string", read: true, write: false, role: "value.do", unit: "%"});


function buildSubstrings(str, start, end) {
  const arr = str.split(',');
  console.log('Array:' + arr.toString());
  return arr; 
}

on({id: 'atlas-scientific-ezo-i2c.0.0x61.Dissolved_Oxygen', change: "any"}, function (obj) { 
  
  console.log('Value changed: ' + obj.state.val);
  const doString = obj.state.val;
  const result = buildSubstrings(doString, 0, 1);
  console.log(result.toString());
  
  // Only mg/L
  if(result.length === 1){
    console.log('Setting state DO_mg_L: ' + result[0].toString());
    setState(DO_mg_L, result[0], true);
  }
  // mg/l & %
  else if (result.length === 2) {
    console.log('Setting state DO_mg_L: ' + result[0].toString());
    setState(DO_mg_L, result[0], true);
    console.log('Setting state DO_Percent: ' + result[1].toString());
    setState(DO_Percent, result[1], true);
  }
});
*/