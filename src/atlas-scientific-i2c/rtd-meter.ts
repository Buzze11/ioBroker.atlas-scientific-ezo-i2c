import { EZODevice } from "./ezo_device";

/**
 * Wrapper class for RTD EZO circuit
 */
export class RTD extends EZODevice{


    constructor(i2c_bus,address,info){
        super(i2c_bus,address,info);
    }

    /**
     * Resets calibration settings
     */
    async ClearCalibration(){
        this.waitTime=300;
        await this.SendCommand('Cal,clear');
    }

    /**
     * Calibration for Temperature
     */
    async CalibrateTemperature(value:number):Promise<void>{
        this.waitTime=600;
        await this.SendCommand('Cal,' + value);
    }

    /**
     * Returns a status code on the calibtration state
     * 0 - uncalibrated
     * 1 - calibrated
     */
    async IsCalibrated():Promise<string>{
        const cmd='Cal,?';
        this.waitTime = 300;
        return (await this.SendCommand(cmd)).toString('ascii',cmd.length+1).replace(/\0/g, '');
    }
    /**
     * Sets the Temperature Scale value. (°C, °K, °F)
     * param value either 'c', 'k' or 'f'
    */
    async SetTemperatureScale(value:string):Promise<void>{
        if(value === 'c' || value === 'k' || value === 'f'){
            let cmd = 'S,';
            this.waitTime=300;
            await this.SendCommand(cmd+value);
        }
    }

     /**
     * Returns the currently used temperature scale
     * c - celsius
     * k - kelvin
     * f - fahrenheit
     */
    async GetTemperatureScale():Promise<string>{
        const cmd='S,?';
        this.waitTime=300;
        let res = (await this.SendCommand(cmd)).toString('ascii',cmd.length+1).replace(/\0/g, '');
        return res;
    }

    /**
     * Takes a sensor reading. Defaults to celsius. Use SetTemperatureScale() to change return type
     * a string if the desired scale format
     */
    async GetReading():Promise<string>{
        const cmd='R';
        this.waitTime=600;
        let res = (await this.SendCommand(cmd)).toString('ascii',1).replace(/\0/g, '');
        return res;
    }
}

export { RTD as default };
