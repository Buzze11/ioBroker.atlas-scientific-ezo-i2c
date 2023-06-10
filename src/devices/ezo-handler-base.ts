import * as i2c from 'i2c-bus';
import { EzoDeviceConfig, ImplementationConfigBase } from '../lib/adapter-config';
import { Polling, PollingCallback } from '../lib/async';
import { toHexString } from '../lib/shared';
import { AtlasScientificEzoI2cAdapter} from '../main';
import { StateValue } from '../lib/state';
import { EZODevice } from '../atlas-scientific-i2c';

export abstract class EzoHandlerBase<T extends EzoDeviceConfig> {
    public readonly type: string;
    public readonly name: string;
    public readonly hexAddress: string;
    public sensor; 

    protected readonly config: T;
    
    private polling?: Polling;
    
    

    constructor(private readonly deviceConfig: EzoDeviceConfig, protected readonly adapter: AtlasScientificEzoI2cAdapter) {
        if (!deviceConfig.type || !deviceConfig.name) {
            throw new Error('Type and name of device must be specified');
        }
        this.type = deviceConfig.type;
        this.name = deviceConfig.name;
        this.config = deviceConfig[deviceConfig.type] as T;
        this.hexAddress = toHexString(deviceConfig.address);
    }

    // methods to override
    abstract startAsync(): Promise<void>;
    abstract stopAsync(): Promise<void>;

    // polling related methods
    protected startPolling(callback: PollingCallback, interval: number, minInterval?: number): void {
        this.stopPolling();
        this.polling = new Polling(callback);
        this.polling.runAsync(interval, minInterval).catch((error) => this.error('Polling error: ' + error));
    }

    protected stopPolling(): void {
        this.polling?.stop();
    }

    // adapter methods
    protected async setStateAckAsync<T extends StateValue>(state: string | number | boolean , value: T): Promise<void> {
        await this.adapter.setStateAckAsync(this.hexAddress + '.' + state, value);
    }

    protected setStateAck<T extends StateValue>(state: string | number, value: T): void {
        this.adapter.setStateAck(this.hexAddress + '.' + state, value);
    }

    protected getStateValue<T extends StateValue>(state: string | number): T | undefined {
        return this.adapter.getStateValue<T>(this.hexAddress + '.' + state);
    }

    // logging methods
    protected silly(message: string): void {
        this.adapter.log.silly(`${this.type} ${this.hexAddress}: ${message}`);
    }

    protected debug(message: string): void {
        this.adapter.log.debug(`${this.type} ${this.hexAddress}: ${message}`);
    }

    protected info(message: string): void {
        this.adapter.log.info(`${this.type} ${this.hexAddress}: ${message}`);
    }

    protected warn(message: string): void {
        this.adapter.log.warn(`${this.type} ${this.hexAddress}: ${message}`);
    }

    protected error(message: string): void {
        this.adapter.log.error(`${this.type} ${this.hexAddress}: ${message}`);
    }

    // EZO Base functionality

    public async FindEzoBoard(): Promise<string>{
        try{
            if(this.sensor){
                await (this.sensor as unknown as EZODevice).Find();
                return 'Find Sensor was initiated successfully. Please check for blinking LED';
            }
        }
        catch{
            return 'FindEzoBoard(): Error initiating Find().';
        }
    }

    public async FactoryReset(): Promise<string>{
        try{
            if(this.sensor){
                await (this.sensor as unknown as EZODevice).Factory();
                return 'Factory Reset was initiated successfully.';
            }
        }
        catch{
            return 'FactoryReset(): Error initiating Factory Reset.';
        }
    }

    public async ChangeI2CAddress(newAddress: string): Promise<string>{
        try{
            if(this.sensor){
                await (this.sensor as unknown as EZODevice).ChangeI2CAddress(parseInt(newAddress));
                return 'New I2C adress: ' + newAddress + ' was set successfully.';
            }
        }
        catch{
            return 'ChangeI2CAddress(): Error setting new I2C address.';
        }
    }

    public async SetLed(ledOn: boolean):Promise<string>{
        try{
            this.info('Led Usage: ' + ledOn.toString())
            await (this.sensor as unknown as EZODevice).SetLED(ledOn);
        }
        catch{
            return 'Error occured on setting led usage';
        }
    }
}
