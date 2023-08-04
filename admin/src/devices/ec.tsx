import I18n from '@iobroker/adapter-react/i18n';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import React from 'react';
import { ECConfig } from '../../../src/devices/ec';
import { EzoBase, DeviceProps } from './ezo-base';
import { DeviceInfo } from './ezo-factory';
import { boundMethod } from 'autobind-decorator';
import Switch from '@material-ui/core/Switch';

class EC extends EzoBase<ECConfig> {
    
    private calibrateVal: number;
    private tempCompensationVal: number;
    private probeTypeVal: number;
    private tdsConversionVal: number;

    constructor(props: DeviceProps<ECConfig>) {
        super(props); 
        
        let config: ECConfig;
    
        if (!props.config) {
            config = {
                pollingInterval: 5000,
                uSParamActive: true,
                ppmParamActive: true,
                pptParamActive: true,
                sgParamActive: true,
                isActive: true,
                isLedOn: true,
            };
            props.onChange(config);
        } else {
            config = { ...props.config };
        }
        console.log('new EzoECConfig()', props, config);
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

    public get tdsConversionValue():number{
        return this.tdsConversionVal;
    }
    
    public set tdsConversionValue(value: number){
        this.tdsConversionVal = value;
    }

    public get probeTypeValue():number{
        return this.probeTypeVal;
    }
    
    public set probeTypeValue(value: number){
        this.probeTypeVal = value;
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
    protected doDryCalibration(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Dry Calibration Button pressed');
        this.handleCalibration("Dry", 0);
        return false;
    }

    @boundMethod
    protected doSinglepointCalibration(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Singlepoint Calibration Button pressed');
        this.handleCalibration("Singlepoint", this.calibrateValue);
        return false;
    }

    @boundMethod
    protected doLowCalibration(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Low Calibration Button pressed');
        this.handleCalibration("Low", this.calibrateValue);
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
                "ecValue":Value.toString()
            };
            this.sendCommand("ECCalibration", txPayload );
            return true;
        }
        catch{
            console.log('Error on "EC Calibration"');
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
                "deviceType": "EC",
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

    // ******* TDS conversion *******

    @boundMethod
    protected onTDSConversionValueChange(_event: React.FormEvent<HTMLElement>): boolean {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        const value = this.parseChangedSetting(target);
        this.tdsConversionValue = value;
        console.log('TDS conversion value: ' + this.tdsConversionValue);
        return false;
    }
    
    @boundMethod
    protected setTDSConversionValue(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Set TDS conversion value Button pressed');
        this.handleTDSConversionChange(this.tdsConversionValue);
        return false;
    }

    protected handleTDSConversionChange( tdsValue: number) : boolean {
        try{
            let txPayload : Record<string, any> = {
                "address": this.address.toString(),
                "deviceType": "EC",
                "tdsValue":tdsValue.toString()
            };
            this.sendCommand("EcTDSConversion", txPayload );
            return true;
        }
        catch{
            console.log('Error on "Setting TDS conversion value');
            return false;
        }
    }
    


    // ******* Probe Type *******

    @boundMethod
    protected onProbeTypeValueChange(_event: React.FormEvent<HTMLElement>): boolean {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        const value = this.parseChangedSetting(target);
        this.probeTypeValue = value;
        console.log('probeTypeValue: ' + this.probeTypeValue);
        return false;
    }

    @boundMethod
    protected setProbeTypeValue(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Set Probe Type Button pressed');
        this.handleProbeTypeChange(this.probeTypeValue);
        return false;
    }

    protected handleProbeTypeChange( ptValue: number) : boolean {
        try{
            let txPayload : Record<string, any> = {
                "address": this.address.toString(),
                "probeTypeValue":ptValue.toString()
            };
            this.sendCommand("EcProbeType", txPayload );
            return true;
        }
        catch{
            console.log('Error on "Setting Probe Type"');
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
                        <label >{I18n.t('EC Parameters Configuration')}</label>
                    </Grid>
                    <Grid item xs={7} sm={5} md={3}>
                        <label>
                            <Switch
                                checked={this.state.config.uSParamActive}
                                onChange={this.handleChange}
                                name="uSParamActive"
                            />
                            {I18n.t('EC(uS)')}
                        </label>
                        <label>
                            <Switch
                                checked={this.state.config.ppmParamActive}
                                onChange={this.handleChange}
                                name="ppmParamActive"
                            />
                            {I18n.t('TDS(ppm)')}
                        </label>
                        <label>
                            <Switch
                                checked={this.state.config.pptParamActive}
                                onChange={this.handleChange}
                                name="pptParamActive"
                            />
                            {I18n.t('S(ppt)')}
                        </label>
                        <label>
                            <Switch
                                checked={this.state.config.sgParamActive}
                                onChange={this.handleChange}
                                name="sgParamActive"
                            />
                            {I18n.t('SG')}
                        </label>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <label >{I18n.t('EC Sensor Calibration')}</label>
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
                                onClick={this.doDryCalibration}
                                fullWidth
                            >
                                {I18n.t('Calibrate Dry')}
                            </Button>
                        </Grid>
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
                                onClick={this.doHighCalibration}
                                fullWidth
                            >
                                {I18n.t('Calibrate High')}
                            </Button>
                        </Grid>
                        <Grid>
                            <Button
                                variant="contained"
                                onClick={this.doSinglepointCalibration}
                                fullWidth
                            >
                                {I18n.t('Calibrate Singlepoint')}
                            </Button>
                        </Grid>
                        <Grid>
                            <TextField
                                name="newCalLowValue"
                                label={I18n.t('EC value')}
                                value={this.calibrateValue}
                                type="number"
                                onChange={this.onCalibrateValueChange}
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
                    <Grid item xs={7} sm={5} md={2}>
                        <Grid>
                            <Button
                                variant="contained"
                                onClick={this.setTDSConversionValue}
                                fullWidth
                            >
                                {I18n.t('Set TDS Conversion')}
                            </Button>
                        </Grid>
                        <Grid>
                            <TextField
                                name="tdsConversionVal"
                                label={I18n.t('TDS conversion value')}
                                value={this.tdsConversionValue}
                                type="number"
                                onChange={this.onTDSConversionValueChange}
                                disabled={false}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <label >{I18n.t('EC Probe Type Setting')}</label>
                    </Grid>
                    <Grid item xs={7} sm={5} md={2}>
                        <Grid>
                            <Button
                                variant="contained"
                                onClick={this.setProbeTypeValue}
                                fullWidth
                            >
                                {I18n.t('Set Probe Type')}
                            </Button>
                        </Grid>
                        <Grid>
                            <TextField
                                name="probeTypeVal"
                                label={I18n.t('Probe Type')}
                                value={this.probeTypeValue}
                                type="string"
                                onChange={this.onProbeTypeValueChange}
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
        name: 'Atlas EZO EC',
        addresses: EzoBase.getAllAddresses(0x01, 127), // 97 - 127
        type: 'EC',
        react: EC,
    },
];
