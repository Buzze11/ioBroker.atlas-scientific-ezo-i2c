
import { EZODevice } from "./ezo_device";
import { Pump } from "./pump";
import { pH } from "./ph_meter";
import { ORP } from "./orp_meter";
import { EC } from "./ec_meter";
import { DO } from "./do_meter";
import { RTD } from "./rtd-meter";
import { PRS } from "./prs";
import * as i2c from 'i2c-bus';
import { AtlasScientificEzoI2cAdapter } from "../main";
import { Delay } from "../lib/async";




/**
 * Returns a promise that resolves into an array of available, EZO class devices.
 * This scans the i2c_bus for in use addresses. It sends each address the "I" info command, and if the response matches the EZO pattern, it will instantiate the corresponding wrapper class.
 * If the device is an unknown type, it will instantiate as a generic EZODevice. 
 */
 export async function FindAllDevices(i2c_bus: i2c.PromisifiedBus, adapter: AtlasScientificEzoI2cAdapter):Promise<any[]>{
	const info = Buffer.from("I");
	const results = await i2c_bus.scan();
	const writesP=Promise.allSettled(results.map(addr=>{
					return i2c_bus.i2cWrite(addr,info.length,info);
			}));
	await writesP;
	await new Delay(300, adapter)
	const readsP=await Promise.allSettled(results.map(addr=>{
			const rbuf= Buffer.alloc(16);
			return i2c_bus.i2cRead(addr,rbuf.length,rbuf);
	}));

	const devices=[];
	readsP.forEach((promResult,index)=>{
			if(promResult.status=="fulfilled"){
				//console.log(promResult.value.buffer.toString());
				const info=promResult.value.buffer.toString();
				if(info.indexOf("?I,")>-1){
					const devType=info.split(',')[1];
					if(devType=='PMP'){
						devices.push(new Pump(i2c_bus,results[index],info, adapter));
					}else if(devType=='pH'){
						devices.push(new pH(i2c_bus,results[index],info, adapter));
					}else if(devType=='DO'){
						devices.push(new DO(i2c_bus,results[index],info, adapter));
					}else if(devType=='EC'){
						devices.push(new EC(i2c_bus,results[index],info, adapter));
					}else if(devType=='ORP'){
						devices.push(new ORP(i2c_bus,results[index],info, adapter));
					}else if(devType=='RTD'){
						devices.push(new RTD(i2c_bus,results[index],info, adapter));
					}else{
						devices.push(new EZODevice(i2c_bus,results[index],info, adapter));
					}
				}

			}
	});
	return devices;
}

export { EZODevice, Pump, pH, DO, ORP, EC, RTD, PRS};


