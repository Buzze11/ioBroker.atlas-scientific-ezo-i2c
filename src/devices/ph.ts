import { EzoDeviceConfig, ImplementationConfigBase } from '../lib/adapter-config';
import { Polling } from '../lib/async';
import { EzoHandlerBase } from './ezo-handler-base';
import * as ezo from '../atlas-scientific-i2c';

export interface PHConfig extends EzoDeviceConfig {
    // mgParamActive?:boolean;
    // percentParamActive?:boolean;
}

export default class PH extends EzoHandlerBase<PHConfig> {
    sensor = new ezo.pH(this.adapter.i2cBus, parseInt(this.hexAddress), '');

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

        this.adapter.addStateChangeListener(this.hexAddress + '.Temperature compensation (Celsius)', async (_oldValue, _newValue) => {
            this.SetTemperatureCompensation(_newValue.toString());
        });
    }

    async CreateObjects(): Promise<void>{
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Device Status', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PH'),
                type: 'string',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'PH Value', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PH'),
                type: 'string',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Temperature compensation (Celsius)', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PH'),
                type: 'number',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Slope Acid', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PH'),
                type: 'array',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Slope Base', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PH'),
                type: 'array',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Slope Zero Point', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PH'),
                type: 'array',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Info', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PH'),
                type: 'string',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Led on', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PH'),
                type: 'boolean',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Devicename', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PH'),
                type: 'string',
                role: 'value',
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'IsCalibrated', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PH'),
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

                var ph = await this.sensor.GetReading();
                await this.setStateAckAsync('PH Value', ph);

                var tc = await this.sensor.GetTemperatureCompensation();
                await this.setStateAckAsync('Temperature compensation (Celsius)', parseFloat(tc));

                var info = await this.sensor.GetInfo();
                await this.setStateAckAsync('Info', info);

                var useLed = await this.sensor.GetLED();
                await this.setStateAckAsync('Led on', useLed);

                var name = await this.sensor.GetName();
                await this.setStateAckAsync('Devicename', name);

                var ic = await this.sensor.IsCalibrated();
                await this.setStateAckAsync('IsCalibrated', ic);
                                
                var slope = await this.sensor.GetSlope();
                if(slope[0] != null)
                    await this.setStateAckAsync('Slope Acid', slope[0]);
                if(slope[1] != null)
                    await this.setStateAckAsync('Slope Base', slope[1]);
                if(slope[2] != null)
                    await this.setStateAckAsync('Slope Zero Point', slope[2]);
            }
        }
        catch{
            
        }
    }

    public async DoCalibration(calibrationtype:string, phValue:string):Promise<string>{
        try{
            this.info('Calibrationtype: ' + calibrationtype);
            switch(calibrationtype){
                case 'Clear':
                    await this.sensor.ClearCalibration();
                    return 'DO Calibration was cleared successfully';
                    break;
                case 'Low':
                    await this.sensor.CalibrateLow(parseFloat(phValue));
                    return 'Low Calibration was done successfully';
                    break;
                case 'Mid':
                    await this.sensor.CalibrateMid(parseFloat(phValue));
                    return 'Mid Calibration was done successfully';
                    break;
                case 'High':
                    await this.sensor.CalibrateHigh(parseFloat(phValue));
                    return 'High Calibration was done successfully';
                    break;
            }
           
        }
        catch{
            return 'Error occured on PH Calibration. Calibration Task failed';
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

    
}
