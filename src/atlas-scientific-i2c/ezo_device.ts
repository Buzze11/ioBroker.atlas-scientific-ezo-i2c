import * as i2c from 'i2c-bus';
import { AtlasScientificEzoI2cAdapter } from '../main';
const waitTime=300;

/**
 * A generic Atlas Scientific EZO chip with a common subset of functions.
 */
export class EZODevice {
   
    i2c_bus: i2c.PromisifiedBus;
    address: number;
    waitTime: number;
    readBufferSize: number;
    info: string;
	
	constructor(i2c_bus: i2c.PromisifiedBus, address: number, info: string, protected readonly adapter: AtlasScientificEzoI2cAdapter) {
		this.i2c_bus = i2c_bus;
		this.address = address;
		this.info = info;
		this.readBufferSize = 16;
		this.waitTime = 300;

	}
	
	Delay():Promise<void>{
		return new Promise((resolve,reject)=>{
			this.adapter.setTimeout(resolve,this.waitTime);
		});
	}

	/**
	 * Sends a command to the device, waits 300ms, and then reads back the response.
	 */
	async SendCommand(command: string):Promise<Buffer>{
		const wbuf = Buffer.from(command);
		const rbuf = Buffer.alloc(this.readBufferSize);
		return new Promise((resolve,reject)=>{
			this.i2c_bus.i2cWrite(this.address,wbuf.length,wbuf).then(async _=>{
				await this.Delay();
				let r;
				try{
					r = await this.i2c_bus.i2cRead(this.address,rbuf.length,rbuf);
					//more than 16 bytes, so we need to keep reading
					if(r.buffer.indexOf(0)<0){
						let nr=Buffer.concat([r.buffer]);
						while(r.buffer.indexOf(0)<0){
							r= await this.i2c_bus.i2cRead(this.address,rbuf.length,rbuf);
							nr=Buffer.concat([nr,r.buffer]);
						}
						resolve(nr);
					}else{
						resolve(rbuf);
					}
				}catch(e){reject(e);}
			}).catch(reject);
		});
	}

	/*
	NOTE: all responses start with 0x1, and usually repeat the command that was sent.
	*/

	async Factory():Promise<void>{
		//the device reboots, so there will be nothing to read.
		//Just eat any errors that might crop up.
		await this.SendCommand("Factory").catch(error=>{});
	}

	/**
	 * Fetches the Info string from the device
	 * Promise<String>
	 */
	async GetInfo():Promise<string>{
		this.waitTime = 300;
		const res = (await this.SendCommand("I")).toString().replace(/\0/g, '');
		return res;
	}

	async SetProtocolLock(lock:string):Promise<void>{
		this.waitTime = 300;
		await this.SendCommand('Plock,'+(lock?1:0));
	}

	/**
	 * Returns whether the Protocol currently is locked.
	 */
	async GetProtocolLocked(): Promise<boolean>{
		this.waitTime = 300;
		const cmd='Plock,?';
		//response: _?Plock,n
		return (await this.SendCommand(cmd))[cmd.length+1].toString().replace(/\0/g, '') == '1';
	}

	/**
	 * Finds the device with a white blinking LED. This will disable continuous mode.
	 */
	async Find():Promise<void>{
		this.waitTime = 300;
		await this.SendCommand('Find');
	}

	/**
	 * Return true if the LED is currently on.
	 */
	async GetLED(): Promise<boolean>{
		const cmd='L,?';
		this.waitTime = 300;
		//respose: _?L,n
		const resp = (await this.SendCommand(cmd)).toString().replace(/\0/g, '');
		return resp[cmd.length+1] == '1';
	}

	/**
	 * Turns the LED On or Off
	 */
	async SetLED(isOn: boolean):Promise<void>{
		this.waitTime = 300;
		await this.SendCommand('L,'+(isOn?1:0));
	}

	/**
	 * Stores a name string on the device.
	 * Whitespace will be removed. If longer than 16 characters, only the first 16 will be sent. 
	 */
	async SetName(name: string):Promise<void>{
		this.waitTime = 300;
        let n=name.replace(' ','');
        if(n.length>16)
            n=n.substr(0,16); 
        await this.SendCommand('Name,'+n)
    }

	/**
	 * Gets the stored name of this device
	 */
    async GetName():Promise<string>{
        const cmd="Name,?";
		this.waitTime = 300;
        const resp = await this.SendCommand(cmd);
        return (await this.SendCommand(cmd)).toString('ascii',cmd.length+1).replace(/\0/g, '');
		//resp.toString('ascii', cmd.length+1).replace(/\0/g, '');
    }

	/**
     * Enters sleep/low-power mode. Send any character or command to awaken.
     */
	async Sleep():Promise<void>{
		this.waitTime = 300;
		const wbuf=Buffer.from('Sleep');
		await this.i2c_bus.i2cWrite(this.address,wbuf.length,wbuf);
	}

	/**
	 * Changes the I2C Address. This causes the device to reboot.
	 */
	async ChangeI2CAddress(newAddress: number):Promise<void>{
		this.waitTime = 300;
		const wbuf=Buffer.from(`I2C,${newAddress}`);
		this.i2c_bus.i2cWrite(this.address,wbuf.length,wbuf);
		this.address=newAddress
	}

	/**
	 * Fetches the Status string from the device (voltage at Vcc pin and reason for last restart)
	 * Promise<String> in format "?Status,X,5.038" 
	 * X = Restart code -> P = powered off, S = software reset,B = brown out, W = watchdog, U = unknown
	 */
	async GetDeviceStatus():Promise<string>{
		this.waitTime=300;
		const res = (await this.SendCommand("Status")).toString('ascii',1).replace(/\0/g, '');
		return res;
	}	
	
}

export { EZODevice as default };
