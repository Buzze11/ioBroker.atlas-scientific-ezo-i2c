import { EZODevice } from '../atlas-scientific-i2c';
import { EzoDeviceConfig, ImplementationConfigBase } from '../lib/adapter-config';
import { Polling } from '../lib/async';
import { EzoHandlerBase } from './ezo-handler-base';
import * as ezo from '../atlas-scientific-i2c';
import { StateValue } from '../lib/state';

export interface DOConfig extends EzoDeviceConfig {
    mgParamActive?: boolean;
    percentParamActive?: boolean;
    isPpt?: boolean;
}

export default class DO extends EzoHandlerBase<DOConfig> {
    sensor = new ezo.DO(this.adapter.i2cBus, parseInt(this.hexAddress), '', this.adapter);

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

        // Read current setup from sensor
        const deviceParameters = await this.sensor.GetParametersEnabled();
        const deviceName: string = await this.sensor.GetName();
        
        // Set Name if not set already
        if(!this.config.name){
            this.info('Devicename is not clear. Clearing Devicename');
            await this.sensor.SetName('');
        }
        else if(this.config.name !== deviceName){
            this.info('Devicenamehas changed. Setting Devicename to: ' + this.config.name)
            await this.sensor.SetName(this.config.name);
        }     

        // Set reading parameters for DO Reading format related to configuration
        if(this.config.mgParamActive && !deviceParameters.includes('MG')){
            await this.sensor.SetParameter('MG', true);
        }
        else if (!this.config.mgParamActive && deviceParameters.includes('MG')){
            await this.sensor.SetParameter('MG', false);
        }
        if(this.config.percentParamActive && !deviceParameters.includes('%')){
            await this.sensor.SetParameter('%', true);
        }
        else if (!this.config.percentParamActive && deviceParameters.includes('%')){
            await this.sensor.SetParameter('%', false);
        }

        // Set Led usage
        await this.SetLed(this.config.isLedOn);
        

        // Set all State change listeners
        await this.CreateStateChangeListeners();

        // Init state objects which are not read from sensor (config objects)
        await this.InitNonReadStateValues();

        // If active and polling interval was set, initialize polling
        if (this.config.isActive && !!this.config.pollingInterval && this.config.pollingInterval > 0) {
            this.startPolling(async () => await this.GetAllReadings(), this.config.pollingInterval, 5000);
        }
        
    }

    async CreateStateChangeListeners(): Promise<void>{

        this.adapter.addStateChangeListener(this.hexAddress + '.Temperature_compensation', async (_oldValue, _newValue) => {
            this.SetTemperatureCompensation(_newValue.toString());
        });

        this.adapter.addStateChangeListener(this.hexAddress + '.Salinity_compensation', async (_oldValue, _newValue) => {
            const sc = await this.sensor.GetSalinityCompensation();
            if(sc[1]== 'ppt'){
                this.SetSalinityCompensation(_newValue.toString(), 'true');
            }
            else{
                this.SetSalinityCompensation(_newValue.toString(), 'false');
            }
        });

        this.adapter.addStateChangeListener(this.hexAddress + '.Pressure_compensation', async (_oldValue, _newValue) => {
            this.SetPressureCompensation(_newValue.toString());
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.IsPaused', async (_oldValue, _newValue) => {
            this.SetPausedFlag(_newValue.toString());
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Calibrate_Clear', async (_oldValue, _newValue) => {
            if(_newValue === true){
                this.DoCalibration('Clear');
            }
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Calibrate_Atmospheric', async (_oldValue, _newValue) => {
            if(_newValue === true){
                this.DoCalibration('Atmospheric');
            }
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Calibrate_Zero_DO', async (_oldValue, _newValue) => {
            if(_newValue === true){
                this.DoCalibration('0DO');
            }
        });
    }

    async InitNonReadStateValues():Promise<string>{
        try{
            await this.setStateAckAsync('IsPaused', this.pausedState);
            await this.setStateAckAsync('Calibrate_Clear', false);
            await this.setStateAckAsync('Calibrate_Atmospheric', false);
            await this.setStateAckAsync('Calibrate_Zero_DO', false);
            return "State objects initialized successfully";
        }
        catch{
            this.error('Error occured on initializing state objects');
        }
    }


    async CreateObjects(): Promise<void>{
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Devicestatus', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'string',
                role: 'info.status',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'IsPaused', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'boolean',
                role: 'switch',
                write: true,
                states: {   true: "paused", 
                            false: "unpaused", 
                },
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Dissolved_Oxygen', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'string',
                role: 'value',
                unit: 'mg/L, Saturation %',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Temperature_compensation', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'number',
                role: 'value.temperature',
                unit: '°C',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Salinity_compensation', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'number',
                role: 'value',
                unit: 'uS / ppt',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Salinity_compensation_ispPt', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name),
                type: 'boolean',
                role: 'value',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Pressure_compensation', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'number',
                role: 'value.pressure',
                unit: 'kPa',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Parameters_enabled', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'string',
                role: 'value',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Info', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'string',
                role: 'info.sensor',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Led_on', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
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
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'string',
                role: 'info.name',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'IsCalibrated', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'string',
                role: 'value',
                write: false,
                states: {   "0": "uncalibrated", 
                            "1": "Atmospheric", 
                            "2": "Atmospheric & 0DO", 
                },
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Calibrate_Clear', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'boolean',
                role: 'switch',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Calibrate_Atmospheric', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'boolean',
                role: 'switch',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Calibrate_Zero_DO', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'boolean',
                role: 'switch',
                write: true,
            },
            //native: any
        });
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

                const ox = await this.sensor.GetReading();
                await this.setStateAckAsync('Dissolved_Oxygen', ox);

                const tc = await this.sensor.GetTemperatureCompensation();
                await this.setStateAckAsync('Temperature_compensation', parseFloat(tc));

                const sc = await this.sensor.GetSalinityCompensation();
                await this.setStateAckAsync('Salinity_compensation', parseFloat(sc[0]));
                await this.setStateAckAsync('Salinity_compensation_ispPt', sc[1] == 'ppt');
                
                const pc = await this.sensor.GetPressureCompensation();
                await this.setStateAckAsync('Pressure_compensation', parseFloat(pc));

                const pe = await this.sensor.GetParametersEnabled();
                await this.setStateAckAsync('Parameters_enabled', pe);

                const info = await this.sensor.GetInfo();
                await this.setStateAckAsync('Info', info);

                const useLed = await this.sensor.GetLED();
                await this.setStateAckAsync('Led_on', useLed);

                const name = await this.sensor.GetName();
                await this.setStateAckAsync('Devicename', name);

                const ic = await this.sensor.IsCalibrated();
                await this.setStateAckAsync('IsCalibrated', ic);

                this.readingActive = false;

            }
        }
        catch{
            this.error('Error occured on getting Device readings');
            this.readingActive = false;
        }
    }

    public async DoCalibration(calibrationtype:string):Promise<string>{
        try{

            await this.WaitForFinishedReading();

            this.info('Calibrationtype: ' + calibrationtype);
            switch(calibrationtype){
                case 'Clear':
                    await this.sensor.ClearCalibration();
                    await this.setStateAckAsync('Calibrate_Clear', false);
                    return 'DO Calibration was cleared successfully';
                    break;
                case 'Atmospheric':
                    await this.sensor.CalibrateAtmosphericOxygen();
                    await this.setStateAckAsync('Calibrate_Atmospheric', false);
                    return 'Atmospheric DO Calibration was done successfully';
                    break;
                case '0DO':
                    await this.sensor.Calibrate0DissolvedOxygen();
                    await this.setStateAckAsync('Calibrate_Zero_DO', false);
                    return '0DO Calibration was done successfully';
                    break;
            }
        }
        catch{
            return 'Error occured on DO Calibration. Calibration Task failed';
        }
    }

    public async SetTemperatureCompensation(compensationValue:string):Promise<string>{
        try{
            this.info('Temperaturecompensation: ' + compensationValue);
            await this.sensor.SetTemperatureCompensation(parseFloat(compensationValue));
        }
        catch{
            return 'Error occured on setting temperature compensation';
        }
    }

    public async SetPressureCompensation(compensationValue:string):Promise<string>{
        try{
            this.info('Pressurecompensation: ' + compensationValue);
            await this.sensor.SetPressureCompensation(compensationValue);
        }
        catch{
            return 'Error occured on setting pressure compensation';
        }
    }

    public async SetSalinityCompensation(compensationValue:string, isPpt: string):Promise<string>{
        try{
            this.info('Salinitycompensation: ' + compensationValue + ' isPpt: ' + isPpt)
            if(isPpt.includes('true')){
                await this.sensor.SetSalinityCompensation(parseFloat(compensationValue), true);
            }
            else{
                await this.sensor.SetSalinityCompensation(parseFloat(compensationValue), false);
            }
        }
        catch{
            return 'Error occured on setting Salinity_compensation';
        }
    }
}


