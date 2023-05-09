import I18n from '@iobroker/adapter-react/i18n';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import React from 'react';
import { EzoBase, DeviceProps } from './ezo-base';
import { DeviceInfo } from './ezo-factory';
import { boundMethod } from 'autobind-decorator';
import { ORPConfig } from '../../../src/devices/orp';
import Switch from '@material-ui/core/Switch';

class ORP extends EzoBase<ORPConfig> {
    
    private calibrateVal: number;

    constructor(props: DeviceProps<ORPConfig>) {
        super(props); 
        
        let config: ORPConfig;
    
        if (!props.config) {
            config = {
                pollingInterval: 5000,
                isActive: true,
            };
            props.onChange(config);
        } else {
            config = { ...props.config };
        }
        console.log('new EzoORPConfig()', props, config);
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
    protected doCalibration(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Calibration Button pressed');
        this.handleCalibration("Standard", this.calibrateValue);
        return false;
    }

    protected handleCalibration(calibrationtype: string, orpValue: number) : boolean {
        try{
            let txPayload : Record<string, any> = {
                "address": this.address.toString(),
                "calibrationtype": calibrationtype,
                "orpValue":orpValue.toString()
            };
            this.sendCommand("ORPCalibration", txPayload );
            return true;
        }
        catch{
            console.log('Error on "ORP Calibration"');
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
                        <label >{I18n.t('ORP Sensor Calibration')}</label>
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
                                name="calibrateValue"
                                label={I18n.t('ORP value')}
                                value={this.calibrateValue}
                                type="number"
                                onChange={this.onCalibrateValueChange}
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
        name: 'Atlas EZO ORP',
        addresses: EzoBase.getAllAddresses(0x61, 30), // 97 - 127
        type: 'ORP',
        react: ORP,
    },
];
