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
        this.waitTime = 300;
        await this.SendCommand('U,'+unit);
        this.waitTime = 300;
        await this.SendCommand('U,'+(isEnabled?'1':'0'));
    }

    /**
     * Gets a CSV string of the current output pressure units
     *
     * Example: 'bar,psi,' if Bar and PSI are enabled
     * returns CSV string.
     */
    async ReadPressureUnits(): Promise<string>{
        const cmd = 'U,?';
        this.waitTime=300;
        const res = (await this.SendCommand(cmd)).toString('ascii',cmd.length+1);
        return res;
    }

    /**
     * Gets 1 reading.
     * returns CSV string of readings corresponding to enabled parameters
     */
    async GetReading(): Promise<string>{
        this.waitTime=900;
        const res = (await this.SendCommand('R')).toString('ascii',1);
        return res;
    }

    /**
     * Resets all calibration points to ideal.
     */
    async ClearCalibration(): Promise<void>{
        this.waitTime = 300;
        await this.SendCommand("Cal,clear");
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
        this.waitTime=300;
        const res = (await this.SendCommand(cmd)).toString('ascii',cmd.length+1).replace(/\0/g, '');
        return res;
    } 

    /**
     * Performs zero point calibration.
     */
    async CalibrateZeroPoint(){
        this.waitTime=900;
        await this.SendCommand('Cal,0');
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

    /**
     * Enables or disables alarm
     * is<Enabled: true = alarm pin activated, false = alarmpin deactivated
     * The alarm pin will = 1 when pressure levels are > alarm set point. 
     * Alarm tolerance sets how far below the set point pressure levels need to drop before the pin will = 0 again.
     */
    async SetAlarm(isEnabled: boolean, threshold: number, tolerance: number): Promise<void>{
        this.waitTime = 300;
        await this.SendCommand('Alarm,en,'+(isEnabled?'1':'0'));
        await this.SendCommand('Alarm,' + threshold.toString());
        await this.SendCommand('Alarm,tol,' + tolerance.toString());
    }

        /**
     * Returns the alarm state 
     * returns the current alarm setup parametrization
     * [0] = alarm threshold
     * [1] = alarm tolerance
     * [0] = alarm active = 1 / deactive = 0
     */
        async GetAlarmSetupParameters():Promise<string[]>{
            const cmd='Alarm,?';
            this.waitTime=300;
            const res = (await this.SendCommand(cmd)).toString('ascii', cmd.length+1).replace(/\0/g, '').split(',');
            return res;
        } 

}

export { PRS as default };
