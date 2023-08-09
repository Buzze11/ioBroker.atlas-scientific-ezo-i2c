import { EzoDeviceConfig, ImplementationConfigBase } from '../lib/adapter-config';
import { EzoHandlerBase } from './ezo-handler-base';
import * as ezo from '../atlas-scientific-i2c';

export interface PRSConfig extends EzoDeviceConfig {
    psiParamActive?: boolean;
    atmParamActive?: boolean;
    barParamActive?: boolean;
    kPaParamActive?: boolean;
    inh2oParamActive?: boolean;
    cmh2oParamActive?: boolean;
    alarmThreshold: number,
    alarmTolerance: number,
    alarmActive: boolean,
}

export default class PRS extends EzoHandlerBase<PRSConfig> {
    sensor = new ezo.PRS(this.adapter.i2cBus, parseInt(this.hexAddress), '', this.adapter);

    async startAsync(): Promise<void> {
        // Don`t start when Sensor is inactive
        if(!this.config.isActive)
            return;
            
        this.debug('Starting');
        const name = this.config.name || this.name;
        await this.adapter.extendObjectAsync(this.hexAddress, {
            type: 'device',
            common: {
                name: this.hexAddress + ' (' + name + ')',
                role: 'sensor',
            },
            native: this.config as any,
        });

        await this.CreateObjects();

        // Read current unit setup from sensor
        const deviceParameters = await this.sensor.ReadPressureUnits();
        await this.SetUnits(deviceParameters);

        const deviceName: string = await this.sensor.GetName();
        
        // Set Name if not set already
        if(!this.config.name){
            this.info('Devicename is not clear. Clearing Devicename');
            await this.sensor.SetName('');
        }
        else if(this.config.name != deviceName){
            this.info('Devicename has changed. Setting Devicename to: ' + this.config.name)
            await this.sensor.SetName(this.config.name);
        }

        // Init state objects which are not read from sensor (config objects)
        await this.InitNonReadStateValues();

        // Set Alarm Config
        await this.SetAlarmConfig(this.config.alarmActive, this.config.alarmThreshold, this.config.alarmTolerance);
       
        // Set all State change listeners
        await this.CreateStateChangeListeners();

        // Set Led usage
        await this.SetLed(this.config.isLedOn);

        // If a polling interval was set, initialize polling
        if (!!this.config.pollingInterval && this.config.pollingInterval > 0) {
            this.startPolling(async () => await this.GetAllReadings(), this.config.pollingInterval, 5000);
        }
    }
    
    async CreateStateChangeListeners(): Promise<void>{

        this.adapter.addStateChangeListener(this.hexAddress + '.IsPaused', async (_oldValue, _newValue) => {
            this.SetPausedFlag(_newValue.toString());
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Calibrate_Clear', async (_oldValue, _newValue) => {
            if(_newValue === true){
                this.DoCalibration('Clear', '');
            }
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Calibrate_Zeropoint', async (_oldValue, _newValue) => {
            if(_newValue.toString() != '')
                this.DoCalibration('Zeropoint','');
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Calibrate_High', async (_oldValue, _newValue) => {
            if(_newValue.toString() != '')
                this.DoCalibration('High',_newValue.toString());
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Alarm_enabled', async (_oldValue, _newValue) => {
            if(_newValue != _oldValue){
                this.config.alarmActive = _newValue?true:false;
                await this.SetAlarmConfig(this.config.alarmActive, this.config.alarmThreshold, this.config.alarmTolerance);
            }    
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Alarm_Threshold', async (_oldValue, _newValue) => {
            if(_newValue != _oldValue){
                this.config.alarmThreshold = parseFloat(_newValue.toString());
                await this.SetAlarmConfig(this.config.alarmActive, this.config.alarmThreshold, this.config.alarmTolerance);
            }
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Alarm_Tolerance', async (_oldValue, _newValue) => {
            if(_newValue != _oldValue){
                this.config.alarmTolerance = parseFloat(_newValue.toString());
                await this.SetAlarmConfig(this.config.alarmActive, this.config.alarmThreshold, this.config.alarmTolerance);
            }
        });
    }

    async CreateObjects(): Promise<void>{
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Devicestatus', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PRS'),
                type: 'string',
                role: 'info.status',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'IsPaused', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PRS'),
                type: 'boolean',
                role: 'switch',
                write: true,
                states: {   true: "paused", 
                            false: "unpaused", 
                },
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Pressure_Value', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PRS'),
                type: 'string',
                role: 'value',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Info', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PRS'),
                type: 'string',
                role: 'info.sensor',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Led_on', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PRS'),
                type: 'boolean',
                role: 'value',
                write: false,
                states: {   true: "on", 
                            false: "off", 
                },
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Devicename', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PRS'),
                type: 'string',
                role: 'info.name',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'IsCalibrated', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PRS'),
                type: 'string',
                role: 'value',
                write: false,
                states: {   "0": "uncalibrated", 
                            "1": "only zero point", 
                            "2": "only high point",
                            "3": "zero point and high point", 
                        },
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Calibrate_Clear', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PRS'),
                type: 'boolean',
                role: 'switch',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Calibrate_Zeropoint', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PRS'),
                type: 'boolean',
                role: 'switch',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Calibrate_High', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PRS'),
                type: 'string',
                role: 'value',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Units_enabled', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PRS'),
                type: 'string',
                role: 'value',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Alarm_enabled', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PRS'),
                type: 'boolean',
                role: 'switch',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Alarm_Threshold', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PRS'),
                type: 'string',
                role: 'value',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Alarm_Tolerance', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PRS'),
                type: 'string',
                role: 'value',
                write: false,
            },
            //native: any
        });
    }

    async InitNonReadStateValues():Promise<string>{
        try{
            await this.setStateAckAsync('IsPaused', this.pausedState);
            await this.setStateAckAsync('Calibrate_Clear', false);
            await this.setStateAckAsync('Calibrate_Zeropoint', false);
            await this.setStateAckAsync('Calibrate_High', '');
            return "State objects initialized successfully";
        }
        catch{
            this.error('Error occured on initializing state objects');
        }
    }


    async stopAsync(): Promise<void> {
        this.debug('Stopping');
        this.readingActive = false;
        this.stopPolling();
    }

    async GetAllReadings(): Promise<void>{
        try{
            if(this.sensor != null && this.pausedState === false){

                this.readingActive = true;

                const ds = await this.sensor.GetDeviceStatus();
                await this.setStateAckAsync('Devicestatus', ds);

                const pv = await this.sensor.GetReading();
                await this.setStateAckAsync('Pressure_Value', pv);

                const info = await this.sensor.GetInfo();
                await this.setStateAckAsync('Info', info);

                const useLed = await this.sensor.GetLED();
                await this.setStateAckAsync('Led_on', useLed);

                const name = await this.sensor.GetName();
                await this.setStateAckAsync('Devicename', name);

                const ic = await this.sensor.IsCalibrated();
                await this.setStateAckAsync('IsCalibrated', ic);

                const ue = await this.sensor.ReadPressureUnits();
                await this.setStateAckAsync('Units_enabled', ue);

                const ac = await this.sensor.GetAlarmSetupParameters;
                if(ac?.length === 3){
                    if(ac[0]==='1')
                        await this.setStateAckAsync('Alarm_enabled', true);
                    else if(ac[0]==='0')
                        await this.setStateAckAsync('Alarm_enabled', false);
                    await this.setStateAckAsync('Alarm_Threshold', parseFloat(ac[1]));
                    await this.setStateAckAsync('Alarm_Tolerance', parseFloat(ac[2]));
                }
                
                this.readingActive = false;
            }
        }
        catch{
            this.error('Error occured on getting Device readings');
            this.readingActive = false;
        }
    }

    public async DoCalibration(calibrationtype:string, Value:string):Promise<string>{
        try{
            this.info('Calibrationtype: ' + calibrationtype);
            
            await this.WaitForFinishedReading();
            
            switch(calibrationtype){
                case 'Clear':
                    await this.sensor.ClearCalibration();
                    await this.setStateAckAsync('Calibrate_Clear', false);
                    return 'PRS Calibration was cleared successfully';
                case 'Zeropoint':
                    await this.sensor.CalibrateZeroPoint();
                    await this.setStateAckAsync('Calibrate_Zeropoint', false);
                    return 'Zeropoint calibration was done successfully';
                case 'High':
                    await this.sensor.CalibrateHigh(parseFloat(Value));
                    await this.setStateAckAsync('Calibrate_High', '');
                    return 'High Calibration was done successfully';
            }
           
        }
        catch{
            return 'Error occured on PRS Calibration. Calibration Task failed';
        }
    }

    public async SetUnits(activatedUnits: string): Promise<string> {
        // Set reading parameters for DO Reading format related to configuration

        try{
            const params: string[] = activatedUnits.split(",");

            if(this.config.psiParamActive && !params.includes('psi')){
                await this.sensor.SetPressureUnit('psi', true);
            }
            else if (!this.config.psiParamActive && params.includes('psi')){
                await this.sensor.SetPressureUnit('psi', false);
            }

            if(this.config.atmParamActive && !params.includes('atm')){
                await this.sensor.SetPressureUnit('atm', true);
            }
            else if (!this.config.atmParamActive && params.includes('atm')){
                await this.sensor.SetPressureUnit('atm', false);
            }

            if(this.config.barParamActive && !params.includes('bar')){
                await this.sensor.SetPressureUnit('bar', true);
            }
            else if (!this.config.barParamActive && params.includes('bar')){
                await this.sensor.SetPressureUnit('bar', false);
            }

            if(this.config.kPaParamActive && !params.includes('kPa')){
                await this.sensor.SetPressureUnit('kPa', true);
            }
            else if (!this.config.kPaParamActive && params.includes('kPa')){
                await this.sensor.SetPressureUnit('kPa', false);
            }
            
            if(this.config.inh2oParamActive && !params.includes('inh2o')){
                await this.sensor.SetPressureUnit('inh2o', true);
            }
            else if (!this.config.inh2oParamActive && params.includes('inh2o')){
                await this.sensor.SetPressureUnit('inh2o', false);
            }
                        
            if(this.config.cmh2oParamActive && !params.includes('cmh2o')){
                await this.sensor.SetPressureUnit('cmh2o', true);
            }
            else if (!this.config.cmh2oParamActive && params.includes('cmh2o')){
                await this.sensor.SetPressureUnit('cmh2o', false);
            }
            return 'Successfully configured PRS parameters';
        }
        catch{
            return 'Error occured on setting PRS parameters';
        }
    }

    public async SetAlarmConfig(enabled: boolean, threshold:number, tolerance:number): Promise<string> {
        // Set alarm configuration from configuration

        try{
            await this.sensor.SetAlarm(enabled, threshold, tolerance)
            
            return 'Successfully configured PRS alarm';
        }
        catch{
            return 'Error occured on configuring PRS alarm';
        }
    }

}
