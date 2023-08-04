import { EzoDeviceConfig, ImplementationConfigBase } from '../lib/adapter-config';
import { EzoHandlerBase } from './ezo-handler-base';
import * as ezo from '../atlas-scientific-i2c';

export interface ECConfig extends EzoDeviceConfig {
    uSParamActive?: boolean;
    ppmParamActive?: boolean;
    pptParamActive?: boolean;
    sgParamActive?: boolean;
}

export default class EC extends EzoHandlerBase<ECConfig> {
    sensor = new ezo.EC(this.adapter.i2cBus, parseInt(this.hexAddress), '', this.adapter);

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
        await this.SetParameters(deviceParameters);

        const deviceName: string = await this.sensor.GetName();
        
        // Set Name if not set already
        if(!this.config.name){
            this.info('Devicename is not clear. Clearing Devicename');
            await this.sensor.SetName('');
        }
        else if(this.config.name != deviceName){
            this.info('Devicenamehas changed. Setting Devicename to: ' + this.config.name)
            await this.sensor.SetName(this.config.name);
        }

        // Init state objects which are not read from sensor (config objects)
        await this.InitNonReadStateValues();
       
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

        this.adapter.addStateChangeListener(this.hexAddress + '.Temperature_compensation', async (_oldValue, _newValue) => {
            this.SetTemperatureCompensation(_newValue.toString());
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.IsPaused', async (_oldValue, _newValue) => {
            this.SetPausedFlag(_newValue.toString());
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Calibrate_Clear', async (_oldValue, _newValue) => {
            if(_newValue === true){
                this.DoCalibration('Clear', '');
            }
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Calibrate_Dry', async (_oldValue, _newValue) => {
            if(_newValue === true){
                this.DoCalibration('Dry', '');
            }
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Calibrate_Singlepoint', async (_oldValue, _newValue) => {
            if(_newValue.toString() != '')
                this.DoCalibration('Singlepoint',_newValue.toString());
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Calibrate_Low', async (_oldValue, _newValue) => {
            if(_newValue.toString() != '')
                this.DoCalibration('Low',_newValue.toString());
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Calibrate_High', async (_oldValue, _newValue) => {
            if(_newValue.toString() != '')
                this.DoCalibration('High',_newValue.toString());
        });
    }

    async CreateObjects(): Promise<void>{
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Devicestatus', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'EC'),
                type: 'string',
                role: 'info.status',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'IsPaused', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'EC'),
                type: 'boolean',
                role: 'switch',
                write: true,
                states: {   true: "paused", 
                            false: "unpaused", 

                },
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'EC_Value', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'EC'),
                type: 'string',
                role: 'value',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Temperature_compensation', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'EC'),
                type: 'number',
                role: 'value.temperature',
                unit: '°C',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Info', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'EC'),
                type: 'string',
                role: 'info.sensor',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Led_on', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'EC'),
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
                name: this.hexAddress + ' ' + (this.config.name || 'EC'),
                type: 'string',
                role: 'info.name',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'IsCalibrated', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'EC'),
                type: 'string',
                role: 'value',
                write: false,
                states: {   "0": "uncalibrated", 
                            "1": "one point", 
                            "2": "two point", 
                        },
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Calibrate_Clear', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'EC'),
                type: 'boolean',
                role: 'switch',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Calibrate_Dry', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'EC'),
                type: 'boolean',
                role: 'switch',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Calibrate_Singlepoint', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'EC'),
                type: 'string',
                role: 'value',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Calibrate_Low', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'EC'),
                type: 'string',
                role: 'value',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Calibrate_High', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'EC'),
                type: 'string',
                role: 'value',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Parameters_enabled', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'EC'),
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
            await this.setStateAckAsync('Calibrate_Dry', false);
            await this.setStateAckAsync('Calibrate_Singlepoint', '');
            await this.setStateAckAsync('Calibrate_Low', '');
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

                const ec = await this.sensor.GetReading();
                await this.setStateAckAsync('EC_Value', ec);

                const tc = await this.sensor.GetTemperatureCompensation();
                await this.setStateAckAsync('Temperature_compensation', parseFloat(tc));

                const info = await this.sensor.GetInfo();
                await this.setStateAckAsync('Info', info);

                const useLed = await this.sensor.GetLED();
                await this.setStateAckAsync('Led_on', useLed);

                const name = await this.sensor.GetName();
                await this.setStateAckAsync('Devicename', name);

                const ic = await this.sensor.IsCalibrated();
                await this.setStateAckAsync('IsCalibrated', ic);

                const pe = await this.sensor.GetParametersEnabled();
                await this.setStateAckAsync('Parameters_enabled', pe);
                                
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
                    return 'EC Calibration was cleared successfully';
                case 'Dry':
                    await this.sensor.CalibrateDry();
                    await this.setStateAckAsync('Calibrate_Dry', false);
                    return 'Dry Calibration was done successfully';
                case 'Singlepoint':
                    await this.sensor.CalibrateSinglepoint(parseFloat(Value));
                    await this.setStateAckAsync('Calibrate_Singlepoint', '');
                    return 'Single point calibration was done successfully';
                case 'Low':
                    await this.sensor.CalibrateLow(parseFloat(Value));
                    await this.setStateAckAsync('Calibrate_Low', '');
                    return 'Low Calibration was done successfully';
                case 'High':
                    await this.sensor.CalibrateHigh(parseFloat(Value));
                    await this.setStateAckAsync('Calibrate_High', '');
                    return 'High Calibration was done successfully';
            }
           
        }
        catch{
            return 'Error occured on EC Calibration. Calibration Task failed';
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

    public async SetProbeType(probeTypeValue:string):Promise<string>{
        try{
            this.info('Probetype: ' + probeTypeValue);
            await this.sensor.SetProbeType(probeTypeValue);
        }
        catch{
            return 'Error occured on setting Probe Type compensation';
        }
    }

    public async SetTdsConversion(value:string):Promise<string>{
        try{
            this.info('TDS conversion value: ' + value);
            await this.sensor.SetTDSConversionFactor(parseFloat(value));
        }
        catch{
            return 'Error occured on setting Probe Type compensation';
        }
    }

    public async SetParameters(activatedParams: string): Promise<string> {
        // Set reading parameters for DO Reading format related to configuration
        try{
            const params: string[] = activatedParams.split(",");

            if(this.config.uSParamActive && !params.includes('EC')){
                await this.sensor.SetParameter('EC', true);
            }
            else if (!this.config.uSParamActive && params.includes('EC')){
                await this.sensor.SetParameter('EC', false);
            }
            if(this.config.ppmParamActive && !params.includes('TDS')){
                await this.sensor.SetParameter('TDS', true);
            }
            else if (!this.config.ppmParamActive && params.includes('TDS')){
                await this.sensor.SetParameter('TDS', false);
            }
            if(this.config.pptParamActive && !params.includes('S')){
                await this.sensor.SetParameter('S', true);
            }
            else if (!this.config.pptParamActive && params.includes('S')){
                await this.sensor.SetParameter('S', false);
            }
            if(this.config.sgParamActive && !params.includes('SG')){
                await this.sensor.SetParameter('SG', true);
            }
            else if (!this.config.sgParamActive && params.includes('SG')){
                await this.sensor.SetParameter('SG', false);
            }
            return 'Successfully configured EC parameters';
        }
        catch{
            return 'Error occured on setting EC parameters';
        }
    }

}
