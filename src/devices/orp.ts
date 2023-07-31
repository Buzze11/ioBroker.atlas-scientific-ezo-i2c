import { EzoDeviceConfig, ImplementationConfigBase } from '../lib/adapter-config';
import { Polling } from '../lib/async';
import { EzoHandlerBase } from './ezo-handler-base';
import * as ezo from '../atlas-scientific-i2c';

export interface ORPConfig extends EzoDeviceConfig {
}

export default class ORP extends EzoHandlerBase<ORPConfig> {
    sensor = new ezo.ORP(this.adapter.i2cBus, parseInt(this.hexAddress), '', this.adapter);

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

        // Init state objects which are not read from sensor (config objects)
        await this.InitNonReadStateValues();

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
                this.DoCalibration('Clear', '0');
            }
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Calibrate', async (_oldValue, _newValue) => {
            if(_newValue.toString() != '')
                this.DoCalibration('Standard',_newValue.toString());
        });
    }

    async InitNonReadStateValues():Promise<string>{
        try{
            await this.setStateAckAsync('IsPaused', this.pausedState);
            await this.setStateAckAsync('Calibrate_Clear', false);
            await this.setStateAckAsync('Calibrate', '');
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
                name: this.hexAddress + ' ' + (this.config.name || 'ORP'),
                type: 'string',
                role: 'info.status',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'IsPaused', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'ORP'),
                type: 'boolean',
                role: 'switch',
                write: true,
                states: {   true: "paused", 
                            false: "unpaused", 
                },
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'ORP_Value', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'ORP'),
                type: 'string',
                role: 'value',
                unit: 'mV',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Info', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'ORP'),
                type: 'string',
                role: 'info.sensor',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Led_on', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'ORP'),
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
                name: this.hexAddress + ' ' + (this.config.name || 'ORP'),
                type: 'string',
                role: 'info.name',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'IsCalibrated', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'ORP'),
                type: 'string',
                role: 'value',
                write: false,
                states: {   "0": "uncalibrated", 
                            "1": "calibrated", 
                },
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Calibrate_Clear', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'ORP'),
                type: 'boolean',
                role: 'switch',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Calibrate', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'ORP'),
                type: 'string',
                role: 'value',
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

                const orp = await this.sensor.GetReading();
                await this.setStateAckAsync('ORP_Value', orp);

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

    public async DoCalibration(calibrationtype:string, orpValue:string):Promise<string>{
        try{

            await this.WaitForFinishedReading();

            this.info('Calibrationtype: ' + calibrationtype);
            switch(calibrationtype){
                case 'Clear':
                    await this.sensor.ClearCalibration();
                    await this.setStateAckAsync('Calibrate_Clear', false);
                    return 'ORP Calibration was cleared successfully';
                    break;
                case 'Standard':
                    await this.sensor.Calibrate(parseFloat(orpValue));
                    await this.setStateAckAsync('Calibrate', '');
                    return 'ORP Calibration was done successfully';
                    break;
            }
           
        }
        catch{
            return 'Error occured on ORP Calibration. Calibration Task failed';
        }
    }
}
