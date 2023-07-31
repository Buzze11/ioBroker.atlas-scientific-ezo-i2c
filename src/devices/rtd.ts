import { EzoDeviceConfig } from '../lib/adapter-config';
import { EzoHandlerBase } from './ezo-handler-base';
import * as ezo from '../atlas-scientific-i2c';

export interface RTDConfig extends EzoDeviceConfig {
}

export default class RTD extends EzoHandlerBase<RTDConfig> {
    sensor = new ezo.RTD(this.adapter.i2cBus, parseInt(this.hexAddress), '', this.adapter);

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
        await this.setStateAckAsync('IsPaused', this.pausedState);

        // Read current setup from sensor
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

        // Set all State change listeners
        await this.CreateStateChangeListeners();

        // Set Led usage
        await this.SetLed(this.config.isLedOn);

        // If a polling interval was set, initialize polling
        if (!!this.config.pollingInterval && this.config.pollingInterval > 0) {
            this.startPolling(async () => await this.GetAllReadings(), this.config.pollingInterval, 5000);
        }
    }
    
    async CreateObjects(): Promise<void>{
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Devicestatus', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'RTD'),
                type: 'string',
                role: 'info.status',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'IsPaused', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'PH'),
                type: 'boolean',
                role: 'switch',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Temperature', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'RTD'),
                type: 'string',
                role: 'value.temperature',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Scale', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'RTD'),
                type: 'string',
                role: 'value',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Info', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'RTD'),
                type: 'string',
                role: 'info.sensor',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Led_on', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'RTD'),
                type: 'boolean',
                role: 'value',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Devicename', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'RTD'),
                type: 'string',
                role: 'info.name',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'IsCalibrated', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'RTD'),
                type: 'string',
                role: 'value',
                write: false,
            },
            //native: any
        });
        
    }

    async CreateStateChangeListeners(): Promise<void>{
        this.adapter.addStateChangeListener(this.hexAddress + '.IsPaused', async (_oldValue, _newValue) => {
            this.SetPausedFlag(_newValue.toString());
        });
    }

    async stopAsync(): Promise<void> {
        this.debug('Stopping');
        this.stopPolling();
    }

    async GetAllReadings(): Promise<void>{
        try{
            if(this.sensor != null && this.pausedState === false){
                const ds = await this.sensor.GetDeviceStatus();
                await this.setStateAckAsync('Devicestatus', ds);

                const ox = await this.sensor.GetReading();
                await this.setStateAckAsync('Temperature', ox);

                const info = await this.sensor.GetInfo();
                await this.setStateAckAsync('Info', info);

                const useLed = await this.sensor.GetLED();
                await this.setStateAckAsync('Led_on', useLed);

                const name = await this.sensor.GetName();
                await this.setStateAckAsync('Devicename', name);

                const ic = await this.sensor.IsCalibrated();
                await this.setStateAckAsync('IsCalibrated', ic);

                const sc = await this.sensor.GetTemperatureScale();
                await this.setStateAckAsync('Scale', sc);

            }
        }
        catch{
            this.error('Error occured on getting Device readings');
        }
    }

    public async DoCalibration(calibrationtype:string, tempValue:string):Promise<string>{
        try{
            this.info('Calibrationtype: ' + calibrationtype);
            switch(calibrationtype){
                case 'Clear':
                    await this.sensor.ClearCalibration();
                    return 'Temperature Calibration was cleared successfully';
                    break;
                case 'Standard':
                    await this.sensor.CalibrateTemperature(parseFloat(tempValue));
                    return 'Temperature Calibration was done successfully';
                    break;
            }
           
        }
        catch{
            return 'Error occured on Temperature Calibration. Calibration Task failed';
        }
    }
}
