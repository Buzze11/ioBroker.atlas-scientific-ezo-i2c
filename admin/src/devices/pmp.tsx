import I18n from '@iobroker/adapter-react/i18n';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import React from 'react';
import { EzoBase, DeviceProps } from './ezo-base';
import { DeviceInfo } from './ezo-factory';
import { boundMethod } from 'autobind-decorator';
import Switch from '@material-ui/core/Switch';
import { PeristalticPumpConfig } from '../../../src/devices/pump';


class Pump extends EzoBase<PeristalticPumpConfig> {
    
    private calibrateVal: number;
    private doseOverTimeVal: string;
    private dispenseVal: string;
    private constantFlowRateVal: string;


    constructor(props: DeviceProps<PeristalticPumpConfig>) {
        super(props); 
        
        let config: PeristalticPumpConfig;
    
        if (!props.config) {
            config = {
                pollingInterval: 5000,
                isActive: true,
                V_ParamActive: true,
                TV_ParamActive: true,
                ATV_ParamActive: true,
                reverse: false,
            };
            props.onChange(config);
        } else {
            config = { ...props.config };
        }
        console.log('new PeristalticPumpConfig()', props, config);
        this.state = { 
            config: config
        };
    }

    public get calibrateValue():number{
        return this.calibrateVal;
    }
    
    public set calibrateValue(value: number){
        this.calibrateVal = value;
    }

    public get doseOverTimeValue():string{
        return this.doseOverTimeVal;
    }
    
    public set doseOverTimeValue(value: string){
        this.doseOverTimeVal = value;
    }

    public get dispenseValue():string{
        return this.dispenseVal;
    }
    
    public set dispenseValue(value: string){
        this.dispenseVal = value;
    }

    public get constantFlowRateValue():string{
        return this.constantFlowRateVal;
    }
    
    public set constantFlowRateValue(value: string){
        this.constantFlowRateVal = value;
    }

    // ******* Calibration *******

    @boundMethod
    protected onCalibrateValueChange(_event: React.FormEvent<HTMLElement>): boolean {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        const value = this.parseChangedSetting(target);
        this.calibrateValue = value.toString();
        console.log('newCalibrateValue: ' + this.calibrateValue);
        return false;
    }


    @boundMethod
    protected doClearCalibration(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Clear Calibration Button pressed');
        this.handleCalibration("Clear", 0);
        return false;
    }

    @boundMethod
    protected doClearDispensedVolume(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Clear dispensed volume Button pressed');
        this.handleClearDispensedVolume();
        return false;
    }

    @boundMethod
    protected doCalibration(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Calibration Button pressed');
        this.handleCalibration("Standard", this.calibrateValue);
        return false;
    }

    protected handleCalibration(calibrationtype: string, Volume: number) : boolean {
        try{
            const txPayload : Record<string, any> = {
                "address": this.address.toString(),
                "calibrationtype": calibrationtype,
                "VolumeValue":Volume.toString()
            };
            this.sendCommand("PumpCalibration", txPayload );
            return true;
        }
        catch{
            console.log('Error on "Pump Calibration"');
            return false;
        }
    }

    // ******* Clear total dispensed Volume *******

    protected handleClearDispensedVolume() : boolean {
        try{
            const txPayload : Record<string, any> = {
                "address": this.address.toString(),
            };
            this.sendCommand("PumpClearDispensedVolume", txPayload );
            return true;
        }
        catch{
            console.log('Error on "Clear dispensed Volume"');
            return false;
        }
    }

    // ******* Continous Dispense *******

    @boundMethod
    protected doHandleContinousDispense(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Continous Dispense Button pressed');
        this.handleContinousDispense();
        return false;
    }

    protected handleContinousDispense() : boolean {
        try{
            const txPayload : Record<string, any> = {
                "address": this.address.toString(),
                "reverse": this.state.config.reverse?.toString()
            };
            this.sendCommand("PumpSetContinousDispense", txPayload );
            return true;
        }
        catch{
            console.log('Error on "setting continous Dispense Mode"');
            return false;
        }
    }

    // ******* Stop Dispense *******

    @boundMethod
    protected doHandleStop(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Stop Dispense Button pressed');
        this.handleStop();
        return false;
    }

    protected handleStop() : boolean {
        try{
            const txPayload : Record<string, any> = {
                "address": this.address.toString(),
            };
            this.sendCommand("PumpStopDispense", txPayload );
            return true;
        }
        catch{
            console.log('Error on "stopping dispense"');
            return false;
        }
    }

    // ******* Pause Pump *******

    @boundMethod
    protected doHandlePause(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Pause Pump Button pressed');
        this.handlePause();
        return false;
    }

    protected handlePause() : boolean {
        try{
            const txPayload : Record<string, any> = {
                "address": this.address.toString(),
            };
            this.sendCommand("PumpPause", txPayload );
            return true;
        }
        catch{
            console.log('Error on "pausing Pump"');
            return false;
        }
    }
 
    // ******* Dose over time *******

    @boundMethod
    protected onDoseOverTimeValueChange(_event: React.FormEvent<HTMLElement>): boolean {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        const value = this.parseChangedSetting(target);
        this.doseOverTimeValue = value.toString();
        console.log('new Dose over Time Value: ' + this.doseOverTimeValue);
        return false;
    }

    @boundMethod
    protected setDoseOverTime(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Set Dose over Time Button pressed');
        this.handleDoseOverTime(this.doseOverTimeValue);
        return false;
    }

    protected handleDoseOverTime( dotValue: string) : boolean {
        try{
            const txPayload : Record<string, any> = {
                "address": this.address.toString(),
                "doseOverTimeValue":dotValue
            };
            this.sendCommand("PumpSetDoseOverTime", txPayload );
            return true;
        }
        catch{
            console.log('Error on "Setting dose over time"');
            return false;
        }
    }

    // ******* Dispense volume *******

    @boundMethod
    protected onDispenseValueChange(_event: React.FormEvent<HTMLElement>): boolean {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        const value = this.parseChangedSetting(target);
        this.dispenseValue = value.toString();
        console.log('new Dispense Value: ' + this.dispenseValue);
        return false;
    }

    @boundMethod
    protected setDispenseVolume(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Dispense Volume Button pressed');
        this.handleDispenseVolume(this.dispenseValue);
        return false;
    }

    protected handleDispenseVolume( dispValue: string) : boolean {
        try{
            const txPayload : Record<string, any> = {
                "address": this.address.toString(),
                "dispenseValue":dispValue
            };
            this.sendCommand("PumpSetDispenseVolume", txPayload );
            return true;
        }
        catch{
            console.log('Error on "Setting dispense Volume"');
            return false;
        }
    }

    // ******* Constant Flow rate *******

    @boundMethod
    protected onConstantFlowRateValueChange(_event: React.FormEvent<HTMLElement>): boolean {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        const value = this.parseChangedSetting(target);
        this.constantFlowRateValue = value.toString();
        console.log('new constant Flow Rate Value: ' + this.constantFlowRateValue);
        return false;
    }

    @boundMethod
    protected setConstantFlowRate(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Set constant flow rate Button pressed');
        this.handleConstantFlowRate(this.constantFlowRateValue);
        return false;
    }

    protected handleConstantFlowRate( cfrValue: string) : boolean {
        try{
            const txPayload : Record<string, any> = {
                "address": this.address.toString(),
                "constantFlowRateValue":cfrValue
            };
            this.sendCommand("PumpSetConstantFlowRate", txPayload );
            return true;
        }
        catch{
            console.log('Error on "Setting Constant Flow Rate"');
            return false;
        }
    }

    // ***************************************************

    public render(): React.ReactNode {
        return (
            <>
                <Grid container spacing={3}>
                    <Grid item xs={7} sm={5} md={3}>
                        <TextField
                            name="name"
                            label={I18n.t('Name')}
                            value={this.state.config.name || ''}
                            type="text"
                            fullWidth
                            onChange={this.handleChange}
                        />
                    </Grid>
                    <Grid item xs={7} sm={5} md={3}>
                        <TextField
                            name="pollingInterval"
                            label={I18n.t('Polling Interval')}
                            value={this.state.config.pollingInterval}
                            type="number"
                            InputProps={{
                                inputProps: { min: 10000, max: 3600000  },
                                endAdornment: <InputAdornment position="end">ms</InputAdornment>,
                            }}
                            fullWidth
                            onChange={this.handleChange}
                        />
                    </Grid>
                    <Grid item xs={7} sm={5} md={3}>
                        <label>
                            <Switch
                                checked={this.state.config.isActive}
                                onChange={this.handleChange}
                                name="isActive"
                            />
                            {I18n.t('Active')}
                        </label>
                        <label>
                            <Switch
                                checked={this.state.config.isLedOn}
                                onChange={this.handleChange}
                                name="isLedOn"
                            />
                            {I18n.t('IsLedActive')}
                        </label>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <Grid item xs={7} sm={5} md={3}>
                            <label >{I18n.t('Functionalities')}</label>
                        </Grid>
                    </Grid>
                    <Grid item xs={7} sm={5} md={2}>
                        <Button
                            variant="contained"
                            disabled={false}
                            onClick={this.findEzoBoard}
                            fullWidth
                        >
                            {I18n.t('Find Pump')}
                        </Button>
                    </Grid>
                    <Grid item xs={7} sm={5} md={2}>
                        <Button
                            variant="contained"
                            disabled={false}
                            onClick={this.setFactoryReset}
                            fullWidth
                        >
                            {I18n.t('Factory Reset')}
                        </Button>
                    </Grid>
                    <Grid item xs={7} sm={5} md={2}>
                        <Grid>
                            <Button
                                variant="contained"

                                onClick={this.setI2CAddress}
                                fullWidth
                            >
                                {I18n.t('Change I2C Address')}
                            </Button>
                        </Grid>
                        <Grid>
                            <TextField
                                name="newAddress"
                                label={I18n.t('New Address')}
                                value={this.newAddressString}
                                type="number"
                                onChange={this.onAddressChange}
                                InputProps={{ inputProps: { min: 97, max: 127 } }}
                                disabled={false}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <label >{I18n.t('Pump Parameters Configuration')}</label>
                    </Grid>
                    <Grid item xs={10} sm={7} md={7}>
                        <label>
                            <Switch
                                checked={this.state.config.V_ParamActive}
                                onChange={this.handleChange}
                                name="V_ParamActive"
                            />
                            {I18n.t('Dispensed Volume')}
                        </label>
                        <label>
                            <Switch
                                checked={this.state.config.TV_ParamActive}
                                onChange={this.handleChange}
                                name="TV_ParamActive"
                            />
                            {I18n.t('Total Dispensed Volume')}
                        </label>
                        <label>
                            <Switch
                                checked={this.state.config.ATV_ParamActive}
                                onChange={this.handleChange}
                                name="ATV_ParamActive"
                            />
                            {I18n.t('Absolute Dispensed Volume')}
                        </label>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <label >{I18n.t('Pump Calibration')}</label>
                    </Grid>
                    <Grid item xs={12} sm={5} md={2}>
                        <Button 
                            variant="contained"
                            disabled={false}
                            onClick={this.doClearCalibration}
                            fullWidth
                        >
                            {I18n.t('Clear Calibration')}
                        </Button>
                    </Grid>
                    <Grid item xs={7} sm={5} md={2}>
                        <Grid>
                            <Button
                                variant="contained"
                                onClick={this.doCalibration}
                                fullWidth
                            >
                                {I18n.t('Calibrate')}
                            </Button>
                        </Grid>
                        <Grid>
                            <TextField
                                name="newCalValue"
                                label={I18n.t('Calibration Volume')}
                                value={this.calibrateValue}
                                type="number"
                                onChange={this.onCalibrateValueChange}
                                disabled={false}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <label >{I18n.t('Pump Control')}</label>
                    </Grid>
                    <Grid item xs={5} sm={3} md={1}>
                        <label>
                            <Switch
                                checked={this.state.config.reverse}
                                onChange={this.handleChange}
                                name="reverse"
                            />
                            {I18n.t('pump reverse')}
                        </label>
                    </Grid>
                    <Grid item xs={12} sm={5} md={2}>
                        <Button 
                            variant="contained"
                            disabled={false}
                            onClick={this.doClearDispensedVolume}
                            fullWidth
                        >
                            {I18n.t('ClearDispensedVolume')}
                        </Button>
                    </Grid>
                    
                    <Grid item xs={7} sm={5} md={3}>
                        <Grid>
                            <Button
                                variant="contained"
                                onClick={this.doHandleContinousDispense}
                                fullWidth
                            >
                                {I18n.t('Continous Dispense')}
                            </Button>
                        </Grid>
                    </Grid>
                    <Grid item xs={7} sm={5} md={3}>
                        <Grid>
                            <Button
                                variant="contained"
                                onClick={this.doHandleStop}
                                fullWidth
                            >
                                {I18n.t('Stop Dispense')}
                            </Button>
                        </Grid>
                    </Grid>
                    <Grid item xs={7} sm={5} md={3}>
                        <Grid>
                            <Button
                                variant="contained"
                                onClick={this.doHandlePause}
                                fullWidth
                            >
                                {I18n.t('Pause Pump')}
                            </Button>
                        </Grid>
                    </Grid>
                     <Grid item xs={12} sm={12} md={12}>
                    </Grid>
                    <Grid item xs={7} sm={5} md={3}>
                        <Grid>
                            <Button
                                variant="contained"
                                onClick={this.setDoseOverTime}
                                fullWidth
                            >
                                {I18n.t('Set Dose over Time')}
                            </Button>
                        </Grid>
                        <Grid>
                            <TextField
                                name="doseOverTimeVal"
                                label={I18n.t('Dose over time value')}
                                value={this.doseOverTimeValue}
                                type="string"
                                onChange={this.onDoseOverTimeValueChange}
                                disabled={false}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={7} sm={5} md={3}>
                        <Grid>
                            <Button
                                variant="contained"
                                onClick={this.setDispenseVolume}
                                fullWidth
                            >
                                {I18n.t('Dispense Volume')}
                            </Button>
                        </Grid>
                        <Grid>
                            <TextField
                                name="dispenseVolumeVal"
                                label={I18n.t('Dispense volume value')}
                                value={this.dispenseValue}
                                type="string"
                                onChange={this.onDispenseValueChange}
                                disabled={false}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={7} sm={5} md={3}>
                        <Grid>
                            <Button
                                variant="contained"
                                onClick={this.setConstantFlowRate}
                                fullWidth
                            >
                                {I18n.t('Set constant flow rate')}
                            </Button>
                        </Grid>
                        <Grid>
                            <TextField
                                name="constantFlowRateVal"
                                label={I18n.t('Constant flow rate value')}
                                value={this.constantFlowRateValue}
                                type="string"
                                onChange={this.onConstantFlowRateValueChange}
                                disabled={false}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </>
        );
    }
}

export const Infos: DeviceInfo[] = [
    {
        name: 'Atlas EZO Pump',
        addresses: EzoBase.getAllAddresses(0x61, 30), // 97 - 127
        type: 'Pump',
        react: Pump,
    },
];
