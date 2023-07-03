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
    private tempCompensationVal: number;

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

    protected doSomething(): boolean {
        // Do Something
        return true;
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
                            {I18n.t('Find EZO Board')}
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
                                name="newCalLowValue"
                                label={I18n.t('Calibration Volume')}
                                value={this.calibrateValue}
                                type="number"
                                onChange={this.onCalibrateValueChange}
                                InputProps={{ inputProps: { min: 0.0, max: 10.0 } }}
                                disabled={false}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <label >{I18n.t('Pump Control')}</label>
                    </Grid>
                    <Grid item xs={10} sm={7} md={7}>
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
