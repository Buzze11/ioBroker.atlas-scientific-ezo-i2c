import { AtlasScientificEzoI2cAdapter } from "../main";
import { EZODevice } from "./ezo_device";
/**
 * Wrapper class for EC EZO circuit
 */
export class EC extends EZODevice{
    
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
    async SetProbeType(value: string): Promise<void>{
        if(!value)
            return;
        await this.SendCommand('K,'+value);
        this.waitTime=300;
    }

    async GetProbeType(): Promise<string>{
        const cmd='K,?';
        this.waitTime=300;
        //returns K,n
        //strange:  normally these commands have a '?' prefixed to their return message
        const k = (await this.SendCommand(cmd)).toString('ascii',cmd.length);
        this.waitTime=600;
        return k;
    }

    /**
     * Sets Temperature Compensation value. Default is 25C.
     * 
     * This is not maintained if power is cut.
     * value Celsius
     * takeReading Defaults to false. If true, immediately returns a new reading after setting the value. 
     * returns Nothing unless takeReading=true
     */
    async SetTemperatureCompensation(value: number,takeReading=false): Promise<any>{
        if(takeReading){
            this.waitTime=900;
            const r = (await this.SendCommand('RT,'+value)).toString('ascii',1);
            this.waitTime=300;
            return r;
        }else{
            await this.SendCommand('T,'+value);
            this.waitTime=300;
            return null;
        }
    }

    /**
     * Gets the current compensated temperature value.
     * returns floating point number in ASCII
     */
    async GetTemperatureCompensation(): Promise<string>{
        const cmd='T,?';
        const res = (await this.SendCommand(cmd)).toString('ascii',cmd.length+1);
        this.waitTime=300;
        return res;
    }

    /**
     * Enables/disables parameters from the output string.
     * 
     * 'EC' - conductivity
     * 
     * 'TDS' - total dissolved solids
     * 
     * 'S' - salintiy
     * 
     * 'SG' - specific gravity
     */
    async SetParameter(parameter: string, isEnabled: boolean): Promise<void>{
        await this.SendCommand('O,'+parameter+','+(isEnabled?'1':'0'));
        this.waitTime=300;
    }

    /**
     * Gets a CSV string of the enabled output parameters
     * 
     * Example: 'EC,TDS,S,SG' if all are enabled
     * returns CSV string.
     */
    async GetParametersEnabled(): Promise<string>{
        const cmd = 'O,?';
        const res = (await this.SendCommand(cmd)).toString('ascii',cmd.length+1);
        this.waitTime=300;
        return res;
    }

    /**
     * Sets a custom TDS conversion factor. Default is 0.54.
     * 
     * Common conversion factors:
     * 
     * NaCl : 0.47-0.50
     * 
     * KCL : 0.50-0.57
     * 
     * "442" : 0.65-0.85
     * value Value will be clamped to 0.01 - 1.00 range
     */
    async SetTDSConversionFactor(value: number): Promise<void>{
        value = Math.min(1.00,Math.max(value,0.01));
        await this.SendCommand('TDS,'+value);
        this.waitTime=300;
    }

    /**
     * Gets the conversion factor being used.
     * returns string of floating point number
     */
    async GetTDSConversionFactor(): Promise<string>{
        const cmd='TDS,?';
        const res = (await this.SendCommand(cmd)).toString('ascii',cmd.length+1);
        this.waitTime=300;
        return res;
    }

    /**
     * Gets 1 reading.
     * returns CSV string of readings corresponding to enabled parameters
     */
    async GetReading(): Promise<string>{
        this.waitTime=600;
        const r= (await this.SendCommand('R')).toString('ascii',1);
        this.waitTime=300;
        return r;
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
     * 1 = One Point 
     * 2 = Two Point
     */
    async IsCalibrated():Promise<string>{
        const cmd='Cal,?';
        const res = (await this.SendCommand(cmd)).toString('ascii',cmd.length+1).replace(/\0/g, '');
        this.waitTime=300;
        return res;
    } 

    /**
     * Performs dry calibration.
     * WARNING: This will clear any previous calibration!
     */
    async CalibrateDry(){
        await this.SendCommand("Cal,dry,");
        this.waitTime=600;
    }

    /**
     * Performs single point calibration.
     * val: any value
     */
    async CalibrateSinglepoint(val?: number){
        if(!val)
            return;
        this.waitTime=900;
        await this.SendCommand('Cal,' + val.toString());
        this.waitTime=600;
    }

    /**
     * Performs low end calibration.
     * val: any value
     */
    async CalibrateLow(val?: number){
        if(!val)
            return;
        this.waitTime=900;
        await this.SendCommand('Cal,low,' + val.toString());
        this.waitTime=600;
    }

    /**
     * Performs high end calibration
     * val: any value
     */    
    async CalibrateHigh(val?: number){
        if(!val)
            return;
        this.waitTime=900;
        await this.SendCommand('Cal,high,' + val.toString());
        this.waitTime=600;
    }
}

export { EC as default };
