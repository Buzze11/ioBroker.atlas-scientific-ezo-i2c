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
    sensor = new ezo.DO(this.adapter.i2cBus, parseInt(this.hexAddress), '');

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
        let deviceParameters = await this.sensor.GetParametersEnabled();
        let deviceName: string = await this.sensor.GetName();
        
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

        // If active and polling interval was set, initialize polling
        if (this.config.isActive && !!this.config.pollingInterval && this.config.pollingInterval > 0) {
            this.startPolling(async () => await this.GetAllReadings(), this.config.pollingInterval, 5000);
        }
        
    }
    

    async CreateStateChangeListeners(): Promise<void>{

        this.adapter.addStateChangeListener(this.hexAddress + '.Temperature compensation (Celsius)', async (_oldValue, _newValue) => {
            this.SetTemperatureCompensation(_newValue.toString());
        });

        this.adapter.addStateChangeListener(this.hexAddress + '.Salinity compensation', async (_oldValue, _newValue) => {
            var sc = await this.sensor.GetSalinityCompensation();
            if(sc[1]== 'ppt'){
                this.SetSalinityCompensation(_newValue.toString(), 'true');
            }
            else{
                this.SetSalinityCompensation(_newValue.toString(), 'false');
            }
        });

        this.adapter.addStateChangeListener(this.hexAddress + '.Pressure compensation (kPa)', async (_oldValue, _newValue) => {
            this.SetPressureCompensation(_newValue.toString());
        });

    }


    async CreateObjects(): Promise<void>{
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Device Status', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'string',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Dissolved Oxygen (related parameters enabled)', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'string',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Temperature compensation (Celsius)', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'number',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Salinity compensation', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'number',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Salinity compensation ispPt', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name),
                type: 'boolean',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Pressure compensation (kPa)', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'number',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Parameters enabled', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'string',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Info', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'string',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Led on', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'boolean',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Devicename', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'string',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'IsCalibrated', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'string',
                role: 'value',
            },
            //native: any
        });
        
    }

    async stopAsync(): Promise<void> {
        this.debug('Stopping');
        this.stopPolling();
    }

    async GetAllReadings(): Promise<void>{
        try{
            if(this.sensor != null){
                var ds = await this.sensor.GetDeviceStatus();
                await this.setStateAckAsync('Device Status', ds);

                var ox = await this.sensor.GetReading();
                await this.setStateAckAsync('Dissolved Oxygen (related parameters enabled)', ox);

                var tc = await this.sensor.GetTemperatureCompensation();
                await this.setStateAckAsync('Temperature compensation (Celsius)', parseFloat(tc));

                var sc = await this.sensor.GetSalinityCompensation();
                await this.setStateAckAsync('Salinity compensation', parseFloat(sc[0]));
                await this.setStateAckAsync('Salinity compensation ispPt', sc[1] == 'ppt');
                
                var pc = await this.sensor.GetPressureCompensation();
                await this.setStateAckAsync('Pressure compensation (kPa)', parseFloat(pc));

                var pe = await this.sensor.GetParametersEnabled();
                await this.setStateAckAsync('Parameters enabled', pe);

                var info = await this.sensor.GetInfo();
                await this.setStateAckAsync('Info', info);

                var useLed = await this.sensor.GetLED();
                await this.setStateAckAsync('Led on', useLed);

                var name = await this.sensor.GetName();
                await this.setStateAckAsync('Devicename', name);

                var ic = await this.sensor.IsCalibrated();
                await this.setStateAckAsync('IsCalibrated', ic);
            }
        }
        catch{
        }
    }

    public async DoCalibration(calibrationtype:string):Promise<string>{
        try{
            this.info('Calibrationtype: ' + calibrationtype);
            switch(calibrationtype){
                case 'Clear':
                    await this.sensor.ClearCalibration();
                    return 'DO Calibration was cleared successfully';
                    break;
                case 'Atmospheric':
                    await this.sensor.CalibrateAtmosphericOxygen();
                    return 'Atmospheric DO Calibration was done successfully';
                    break;
                case '0DO':
                    await this.sensor.Calibrate0DissolvedOxygen();
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
            return 'Error occured on setting salinity compensation';
        }
    }
}


