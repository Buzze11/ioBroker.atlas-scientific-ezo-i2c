import { AtlasScientificEzoI2cAdapter } from "../main";
import { EZODevice } from "./ezo_device";
/**
 * Wrapper class for PRS EZO embedded Pressure Sensor
 */
export class PRS extends EZODevice{
    
    constructor(i2c_bus,address,info, protected readonly adapter: AtlasScientificEzoI2cAdapter){
        super(i2c_bus,address,info,adapter);
        this.readBufferSize=40;
    }

    /**
     * Sets the probe type. '1.0' is the defaule value
     * 
     * Current known probe types:  '0.1','1.0', and '10' 
     * value floating point in ASCII 
     */
    // async SetProbeType(value: string): Promise<void>{
    //     if(!value)
    //         return;
    //     await this.SendCommand('K,'+value);
    //     this.waitTime=300;
    // }

    // async GetProbeType(): Promise<string>{
    //     const cmd='K,?';
    //     this.waitTime=300;
    //     //returns K,n
    //     //strange:  normally these commands have a '?' prefixed to their return message
    //     const k = (await this.SendCommand(cmd)).toString('ascii',cmd.length);
    //     this.waitTime=600;
    //     return k;
    // }

    /**
     * Sets Temperature Compensation value. Default is 25C.
     * 
     * This is not maintained if power is cut.
     * value Celsius
     * takeReading Defaults to false. If true, immediately returns a new reading after setting the value. 
     * returns Nothing unless takeReading=true
     */
    // async SetTemperatureCompensation(value: number,takeReading=false): Promise<any>{
    //     if(takeReading){
    //         this.waitTime=900;
    //         const r = (await this.SendCommand('RT,'+value)).toString('ascii',1);
    //         this.waitTime=300;
    //         return r;
    //     }else{
    //         await this.SendCommand('T,'+value);
    //         this.waitTime=300;
    //         return null;
    //     }
    // }

    /**
     * Gets the current compensated temperature value.
     * returns floating point number in ASCII
     */
    // async GetTemperatureCompensation(): Promise<string>{
    //     const cmd='T,?';
    //     const res = (await this.SendCommand(cmd)).toString('ascii',cmd.length+1);
    //     this.waitTime=300;
    //     return res;
    // }

    /**
     * Will set the desired pressure Unit
     * 
     * param: unit
     *  'psi ' - output will be in psi
     *  'atm' - output will be in atm
     *  'bar' - output will be in bar
     *  'kPa' - output will be in kPa
     *  'inh2o' - output will be in  inches of water
     *  'cmh2o' - output will be in cm of water
     * param: addRemove
     *  true to add parameter
     *  false to remove parameter
     */
    async SetPressureUnit(unit: string, isEnabled: boolean): Promise<void>{
        await this.SendCommand('U,'+unit);
        this.waitTime = 300;
        await this.SendCommand('U,'+(isEnabled?'1':'0'));
        this.waitTime = 300;
    }

    /**
     * Gets a CSV string of the current output pressure units
     *
     * Example: 'bar,psi,' if Bar and PSI are enabled
     * returns CSV string.
     */
    async ReadPressureUnits(): Promise<string>{
        const cmd = 'U,?';
        const res = (await this.SendCommand(cmd)).toString('ascii',cmd.length+1);
        this.waitTime=300;
        return res;
    }

    // /**
    //  * Sets a custom TDS conversion factor. Default is 0.54.
    //  * 
    //  * Common conversion factors:
    //  * 
    //  * NaCl : 0.47-0.50
    //  * 
    //  * KCL : 0.50-0.57
    //  * 
    //  * "442" : 0.65-0.85
    //  * value Value will be clamped to 0.01 - 1.00 range
    //  */
    // async SetTDSConversionFactor(value: number): Promise<void>{
    //     value = Math.min(1.00,Math.max(value,0.01));
    //     await this.SendCommand('TDS,'+value);
    //     this.waitTime=300;
    // }

    // /**
    //  * Gets the conversion factor being used.
    //  * returns string of floating point number
    //  */
    // async GetTDSConversionFactor(): Promise<string>{
    //     const cmd='TDS,?';
    //     const res = (await this.SendCommand(cmd)).toString('ascii',cmd.length+1);
    //     this.waitTime=300;
    //     return res;
    // }

    /**
     * Gets 1 reading.
     * returns CSV string of readings corresponding to enabled parameters
     */
    async GetReading(): Promise<string>{
        const res = (await this.SendCommand('R')).toString('ascii',1);
        this.waitTime=900;
        return res;
    }

    /**
     * Resets all calibration points to ideal.
     */
    async ClearCalibration(): Promise<void>{
        await this.SendCommand("Cal,clear");
        this.waitTime = 300;
    }

    /**
     * Returns numbers of Calibration points (0-2)
     * 0 = uncalibrated
     * 1 = only zero point calibrated
     * 2 = only high point calibrated
     * 3 = zero and high point calibrated
     */
    async IsCalibrated():Promise<string>{
        const cmd='Cal,?';
        const res = (await this.SendCommand(cmd)).toString('ascii',cmd.length+1).replace(/\0/g, '');
        this.waitTime=300;
        return res;
    } 

    /**
     * Performs zero point calibration.
     */
    async CalibrateZeroPoint(){
        await this.SendCommand('Cal,0');
        this.waitTime=900;
    }

    /**
     * Performs high point calibration. Calibration should be done using the pressure scale you have set
     * the sensor to.
     * valInCurrentScale: the desired value representing 50 psi but converted to the selected scale
     * Example: Readings are set to bar.
     *          High point calibration = 3.44
     *          (3.44 bar = 50 psi)
     */
    async CalibrateHigh(valInCurrentScale?: number){
        if(!valInCurrentScale)
            return;
        this.waitTime = 900;
            await this.SendCommand('Cal,' + valInCurrentScale.toString());
    }

}

export { PRS as default };
