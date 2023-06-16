import { AtlasScientificEzoI2cAdapter } from "../main";
import { EZODevice } from "./ezo_device";
/**
 * Wrapper class for Peristaltic Pump
 */
export class Pump extends EZODevice {
    
    constructor(i2c_bus,address,info, protected readonly adapter: AtlasScientificEzoI2cAdapter){
        super(i2c_bus,address,info, adapter);
        this.readBufferSize=16;
    }
    
    /**
     * This will begin continuously dispensing liquid until Pause or Stop is given.
     */
	async StartDispensing(reverse: boolean):Promise<void>{
		if(reverse){
			await this.SendCommand("D,-*");
		}else{
			await this.SendCommand("D,*");
		}
	}

    /**
     * Stops dispensing. Returns the volume of liquid that has been dispensed.
     */
	async StopDispensing():Promise<string>{
		//_*DONE,v
		return (await this.SendCommand("X")).toString().split(',')[1];
	}

    /**
     * Dispenses the given amount. Negative amounts will run the pump in reverse
     */
	async Dispense(ml: string):Promise<void>{
		await this.SendCommand("D," + ml);	
	}

    /**
     * Dispenses the given volume  over the given minutes.
     * ml Amount
     * min Minutes
     */
	async Dose(ml:number ,min:number):Promise<void>{
		await this.SendCommand(`D,${ml},${min}`);
	}

    /**
     * Maintain a constant flow rate.
     * rate (ml/min) 
     * min Minutes to maintain this rate. Use '*' for indefinite time.
     */
	async DispenseConstantRate(rate:number, min:string):Promise<void>{
		await this.SendCommand(`DC,${rate},${min}`);
	}
	
	/**
     * Pauses Dispensing.
     */
	async PauseDispensing():Promise<void>{
		await this.SendCommand('P');
	}

    /**
     * Checks if the unit is currently paused
     */
    async IsPaused():Promise<boolean>{
        const cmd = 'P,?';
        //returns _?P,n
        return ((await this.SendCommand(cmd))[cmd.length+1]==1);
    }
	
    /**
     * Gets the current voltage across the Pump's terminals.
     */
	async GetPumpVoltage():Promise<string>{
        const cmd='PV,?';
		return (await this.SendCommand(cmd)).toString('ascii',cmd.length+1);
	}
	
    /**
     * Gets a single value showing dispensed volume.
     */
    async GetReading():Promise<number>{
       return Number.parseFloat((await this.SendCommand('R')).toString('ascii',1));
    }

    /**
     * Shows the total volume (ml) dispensed by the pump. 
     * 
     * This data is erased if the pump loses power.
     * absolute Get the absolute total volume instead.
     * returns  ml
     */
	async GetTotalDispensedVolume(absolute: boolean):Promise<string>{
        let cmd='TV,?';
		if(absolute){
            cmd = 'ATV,?';
        }
        return (await this.SendCommand(cmd)).toString('ascii',cmd.length+1);
	}

    /**
     * Clears the total dispensed volume. 
     */
	async ClearTotalDispensedVolume():Promise<void>{
		await this.SendCommand('clear');
	}

    /**
     * Returns a single number indicating calibration status.
     * 
     * 0 - uncalibrated
     * 1 - fixed volume
     * 2 - volume over time
     * 3 - both
     */
	async isCalibrated():Promise<string>{
		//returns _?Cal,n
        const cmd ='Cal,?';
		return (await this.SendCommand(cmd))[cmd.length+1].toString();
	}

	async Calibrate(volume:string):Promise<void>{
		await this.SendCommand('Cal,'+volume);
	}

	async ClearCalibration():Promise<void>{
		await this.SendCommand('Cal,clear');
	}

    /**
     * Enables/Disables the specified parameter. 
     * 
     * 'V' - volume being pumped. 
     * 'TV' - total volume being pumped. 
     * 'ATV' - absolute total volume being pumped
     */
    async SetParameters(parameter:string, isEnabled:boolean):Promise<void>{
        await this.SendCommand(`O,${parameter},${(isEnabled?1:0)}`);
    }

    /**
     * Returns a comma seperated string of the currently enabled parameters
     */
    async GetParametersEnabled():Promise<string>{
        const cmd = 'O,?';
        return (await this.SendCommand(cmd)).toString('ascii',cmd.length+1);
    }

    /**
     * This is not supported on the Atlas Scientific Peristaltic Pumps
     * @param name 
     */
    SetPumpName(name){
       //Pumps do not support
    }

    /**
     * This is not supported on the Atlas Scientific Peristaltic Pumps
     * @returns {null}
     */
    GetPumpName(){
        return 0;
    }

}

export { Pump as default };
