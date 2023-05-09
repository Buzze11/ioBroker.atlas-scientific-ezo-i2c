import I18n from '@iobroker/adapter-react/i18n';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import React from 'react';
import { DOConfig as PHConfig } from '../../../src/devices/do';
import { EzoBase, DeviceProps } from './ezo-base';
import { DeviceInfo } from './ezo-factory';
import { boundMethod } from 'autobind-decorator';
import Switch from '@material-ui/core/Switch';

class PH extends EzoBase<PHConfig> {
    
    private calibrateVal: number;
    private tempCompensationVal: number;

    constructor(props: DeviceProps<PHConfig>) {
        super(props); 
        
        let config: PHConfig;
    
        if (!props.config) {
            config = {
                pollingInterval: 5000,
                mgParamActive: true,
                isActive: true,
            };
            props.onChange(config);
        } else {
            config = { ...props.config };
        }
        console.log('new EzoPHConfig()', props, config);
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

    public get tempCompensationValue():number{
        return this.tempCompensationVal;
    }
    
    public set tempCompensationValue(value: number){
        this.tempCompensationVal = value;
    }

    protected doSomething(): boolean {
        // Do Something
        return true;
    }

    // ******* Calibration *******

    @boundMethod
    protected onCalibrateValueChange(_event: React.FormEvent<HTMLElement>): boolean {
        let minVal = 0.0;
        let maxVal = 10.0;
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        const value = this.parseChangedSetting(target);
        if(value < minVal){
            this.calibrateValue = minVal;
        }
        else if(value > maxVal){
            this.calibrateValue = maxVal;
        }
        else{
            this.calibrateValue = value.toString();
        }
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
    protected doLowCalibration(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Low Calibration Button pressed');
        this.handleCalibration("Low", this.calibrateValue);
        return false;
    }

    @boundMethod
    protected doMidCalibration(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Mid Calibration Button pressed');
        this.handleCalibration("Mid", this.calibrateValue);
        return false;
    }

    @boundMethod
    protected doHighCalibration(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('High Calibration Button pressed');
        this.handleCalibration("High", this.calibrateValue);
        return false;
    }

    protected handleCalibration(calibrationtype: string, pHValue: number) : boolean {
        try{
            let txPayload : Record<string, any> = {
                "address": this.address.toString(),
                "calibrationtype": calibrationtype,
                "phValue":pHValue.toString()
            };
            this.sendCommand("PHCalibration", txPayload );
            return true;
        }
        catch{
            console.log('Error on "PH Calibration"');
            return false;
        }
    }

    // ***************************************************

    // ******* Temperature compensation *******

    @boundMethod
    protected onTempCompensationValueChange(_event: React.FormEvent<HTMLElement>): boolean {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        const value = this.parseChangedSetting(target);
        this.tempCompensationValue = value;
        console.log('tempCompensationValue: ' + this.tempCompensationValue);
        return false;
    }
    
    @boundMethod
    protected setTempCompensationValue(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Set Temp. compensation value Button pressed');
        this.handleTempCompensation(this.tempCompensationValue);
        return false;
    }

    protected handleTempCompensation( tcValue: number) : boolean {
        try{
            let txPayload : Record<string, any> = {
                "address": this.address.toString(),
                "deviceType": "PH",
                "tcValue":tcValue.toString()
            };
            this.sendCommand("TemperatureCompensation", txPayload );
            return true;
        }
        catch{
            console.log('Error on "Setting Temperature Compensation"');
            return false;
        }
    }


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
                        <label >{I18n.t('PH Sensor Calibration')}</label>
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
                                onClick={this.doLowCalibration}
                                fullWidth
                            >
                                {I18n.t('Calibrate Low')}
                            </Button>
                        </Grid>
                        <Grid>
                            <Button
                                variant="contained"
                                onClick={this.doMidCalibration}
                                fullWidth
                            >
                                {I18n.t('Calibrate Mid')}
                            </Button>
                        </Grid>
                        <Grid>
                            <Button
                                variant="contained"
                                onClick={this.doHighCalibration}
                                fullWidth
                            >
                                {I18n.t('Calibrate High')}
                            </Button>
                        </Grid>
                        <Grid>
                            <TextField
                                name="newCalLowValue"
                                label={I18n.t('PH value')}
                                value={this.calibrateValue}
                                type="number"
                                onChange={this.onCalibrateValueChange}
                                InputProps={{ inputProps: { min: 0.0, max: 10.0 } }}
                                disabled={false}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={7} sm={5} md={2}>
                        <Grid>
                            <Button
                                variant="contained"
                                onClick={this.setTempCompensationValue}
                                fullWidth
                            >
                                {I18n.t('Set TC Value')}
                            </Button>
                        </Grid>
                        <Grid>
                            <TextField
                                name="tempCompensationVal"
                                label={I18n.t('Temp. compensation value')}
                                value={this.tempCompensationValue}
                                type="number"
                                onChange={this.onTempCompensationValueChange}
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
        name: 'Atlas EZO PH',
        addresses: EzoBase.getAllAddresses(0x61, 30), // 97 - 127
        type: 'PH',
        react: PH,
    },
];
