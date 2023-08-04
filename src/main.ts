/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import * as i2c from 'i2c-bus';
import { StateChangeListener, ForeignStateChangeListener, StateValue } from './lib/state';
import { EzoHandlerBase } from './devices/ezo-handler-base';
import { toHexString } from './lib/shared';
import * as ezo from './atlas-scientific-i2c';
import DO from './devices/do';
import PH from './devices/ph';
import ORP from './devices/orp';
import RTD from './devices/rtd';
import EC from './devices/ec';
import PeristalticPump from './devices/pump';


export class AtlasScientificEzoI2cAdapter extends utils.Adapter {
    private bus!: i2c.PromisifiedBus;

    private currentStateValues: Record<string, StateValue> = {};
    private stateChangeListeners: Record<string, StateChangeListener<any>[]> = {};
    private foreignStateChangeListeners: Record<string, ForeignStateChangeListener<any>[]> = {};
    private readonly deviceHandlers: EzoHandlerBase<any>[] = [];

    // used for message handling
    private wait = false;
    private result: string;
    private dev: EzoHandlerBase<any>;

    public constructor(options: Partial<utils.AdapterOptions> = {}) {
        super({
            ...options,
            name: 'atlas-scientific-ezo-i2c',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    public get i2cBus(): i2c.PromisifiedBus {
        return this.bus;
    }

    public addStateChangeListener<T extends StateValue>(id: string, listener: StateChangeListener<T>): void {
        const key = this.namespace + '.' + id;
        if (!this.stateChangeListeners[key]) {
            this.stateChangeListeners[key] = [];
        }
        this.stateChangeListeners[key].push(listener);
        this.log.info('Added StateChangeListener: ' + key);
    }

    public addForeignStateChangeListener<T extends StateValue>(
        id: string,
        listener: ForeignStateChangeListener<T>,
    ): void {
        if (!this.foreignStateChangeListeners[id]) {
            this.foreignStateChangeListeners[id] = [];
            this.subscribeForeignStates(id);
        }
        this.foreignStateChangeListeners[id].push(listener);
    }

    public async setStateAckAsync<T extends StateValue>(id: string, value: T): Promise<void> {
        this.currentStateValues[this.namespace + '.' + id] = value;
        await this.setStateAsync(id, value, true);
    }

    public setStateAck<T extends StateValue>(id: string, value: T): void {
        this.currentStateValues[this.namespace + '.' + id] = value;
        this.setState(id, value, true);
    }

    public getStateValue<T extends StateValue>(id: string): T | undefined {
        return this.currentStateValues[this.namespace + '.' + id] as T | undefined;
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    private async onReady(): Promise<void> {
        // Reset Adapter connection state until I2C Bus is successfully initialized
        this.setState("info.connection", false, true);
        const allStates = await this.getStatesAsync('*');
        for (const id in allStates) {
            if (allStates[id] && allStates[id].ack) {
                this.currentStateValues[id] = allStates[id].val as StateValue;
            }
        }

        this.log.info('Using bus number: ' + this.config.busNumber);
        this.bus = await this.openBusAsync(this.config.busNumber);

        if(this.bus == null){
            this.log.info('Error opening I2C Bus: ' + this.config.busNumber);
            // Set connection state to false
            this.setState("info.connection", false, true);
        }
        else{
            this.log.info('Opened I2C Bus: ' + this.config.busNumber);
            // set connection state to true
            this.setState("info.connection", true, true);
        }

        if (!this.config.devices || this.config.devices.length === 0) {
            // no devices configured, nothing to do in this adapter
            return;
        }

        for (let i = 0; i < this.config.devices.length; i++) {
            const deviceConfig = this.config.devices[i];
            if (!deviceConfig.name || !deviceConfig.type) {
                continue;
            }

            try {
                const module = await import(__dirname + '/devices/' + deviceConfig.type.toLowerCase());
                const handler: EzoHandlerBase<any> = new module.default(deviceConfig, this);
                this.deviceHandlers.push(handler);
            } catch (error) {
                this.log.error(`Couldn't create ${deviceConfig.type} ${toHexString(deviceConfig.address)}: ${error}`);
            }
        }

        await Promise.all(
            this.deviceHandlers.map(async (h) => {
                try {
                    await h.startAsync();
                } catch (error) {
                    this.log.error(`Couldn't start ${h.type} ${h.hexAddress}: ${error}`);
                }
            }),
        );

        this.subscribeStates('*');
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    private async onUnload(callback: () => void): Promise<void> {
        try {
            await Promise.all(this.deviceHandlers.map((h) => h.stopAsync()));

            await this.bus.close();

            callback();
        } catch (e) {
            callback();
        }
    }

    /**
     * Is called if a subscribed state changes
     */
    private async onStateChange(id: string, state: ioBroker.State | null | undefined): Promise<void> {
        if (!state) {
            this.log.debug(`State ${id} deleted`);
            return;
        }

        this.log.debug(`stateChange ${id} ${JSON.stringify(state)}`);

        if (this.foreignStateChangeListeners[id]) {
            const listeners = this.foreignStateChangeListeners[id];
            await Promise.all(listeners.map((listener) => listener(state.val)));
            return;
        }

        if (state.ack) {
            return;
        }

        if (!this.stateChangeListeners[id]) {
            this.log.error('Unsupported state change: ' + id);
            return;
        }

        const listeners = this.stateChangeListeners[id];
        const oldValue = this.currentStateValues[id];
        await Promise.all(listeners.map((listener) => listener(oldValue, state.val)));
    }

    /**
     * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
     * Using this method requires "common.message" property to be set to true in io-package.json
     */
    private async onMessage(obj: ioBroker.Message): Promise<void> {
        this.log.info('onMessage: ' + JSON.stringify(obj));
        try{
            if (typeof obj === 'object' && obj.message) {
                switch (obj.command) {
                    case 'search':
                        const res = await this.SearchEzoDevices(parseInt(obj.message as string));
                        this.result = JSON.stringify(res || []);
                        this.log.info('Search found: ' + this.result);
                        this.wait = true;
                        break;
                    case 'FindEzoBoard':
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await this.dev.FindEzoBoard();
                        }
                        this.log.error('Error occured on finding EZO Board: ' + res);
                        break;
                    case 'FactoryReset':
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await this.dev.FactoryReset();
                        }
                        this.log.error('Error occured on finding EZO Board: ' + res);
                        break;
                    case 'SetI2CAddress':
                        let newAddress = this.GetParameterStringFromMessage(obj, "newI2CAddress");
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await this.dev.ChangeI2CAddress(newAddress);
                        }
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, this.result, obj.callback);
                            this.log.info('Answering with messageresult : ' + this.result);
                        }
                        this.log.error('Error occured on setting new I2C address: ' + res);
                        break;                           
                    case 'DOCalibration':
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await (this.dev as DO)?.DoCalibration(obj.message['calibrationtype']);
                        }
                        this.log.error('Error occured on DO Calibration: ' + res);
                        break;
                   case 'DOPressureCompensation':
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await (this.dev as DO)?.SetPressureCompensation(obj.message['pcValue']);
                            break;                         
                        }
                        this.log.error('Error occured on setting pressure compensation: ' + res);
                        break;
                    case 'DOSalinityCompensation':
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await (this.dev as DO)?.SetSalinityCompensation(obj.message['scValue'],obj.message['isPpt']);
                            break;                         
                        }
                        this.log.error('Error occured on setting salinity compensation: ' + res);
                        break;  
                    case 'PHCalibration':
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await (this.dev as PH)?.DoCalibration(obj.message['calibrationtype'], obj.message['phValue']);
                        }
                        this.log.error('Error occured on DO Calibration: ' + res);
                        break;
                    case 'TemperatureCompensation':
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            const deviceType = obj.message['deviceType']
                            switch(deviceType){
                                case 'DO':
                                    this.result = await (this.dev as DO)?.SetTemperatureCompensation(obj.message['tcValue']);
                                    break;
                                case 'PH':
                                    this.result = await (this.dev as PH)?.SetTemperatureCompensation(obj.message['tcValue']);
                                    break;
                                case 'EC':
                                    this.result = await (this.dev as EC)?.SetTemperatureCompensation(obj.message['tcValue']);
                                    break;
                            }
                        }
                        this.log.error('Error occured on setting temperature compensation: ' + res);
                        break;
                    case 'ORPCalibration':
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await (this.dev as ORP)?.DoCalibration(obj.message['calibrationtype'], obj.message['orpValue']);
                        }
                        this.log.error('Error occured on ORP Calibration: ' + res);
                        break;
                    case 'RTDCalibration':
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await (this.dev as RTD)?.DoCalibration(obj.message['calibrationtype'], obj.message['tempValue']);
                        }
                        this.log.error('Error occured on RTD Calibration: ' + res);
                        break;
                    case 'PumpCalibration':
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await (this.dev as PeristalticPump)?.DoCalibration(obj.message['calibrationtype'], obj.message['VolumeValue']);
                        }
                        this.log.error('Error occured on Pump Calibration: ' + res);
                        break;
                    case 'PumpClearDispensedVolume':
                            if((this.dev = await this.GetDeviceHandler(obj))){
                                this.result = await (this.dev as PeristalticPump)?.ClearTotalDispensedVolume();
                            }
                            this.log.error('Error occured on clearing total dispensed volume: ' + res);
                            break;
                    case 'PumpSetContinousDispense': //******* */
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await (this.dev as PeristalticPump)?.SetContinousDispenseMode(true);
                        }
                        this.log.error('Error occured on staring continous dispense: ' + res);
                        break;
                    case 'PumpStopDispense': 
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await (this.dev as PeristalticPump)?.SetContinousDispenseMode(false);
                        }
                        this.log.error('Error occured on stopping dispense: ' + res);
                        break;
                    case 'PumpPause': 
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await (this.dev as PeristalticPump)?.DoPauseDispense();
                        }
                        this.log.error('Error occured on pausing dispense: ' + res);
                        break;
                    case 'PumpSetDoseOverTime': 
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await (this.dev as PeristalticPump)?.DoseOverTime(obj.message['doseOverTimeValue']);
                        }
                        this.log.error('Error occured on starting dose over time: ' + res);
                        break;
                    case 'PumpSetDispenseVolume': 
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await (this.dev as PeristalticPump)?.DispenseVolume(obj.message['dispenseValue']);
                        }
                        this.log.error('Error occured on starting dispense volume: ' + res);
                        break;
                    case 'PumpSetConstantFlowRate': 
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await (this.dev as PeristalticPump)?.SetConstantFlowRate(obj.message['constantFlowRateValue']);
                        }
                        this.log.error('Error occured on starting dispense volume: ' + res);
                        break;
                    case 'ECCalibration':
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await (this.dev as EC)?.DoCalibration(obj.message['calibrationtype'], obj.message['ecValue']);
                        }
                        this.log.error('Error occured on EC Calibration: ' + res);
                        break;
                    case 'EcTDSConversion':
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await (this.dev as EC)?.SetTdsConversion(obj.message['tdsValue']);
                        }
                        this.log.error('Error occured on EC Calibration: ' + res);
                        break;
                    case 'EcProbeType':
                        if((this.dev = await this.GetDeviceHandler(obj))){
                            this.result = await (this.dev as EC)?.SetProbeType(obj.message['probeTypeValue']);
                        }
                        this.log.error('Error occured on setting probe type: ' + res);
                        break;
                    default:
                        this.result =  'Unknown command';
                        this.log.warn('Unknown command: ' + obj.command);
                        break;
                }
            }
            // Send back result     
            if (obj.callback) {
                this.sendTo(obj.from, obj.command, this.result, obj.callback);
                this.log.info('Answering with messageresult : ' + this.result);
            }
        }
        catch{}
    }

    private async SendBackResult(obj: ioBroker.Message):Promise<void>{
        if (obj.callback) {
            this.sendTo(obj.from, obj.command, this.result, obj.callback);
        }
        this.wait = true;
    }

    private async GetDeviceHandler(obj: ioBroker.Message):Promise<EzoHandlerBase<any>>{
        try{
            const addressString = await this.GetParameterStringFromMessage(obj, "address");
            const addressStringHex = toHexString(parseInt(addressString));
            if(addressStringHex){
                const handler = await this.GetDeviceHandlerByAddress(addressStringHex);
                return handler
            }
            else{
                this.log.error('GetDeviceHandler(): Device with this address has not been found');
            }
        }
        catch{
            this.log.error('GetDeviceHandler(): Error on getting DeviceHandler');
        }
    }

    private async GetDeviceHandlerByAddress(hexAddress: string):Promise<EzoHandlerBase<any>>{
        const handler = this.deviceHandlers.find(h=>h.hexAddress == hexAddress);
        return handler;
    }

    private GetParameterStringFromMessage(obj: ioBroker.Message, parameterName: string):string{
        const parameter = obj.message[parameterName];
        return parameter;
    }

    private async SearchEzoDevices(busNumber: number):Promise<number[]>{
        if (busNumber === this.config.busNumber) {
            this.log.debug('Searching on current bus ' + busNumber);

        } else {
            this.log.debug('Searching on new bus ' + busNumber);
        }
        const searchBus = await this.openBusAsync(busNumber);
        const res = await ezo.FindAllDevices(searchBus, this);
        const devices = [];

        res.forEach(async item=>{
            if(item instanceof ezo.EZODevice){
                devices.push(item.address);
            }else{
                console.log('Found Device is not an Atlas EZO Device');
            }
        });
        searchBus.close();
        return devices;
        
    }

    private async openBusAsync(busNumber: number): Promise<i2c.PromisifiedBus> {
        return await i2c.openPromisified(busNumber);
    }
}

if (module.parent) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new AtlasScientificEzoI2cAdapter(options);
} else {
    // otherwise start the instance directly
    (() => new AtlasScientificEzoI2cAdapter())();
}
