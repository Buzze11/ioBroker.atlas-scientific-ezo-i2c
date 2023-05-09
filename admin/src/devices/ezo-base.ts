import { boundMethod } from 'autobind-decorator';
import React from 'react';
import { EzoDeviceConfig, ImplementationConfigBase } from '../../../src/lib/adapter-config';
import { AppContext } from '../common';

export interface DeviceProps<T extends ImplementationConfigBase> {
    onChange: (newConfig: T) => void;
    context: AppContext;
    config?: T;
    baseConfig: EzoDeviceConfig;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export abstract class EzoBase<T extends ImplementationConfigBase, S = {}> extends React.Component<DeviceProps<T>,
{ config: T; extra?: S }> {

    private newAddressStr: string;

    public get address(): number {
        return this.props.baseConfig.address;
    }

    public get newAddressString():string{
        return this.newAddressStr;
    }

    public set newAddressString(value: string){
        this.newAddressStr = value;
    }


    public static getAllAddresses(baseAddress: number, range: number): number[] {
        const addresses: number[] = [];
        for (let i = 0; i < range; i++) {
            addresses.push(baseAddress + i);
        }

        return addresses;
    }

    protected setExtraState(value: Partial<S>, callback?: () => void): void {
        this.setState({ extra: { ...this.state.extra, ...value } as S }, callback);
    }

    protected parseChangedSetting(target: HTMLInputElement | HTMLSelectElement, checked?: boolean): any {
        return  target.type === 'checkbox'
                ? !!checked
                : target.type === 'number'
                ? parseFloat(target.value)
                : target.value;
                 
    }

    @boundMethod
    protected async sendCommand(command: string, data?: ioBroker.MessagePayload): Promise<string> {
        
        const { socket, instanceId } = this.props.context;
        try {
            console.log('Sending command request async to Instance: ' + instanceId.toString());
            const result = await socket.sendTo(instanceId, command, data);
            if (typeof result === 'string') {
                return result;
            }
            else{
                return "No result received";
            }
        } finally {

        }
    }

    // gets called when the form elements are changed by the user
    @boundMethod
    protected handleChange(event: React.FormEvent<HTMLElement>, checked?: boolean): boolean {
        const target = event.target as HTMLInputElement | HTMLSelectElement; // TODO: more types
        const value = this.parseChangedSetting(target, checked);
        const id = target.id || target.name;
        const key = id.replace(/^\d+-/, '') as keyof T; // id is usually "<address>-<key>"
        return this.doHandleChange(key, value);
    }

    @boundMethod
    protected onAddressChange(_event: React.FormEvent<HTMLElement>): boolean {
        let minVal = 97;
        let maxVal = 127;
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        const value = this.parseChangedSetting(target);
        if(value){
            if(value < 97){
                this.newAddressString = minVal.toString();
            }
            else if(value > 127){
                this.newAddressString = maxVal.toString();
            }
            else{
                this.newAddressString = value.toString();
            }
            console.log('newAddressString: ' + this.newAddressString);
        }
        return false;
    }

    protected doHandleChange<K extends keyof T>(key: K, value: T[K], callback?: () => void): boolean {
        // store the setting
        this.setState({ config: { ...this.state.config, [key]: value } } as any, () => {
            // and notify the admin UI about changes
            this.props.onChange({ ...this.props.config, ...this.state.config });
            if (callback) {
                callback();
            }
        });
        return false;
    }

    // ********** Common Board funtionality

    // ********** Find EZO Board with blinking LED *********
    @boundMethod
    protected findEzoBoard(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Find Ezo Board Button pressed');
        this.handleFindEzoBoard();
        return false;
    }

    protected handleFindEzoBoard() : boolean {
            try{
                let txPayload : Record<string, any> = {
                    "address": this.address.toString()
                };
                this.sendCommand("FindEzoBoard", txPayload );
                console.log('FindEzoBoard was sent');
                return true;
            }
            catch{
                console.log('Error on "FindEzoBoard"');
                return false;
            }
        }

    
    // ********** Set Device to Factory Defaults *********
    @boundMethod
    protected setFactoryReset(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Factory Reset Button pressed');
        this.handleSetFactoryReset();
        return false;
    }

    protected handleSetFactoryReset() : boolean {
            try{
                let txPayload : Record<string, any> = {
                    "address": this.address.toString()
                };
                this.sendCommand("FactoryReset", txPayload );
                console.log('FactoryReset was sent');
                return true;
            }
            catch{
                console.log('Error on "FactoryReset"');
                return false;
            }
        }
    // ********** Set new I2C Address *********

    @boundMethod
    protected setI2CAddress(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Change I2C Address Button pressed');
        if(this.newAddressString != ''){
            this.handleSetI2CAddress();
            console.log('New Address:' + this.newAddressString);  
        }
        return false;
    }

    protected async handleSetI2CAddress() : Promise<boolean> {
        try{
            let txPayload : Record<string, any> = {
                "address": this.address.toString(),
                "newI2CAddress": this.newAddressString
            };
            console.log('New Addresssssss:' + this.newAddressString); 
            let res = await this.sendCommand("SetI2CAddress", txPayload, );
            console.log('Set new I2C Address was sent. Result: ' + res);
            if(res.includes('successfully')){
                // change went successfully we have to set the config address to the new value and save
                this.props.baseConfig.address = parseInt(this.newAddressString);
                this.doHandleChange(this.state.config['address'], parseInt(this.newAddressString))
            }
            
            return true;
        }
        catch{
            console.log('Error on "SetI2CAddress"');
            return false;
        }
    }

}
