import { AtlasScientificEzoI2cAdapter } from "../main";
import { EZODevice } from "./ezo_device";

/**
 * Wrapper class for ORP EZO circuit
 */
export class ORP extends EZODevice{

    constructor(i2c_bus,address,info, protected readonly adapter: AtlasScientificEzoI2cAdapter){
        super(i2c_bus,address,info, adapter);
    }

    /**
     * Clears calibration data.
     */
    async ClearCalibration():Promise<void>{
        this.waitTime = 300;
        await this.SendCommand('Cal,clear');
    }

    /**
     * Calibrates the ORP circuit to a set value.
     * The EZO ORP circuit can be calibrated to any known ORP value.
     */
    async Calibrate(value: number):Promise<void>{
        this.waitTime=900;
        await this.SendCommand('Cal,'+ value);
    }

    /**
     * Returns the calibration status
     */
    async IsCalibrated():Promise<string>{
        this.waitTime = 300;
        const cmd='Cal,?';
        return (await this.SendCommand(cmd)).toString('ascii',cmd.length+1).replace(/\0/g, '');
    }

    /**
     * Takes a single reading
     */
    async GetReading():Promise<string>{
        this.waitTime=900;
        const r= (await this.SendCommand('R')).toString('ascii',1).replace(/\0/g, '');
        return r;
    }
}

export { ORP as default };
