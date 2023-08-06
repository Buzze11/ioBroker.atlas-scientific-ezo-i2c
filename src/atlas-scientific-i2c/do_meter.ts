import { AtlasScientificEzoI2cAdapter } from "../main";
import { EZODevice } from "./ezo_device";

/**
 * Wrapper class for DO EZO circuit
 */
export class DO extends EZODevice{


    constructor(i2c_bus,address,info, protected readonly adapter: AtlasScientificEzoI2cAdapter){
        super(i2c_bus,address,info, adapter);
    }

    /**
     * Resets calibration settings
     */
    async ClearCalibration(){
        this.waitTime = 300;
        await this.SendCommand('Cal,clear');
    }

    /**
     * Single Point Calibration for Atmospheric Oxygen
     */
    async CalibrateAtmosphericOxygen(){
        this.waitTime=1300;
        await this.SendCommand('Cal');
    }

    /**
     * Two Point Calibration for 0 Dissolved Oxygen
     */
    async Calibrate0DissolvedOxygen(){
        this.waitTime=1300;
        await this.SendCommand('Cal,0');
    }

    /**
     * Returns a status code on the calibtration state
     * 0 - uncalibrated
     * 1 - single point calibrated
     * 2 - two point calibrated
     */
    async IsCalibrated():Promise<string>{
        const cmd='Cal,?';
        this.waitTime = 300;
        return (await this.SendCommand(cmd)).toString('ascii',cmd.length+1).replace(/\0/g, '');
    }

    /**
     * Sets the Temperature Compensation value. Optionally takes and returns an immediate reading. 
     * takeReading Defaults to false. 
     * If takeReading is true, it returns the Dissolved Oxygen reading. Otherwise, returns nothing.
     */
    async SetTemperatureCompensation(value:number, takeReading=false):Promise<string>{
        let cmd = 'T,';
        if(takeReading){
            this.waitTime=900;
            cmd='RT,';
            const r = (await this.SendCommand(cmd+value)).toString('ascii',cmd.length+1).replace(/\0/g, '');
            this.waitTime=300;
            return r;
        }else{
            await this.SendCommand(cmd+value);
            return null;
        }
    }

    /**
     * Gets the current compensated temperature value
     */
    async GetTemperatureCompensation():Promise<string>{
        const cmd='T,?';
        this.waitTime = 300;
        return (await this.SendCommand(cmd)).toString('ascii',cmd.length+1).replace(/\0/g, '');
    }

    /**
     * Sets the SalinityCompensation. 
     * 
     * If the conductivity of your water is less than 2,500μS this command is irrelevant
     * value Assumed μS unless isPpt=true.
     * isPpt Defaults to false. 
     */
    async SetSalinityCompensation(value:number, isPpt=false):Promise<void>{
        this.waitTime = 300;
        await this.SendCommand('S,'+value+(isPpt?',ppt':''));
    }

    /**
     * Gets the current SalinityCompensation value and whether it is in μS or ppt
     * returns 'value' and 'isPpt'
     */
    async GetSalinityCompensation():Promise<string[]>{
        const cmd = 'S,?';
        this.waitTime = 300;
        const resp=(await this.SendCommand(cmd)).toString('ascii',cmd.length+1).replace(/\0/g, '').split(',');
        return resp;
    }

    /**
     * Sets the PressureCompensation value in kPa.
     * 
     * This parameter can be omitted if the water is less than 10 meters deep
     */
    async SetPressureCompensation(value:string):Promise<void>{
        this.waitTime = 300;
        await this.SendCommand('P,'+value);
    }

    /**
     * Returns the current compensated pressure value in kPa.
     */
    async GetPressureCompensation():Promise<string>{
        const cmd='P,?';
        this.waitTime = 300;
        return (await this.SendCommand(cmd)).toString('ascii',cmd.length+1).replace(/\0/g, '');
    }

    /**
     * Sets the values to be returned when a reading is taken.
     * 'mg' - mg/L : enabled by default
     * '%' - percent saturation : disabled by default
     */
    async SetParameter(parameter:string,isEnabled:boolean):Promise<void>{
        this.waitTime = 300;
        await this.SendCommand('O,'+parameter+','+(isEnabled?'1':'0'));
    }

    /**
     * Gets a comma seperated string of the currently enabled parameters
     */
    async GetParametersEnabled():Promise<string>{
        const cmd='O,?';
        this.waitTime = 300;
        return (await this.SendCommand(cmd)).toString('ascii',cmd.length+1).replace(/\0/g, '');
    }

    /**
     * Takes a sensor reading. Defaults to mg/L. Use SetParameter() to change return type
     * a CSV string if both mg/L and % sat are enabled
     */
    async GetReading():Promise<string>{
        this.waitTime=600;
        const r =(await this.SendCommand('R')).toString('ascii',1).replace(/\0/g, '');
        return r;
    }
}

export { DO as default };
