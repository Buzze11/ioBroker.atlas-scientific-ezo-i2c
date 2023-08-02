import { EzoDeviceConfig, ImplementationConfigBase } from '../lib/adapter-config';
import { Polling } from '../lib/async';
import { EzoHandlerBase } from './ezo-handler-base';
import * as ezo from '../atlas-scientific-i2c';

export interface PeristalticPumpConfig extends EzoDeviceConfig {
    V_ParamActive?: boolean;
    TV_ParamActive?: boolean;
    ATV_ParamActive?: boolean;
    reverse?: boolean;
}

export default class PeristalticPump extends EzoHandlerBase<PeristalticPumpConfig> {
    sensor = new ezo.Pump(this.adapter.i2cBus, parseInt(this.hexAddress), '', this.adapter);

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
         const deviceParameters = await this.sensor.GetParametersEnabled();
        
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
        if(this.config.V_ParamActive && !deviceParameters.includes('V')){
            await this.sensor.SetParameters('V', true);
        }
        else if (!this.config.V_ParamActive && deviceParameters.includes('V')){
            await this.sensor.SetParameters('V', false);
        }
        if(this.config.TV_ParamActive && !deviceParameters.includes('TV')){
            await this.sensor.SetParameters('TV', true);
        }
        else if (!this.config.TV_ParamActive && deviceParameters.includes('TV')){
            await this.sensor.SetParameters('TV', false);
        }
        if(this.config.ATV_ParamActive && !deviceParameters.includes('ATV')){
            await this.sensor.SetParameters('ATV', true);
        }
        else if (!this.config.ATV_ParamActive && deviceParameters.includes('ATV')){
            await this.sensor.SetParameters('ATV', false);
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

        this.adapter.addStateChangeListener(this.hexAddress + '.Continous_dispense', async (_oldValue, _newValue) => {
            if(_newValue === true){
                this.SetContinousDispenseMode(true);
            }
            else if(_newValue === false){
                this.SetContinousDispenseMode(false);
            }
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Pause_Pump', async (_oldValue, _newValue) => {
            if(_newValue === true){
                this.DoPauseDispense();
            }
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Dose_over_time', async (_oldValue, _newValue) => {
            if(_newValue != ''){
                this.DoseOverTime(_newValue.toString());
                await this.setStateAckAsync('Dose_over_time', '');
            }
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Dispense_volume', async (_oldValue, _newValue) => {
            if(_newValue != ''){
                this.DispenseVolume(_newValue.toString());
                await this.setStateAckAsync('Dispense_volume', '');
            }
        });
        this.adapter.addStateChangeListener(this.hexAddress + '.Constant_flow_rate', async (_oldValue, _newValue) => {
            if(_newValue != ''){
                this.SetConstantFlowRate(_newValue.toString());
                await this.setStateAckAsync('Constant_flow_rate', '');
            }
        });
    }

    async InitNonReadStateValues():Promise<string>{
        try{
            await this.setStateAckAsync('Constant_flow_rate', '');
            await this.setStateAckAsync('Pause_Pump', false);
            await this.setStateAckAsync('Continous_dispense', false);
            await this.setStateAckAsync('Dispense_volume', '');
            await this.setStateAckAsync('Dose_over_time', '');
            await this.setStateAckAsync('Pause_dispense', false);
            await this.setStateAckAsync('Stop_dispense', false);
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
                name: this.hexAddress + ' ' + (this.config.name || 'Pump'),
                type: 'string',
                role: 'info.status',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Pump_Voltage', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'Pump'),
                type: 'string',
                role: 'value',
                unit: 'V',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Dispensed_Volume', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'Pump'),
                type: 'string',
                role: 'value',
                unit: 'ml',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Total_Dispensed_Volume', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'Pump'),
                type: 'string',
                role: 'value',
                unit: 'ml',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'abs_Total_Dispensed_Volume', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'Pump'),
                type: 'string',
                role: 'value',
                unit: 'ml',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Info', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'Pump'),
                type: 'string',
                role: 'info.sensor',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Led_on', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'Pump'),
                type: 'boolean',
                role: 'value',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Devicename', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'Pump'),
                type: 'string',
                role: 'info.name',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'IsCalibrated', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'Pump'),
                type: 'string',
                role: 'value',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Parameters_enabled', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'Pump'),
                type: 'string',
                role: 'value',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Pump_Paused', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'Pump'),
                type: 'boolean',
                role: 'value',
                write: false,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Continous_dispense', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'Pump'),
                type: 'boolean',
                role: 'switch',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Pause_Pump', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'Pump'),
                type: 'boolean',
                role: 'switch',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Dose_over_time', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'Pump'),
                type: 'string',
                role: 'value',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Dispense_volume', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'Pump'),
                type: 'string',
                role: 'value',
                write: true,
            },
            //native: any
        });
        await this.adapter.extendObjectAsync(this.hexAddress + '.' + 'Constant_flow_rate', {
            type: 'state',
            common: {
                name: this.hexAddress + ' ' + (this.config.name || 'Pump'),
                type: 'string',
                role: 'value',
                write: true,
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
                await this.setStateAckAsync('Devicestatus', ds);

                const dv = await this.sensor.GetReading();
                await this.setStateAckAsync('Dispensed_Volume', dv);

                const info = await this.sensor.GetInfo();
                await this.setStateAckAsync('Info', info);

                const useLed = await this.sensor.GetLED();
                await this.setStateAckAsync('Led_on', useLed);

                const name = await this.sensor.GetName();
                await this.setStateAckAsync('Devicename', name);

                const ic = await this.sensor.isCalibrated();
                await this.setStateAckAsync('IsCalibrated', ic);

                const tdv = await this.sensor.GetTotalDispensedVolume(false);
                await this.setStateAckAsync('Total_Dispensed_Volume', tdv);

                const abs_tdv = await this.sensor.GetTotalDispensedVolume(true);
                await this.setStateAckAsync('abs_Total_Dispensed_Volume', abs_tdv);

                const pe = await this.sensor.GetParametersEnabled();
                await this.setStateAckAsync('Parameters_enabled', pe);

                const pv = await this.sensor.GetPumpVoltage();
                await this.setStateAckAsync('Pump_Voltage', pv);
                
                const ip = await this.sensor.IsPaused();
                await this.setStateAckAsync('Pump_Paused', ip);

            }
        }
        catch{}
    }

    /// Executes a pump calibration
    public async DoCalibration(calibrationtype:string, Volume:string):Promise<string>{
        try{
            this.info('Calibrationtype: ' + calibrationtype);
            switch(calibrationtype){
                case 'Clear':
                    await this.sensor.ClearCalibration();
                    return 'Pump Calibration was cleared successfully';
                    break;
                case 'Standard':
                    await this.sensor.Calibrate(Volume);
                    return 'Pump Calibration was done successfully';
                    break;
            }
        }
        catch{
            return 'Error occured on Pump Calibration. Calibration Task failed';
        }
    }

    /// Sets the continous dispense mode if it was activated
    public async SetContinousDispenseMode(on_off:boolean):Promise<string>{
        try{
            this.info('Continous_dispense: ' + on_off);
            if(on_off){
                await this.sensor.StartDispensing(this.config.reverse);
                await this.setStateAckAsync('Pause_Pump', false);
            }
            else{
                await this.sensor.StopDispensing();
                await this.setStateAckAsync('Pause_Pump', false);
            }
        }
        catch{
            return 'Error occured on starting continous dispense';
        }
    }

    /// Sets the continous dispense mode if it was activated
    public async DoPauseDispense():Promise<string>{
        try{
            this.info('Pausing Pump');
            await this.setStateAckAsync('Continous_dispense', false);
            await this.sensor.PauseDispensing();
        }
        catch{
                return 'Error occured on pausing pump';
        }
    }

    /// Dispenses the given volume over the given minutes. ml Amount min Minutes
    // value -> comma separated string ml,minutes. negative ml value for reverse
    public async DoseOverTime(value:string):Promise<string>{
        try{
            this.info('Dose_over_time: ' + value);
            const separator = ",";
            const substrings: string[] = value.trim().split(separator);
            if(substrings.length > 1){
                const volume = parseInt(substrings[0]);
                const duration = parseInt(substrings[1]);
                // Set Pause and Continous Dispense states to false
                await this.setStateAckAsync('Pause_Pump', false);
                await this.setStateAckAsync('Continous_dispense', false);
                // Start dispensing
                this.info('Start dosing over time with a volume of ' + volume +' ml for a duration of ' + duration  + ' minutes');
                await this.sensor.Dose(volume, duration);
            }
        }
        catch{
            return 'Error occured on executing dose over time';
        }
    }

    /// Dispenses desired volume 
    // value -> string ml. negative ml value for reverse
    public async DispenseVolume(value:string):Promise<string>{
        try{
            // Set Pause and Continous Dispense states to false
            await this.setStateAckAsync('Pause_Pump', false);
            await this.setStateAckAsync('Continous_dispense', false);
            // Start dispensing
            this.info('Start dispensing volume of ' + value + ' ml');
            await this.sensor.Dispense(value);
        }
        catch{
            return 'Error occured on dispensing volume';
        }
    }

    /// Maintains a constant flow rate.
    // value -> comma separated string ml/per minute & duration in minutes. negative ml value for reverse
    public async SetConstantFlowRate(value:string):Promise<string>{
        try{
            const separator = ",";
            const substrings: string[] = value.trim().split(separator);
            if(substrings.length > 1){
                const volume_per_min = parseInt(substrings[0]);
                const duration = substrings[1];
                // Set Pause and Continous Dispense states to false
                await this.setStateAckAsync('Pause_Pump', false);
                await this.setStateAckAsync('Continous_dispense', false);
                // Start Dispensing
                this.info('Start dispensing constant rate with a volume of ' + volume_per_min + ' ml/minute for a duration of ' + duration + ' minutes');
                await this.sensor.DispenseConstantRate(volume_per_min, duration);
            }
        }
        catch{
            return 'Error occured on maintaining constant flow rate';
        }
    }

    /// Clears the total dispensed volume counter
    public async ClearTotalDispensedVolume():Promise<string>{
        try{
            this.info('Clearing total dispensed Volume ');
            await this.sensor.ClearTotalDispensedVolume();
        }
        catch{
            return 'Error occured on starting continous dispense';
        }
    }
}
