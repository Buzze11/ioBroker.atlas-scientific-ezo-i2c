import { AtlasScientificEzoI2cAdapter } from "../main";
import { EZODevice } from "./ezo_device";
/**
 * Wrapper class for pH EZO circuit
 */
export class pH extends EZODevice{ 
    
    constructor(i2c_bus,address,info, protected readonly adapter: AtlasScientificEzoI2cAdapter){
        super(i2c_bus,address,info, adapter);
    }
    
    /**
     * Gets a single pH reading
     */
    async Read(): Promise<number>{
        this.waitTime = 900;
        const resp=await this.SendCommand('R');
        return Number.parseFloat(resp.toString('ascii',1).replace(/\0/g, ''));
    }

    /**
     * Resets all calibration points to ideal.
     */
    async ClearCalibration(): Promise<void>{
        this.waitTime = 300;
        await this.SendCommand("Cal,clear");
    }

    /**
     * Returns numbers of Calibration points (0-3)
     */
    async IsCalibrated():Promise<string>{
        this.waitTime = 300;
        const cmd='Cal,?';
        return (await this.SendCommand(cmd)).toString('ascii',cmd.length+1).replace(/\0/g, '');
    } 

    /**
     * Performs single point calibration at the mid point.
     * WARNING: This will clear any previous calibration!
     * ph defaults to 7.00
     */
    async CalibrateMid(ph?: number){
        if(!ph)
            ph = 7.00;
        this.waitTime=900;
        await this.SendCommand('Cal,mid,'+ ph.toString());
        this.waitTime=300;
    }

    /**
     * Performs two point calibration at low point.
     * ph defaults to 4.00
     */
    async CalibrateLow(ph?: number){
        if(!ph)
            ph = 4.00;
        this.waitTime=900;
        await this.SendCommand('Cal,low,'+ph.toString());
        this.waitTime=300;
    }

    /**
     * Performs three point calibration at high point
     * ph defaults to 10.0
     */    
    async CalibrateHigh(ph?: number){
        if(!ph)
            ph = 10.00;
        this.waitTime=900;
        await this.SendCommand('Cal,high,'+ph.toString());
        this.waitTime=300;
    }

    /**
     * Takes a single pH reading
     */
    async GetReading():Promise<string>{
        this.waitTime=900;
        const r= (await this.SendCommand('R')).toString('ascii',1).replace(/\0/g, '');
        return r;
    }    

    /**
     * Gets the current Temperature Compensation in degrees Celsius. 
     * returns Celsius
     */
    async GetTemperatureCompensation(): Promise<string>{
        this.waitTime = 300;
        const cmd='T,?';
        return (await this.SendCommand(cmd)).toString('ascii',cmd.length+1).replace(/\0/g, '');
    }

    /**
     * Sets the Temperature Compensation value.  This is lost when power is cut.
     * takeReading defaults false. If true, will return a pH reading immediately.
     * returns Nothing unless takeReading=true
     */
    async SetTemperatureCompensation(value: number, takeReading = false): Promise<string | void>{
        if(takeReading){
            this.waitTime=900;
            const r= (await this.SendCommand('RT,'+value)).toString('ascii',1).replace(/\0/g, '');
            this.waitTime=300;
            return r;
        }else{
            this.waitTime = 300;
            await this.SendCommand('T,'+value);
        }
    }

    /**
     * After calibrating, shows how closely (in percentage) the calibrated pH probe is working compared to the “ideal” pH probe. 
     * 'acid' and 'base' are percentages where 100% matches the ideal probe.  'zeroPoint' is the millivolt offset from true zero.
     */
    async GetSlope(): Promise<string[]>{
        const cmd = 'Slope,?';
        this.waitTime=300;
        return (await this.SendCommand(cmd)).toString('ascii', cmd.length+1).replace(/\0/g, '').split(',');
        // return { acid:resp[0],
        //         base:resp[1],
        //         zeroPoint:resp[2]        
        // }
    }
}

export { pH as default };
