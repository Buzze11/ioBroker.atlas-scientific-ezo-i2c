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

        // If active and polling interval was set, initialize polling
        if (this.config.isActive && !!this.config.pollingInterval && this.config.pollingInterval > 0) {
            this.startPolling(async () => await this.GetAllReadings(), this.config.pollingInterval, 5000);
        }
        
    }
    

    async CreateStateChangeListeners(): Promise<void>{

        this.adapter.addStateChangeListener(this.hexAddress + '.Temperature_compensation(Celsius)', async (_oldValue, _newValue) => {
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

        this.adapter.addStateChangeListener(this.hexAddress + '.Pressure_compensation(kPa)', async (_oldValue, _newValue) => {
            this.SetPressureCompensation(_newValue.toString());
        });

    }


    async CreateObjects(): Promise<void>{
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Device_Status', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'string',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Dissolved_Oxygen(related_parameters_enabled)', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'string',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Temperature_compensation(Celsius)', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'number',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Salinity_compensation', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'number',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Salinity_compensation_ispPt', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name),
                type: 'boolean',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Pressure_compensation(kPa)', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'DO'),
                type: 'number',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Parameters_enabled', {
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
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Led_on', {
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
                const ds = await this.sensor.GetDeviceStatus();
                await this.setStateAckAsync('Device_Status', ds);

                const ox = await this.sensor.GetReading();
                await this.setStateAckAsync('Dissolved_Oxygen(related_parameters_enabled)', ox);

                const tc = await this.sensor.GetTemperatureCompensation();
                await this.setStateAckAsync('Temperature_compensation(Celsius)', parseFloat(tc));

                const sc = await this.sensor.GetSalinityCompensation();
                await this.setStateAckAsync('Salinity_compensation', parseFloat(sc[0]));
                await this.setStateAckAsync('Salinity_compensation_ispPt', sc[1] == 'ppt');
                
                const pc = await this.sensor.GetPressureCompensation();
                await this.setStateAckAsync('Pressure_compensation(kPa)', parseFloat(pc));

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
            return 'Error occured on setting Salinity_compensation';
        }
    }
}


