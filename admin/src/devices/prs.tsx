import I18n from '@iobroker/adapter-react/i18n';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import React from 'react';
import { PRSConfig } from '../../../src/devices/prs';
import { EzoBase, DeviceProps } from './ezo-base';
import { DeviceInfo } from './ezo-factory';
import { boundMethod } from 'autobind-decorator';
import Switch from '@material-ui/core/Switch';

class PRS extends EzoBase<PRSConfig> {
    
    private calibrateVal: number;

    constructor(props: DeviceProps<PRSConfig>) {
        super(props); 
        
        let config: PRSConfig;
    
        if (!props.config) {
            config = {
                pollingInterval: 5000,
                psiParamActive: true,
                atmParamActive: true,
                barParamActive: true,
                kPaParamActive: true,
                inh2oParamActive: true,
                cmh2oParamActive: true,
                alarmThreshold: 0,
                alarmTolerance: 0,
                alarmActive: false,
                isActive: true,
                isLedOn: true,
            };
            props.onChange(config);
        } else {
            config = { ...props.config };
        }
        console.log('new EzoPRSConfig()', props, config);
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
    protected doZeropointCalibration(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Zeropoint Calibration Button pressed');
        this.handleCalibration("PRSZeropoint", this.calibrateValue);
        return false;
    }

    @boundMethod
    protected doHighCalibration(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('High Calibration Button pressed');
        this.handleCalibration("High", this.calibrateValue);
        return false;
    }

    protected handleCalibration(calibrationtype: string, Value: number) : boolean {
        try{
            let txPayload : Record<string, any> = {
                "address": this.address.toString(),
                "calibrationtype": calibrationtype,
                "prsValue":Value.toString()
            };
            this.sendCommand("PRSCalibration", txPayload );
            return true;
        }
        catch{
            console.log('Error on "PRS Calibration"');
            return false;
        }
    }

    // ***************************************************

    // ******* Alarm configuration *******

    // @boundMethod
    // protected onAlarmThresholdValueChange(_event: React.FormEvent<HTMLElement>): boolean {
    //     const target = event.target as HTMLInputElement | HTMLSelectElement;
    //     const value = this.parseChangedSetting(target);
    //     this.calibrateValue = value.toString();
    //     console.log('new alarm threshold value: ' + this.alarmThresholdValue);
    //     return false;
    // }

    // @boundMethod
    // protected onAlarmToleranceValueChange(_event: React.FormEvent<HTMLElement>): boolean {
    //     const target = event.target as HTMLInputElement | HTMLSelectElement;
    //     const value = this.parseChangedSetting(target);
    //     this.calibrateValue = value.toString();
    //     console.log('new alarm tolerance value: ' + this.alarmToleranceValue);
    //     return false;
    // }

    @boundMethod
    protected setAlarmConfig(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Set Alarm Config Button pressed');
        this.handleSetAlarmConfig(this.state.config.alarmActive, this.state.config.alarmThreshold, this.state.config.alarmTolerance);
        return false;
    }

    protected handleSetAlarmConfig(enabled: boolean, ThresholdValue: number, ToleranceValue: number) : boolean {
        try{
            let txPayload : Record<string, any> = {
                "address": this.address.toString(),
                "enabled":enabled.toString(),
                "alarmThresholdVal":ThresholdValue.toString(),
                "alarmToleranceVal":ToleranceValue.toString(),
            };
            this.sendCommand("PRSSetAlarmConfig", txPayload );
            return true;
        }
        catch{
            console.log('Error on "Setting PRS Alarm Config"');
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
                        <label >{I18n.t('PRS Parameters Configuration')}</label>
                    </Grid>
                    <Grid item xs={7} sm={5} md={3}>
                        <label>
                            <Switch
                                checked={this.state.config.psiParamActive}
                                onChange={this.handleChange}
                                name="psiParamActive"
                            />
                            {I18n.t('psi')}
                        </label>
                        <label>
                            <Switch
                                checked={this.state.config.atmParamActive}
                                onChange={this.handleChange}
                                name="atmParamActive"
                            />
                            {I18n.t('atm')}
                        </label>
                        <label>
                            <Switch
                                checked={this.state.config.barParamActive}
                                onChange={this.handleChange}
                                name="barParamActive"
                            />
                            {I18n.t('bar')}
                        </label>
                        <label>
                            <Switch
                                checked={this.state.config.kPaParamActive}
                                onChange={this.handleChange}
                                name="kPaParamActive"
                            />
                            {I18n.t('kPa')}
                        </label>
                        <label>
                            <Switch
                                checked={this.state.config.inh2oParamActive}
                                onChange={this.handleChange}
                                name="inh2oParamActive"
                            />
                            {I18n.t('inh2o')}
                        </label>
                        <label>
                            <Switch
                                checked={this.state.config.cmh2oParamActive}
                                onChange={this.handleChange}
                                name="cmh2oParamActive"
                            />
                            {I18n.t('cmh2o')}
                        </label>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <label >{I18n.t('PRS Sensor Calibration')}</label>
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
                                onClick={this.doZeropointCalibration}
                                fullWidth
                            >
                                {I18n.t('Calibrate Zeropoint')}
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
                                name="calibrateValue"
                                label={I18n.t('PRS value')}
                                value={this.calibrateValue}
                                type="number"
                                onChange={this.onCalibrateValueChange}
                                disabled={false}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <label >{I18n.t('PRS Alarm Settings')}</label>
                    </Grid>
                    <Grid item xs={7} sm={5} md={2}>
                        <Grid>
                            <Button
                                variant="contained"
                                onClick={this.setAlarmConfig}
                                fullWidth
                            >
                                {I18n.t('Set Alarm config')}
                            </Button>
                        </Grid>
                        <label>
                            <Switch
                                checked={this.state.config.alarmActive}
                                onChange={this.handleChange}
                                name="alarmActive"
                            />
                            {I18n.t('Alarm active')}
                        </label>
                        <Grid>
                            <TextField
                                name="alarmThreshold"
                                label={I18n.t('Alarm Threshold')}
                                value={this.state.config.alarmThreshold}
                                type="number"
                                onChange={this.handleChange}
                                disabled={false}
                                fullWidth
                            />
                        </Grid>
                        <Grid>
                            <TextField
                                name="alarmTolerance"
                                label={I18n.t('Alarm Tolerance')}
                                value={this.state.config.alarmTolerance}
                                type="number"
                                onChange={this.handleChange}
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
        name: 'Atlas EZO PRS',
        addresses: EzoBase.getAllAddresses(0x01, 127), // 97 - 127
        type: 'PRS',
        react: PRS,
    },
];
