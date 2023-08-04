import I18n from '@iobroker/adapter-react/i18n';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import React from 'react';
import { DOConfig } from '../../../src/devices/do';
import { EzoBase, DeviceProps } from './ezo-base';
import { DeviceInfo } from './ezo-factory';
import { Switch } from '@material-ui/core';
import { boundMethod } from 'autobind-decorator';

class DO extends EzoBase<DOConfig> {
    
    private tempCompensationVal: number;
    private pressureCompensationVal: number;
    private salinityCompensationVal: number;

    constructor(props: DeviceProps<DOConfig>) {
        super(props); 
        
        let config: DOConfig;
    
        if (!props.config) {
            config = {
                pollingInterval: 5000,
                mgParamActive: true,
                isPpt: false,
                isActive: true,
                isLedOn: true,
            };
            props.onChange(config);
        } else {
            config = { ...props.config };
        }
        console.log('new EzoDOConfig()', props, config);
        this.state = { 
            config: config
        };
    }

    // ******* Calibration *******

    @boundMethod
    protected doClearCalibration(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Clear Calibration Button pressed');
        this.handleCalibration("Clear");
        return false;
    }

    @boundMethod
    protected doAtmosphericCalibration(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Atmosheric Calibration Button pressed');
        this.handleCalibration("Atmospheric");
        return false;
    }

    @boundMethod
    protected do0DOCalibration(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('0DO Calibration Button pressed');
        this.handleCalibration("0DO");
        return false;
    }

    protected handleCalibration(calibrationtype: string) : boolean {
        try{
            let txPayload : Record<string, any> = {
                "address": this.address.toString(),
                "calibrationtype": calibrationtype
            };
            this.sendCommand("DOCalibration", txPayload );
            return true;
        }
        catch{
            console.log('Error on "FindEzoBoard"');
            return false;
        }
    }

    // ***************************************************

    // ******* Temperature compensation *******

    public get tempCompensationValue():number{
        return this.tempCompensationVal;
    }
    
    public set tempCompensationValue(value: number){
        this.tempCompensationVal = value;
    }

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
                "deviceType": "DO",
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

    // ******* Pressure compensation *******

    public get pressureCompensationValue():number{
        return this.pressureCompensationVal;
    }
    
    public set pressureCompensationValue(value: number){
        this.pressureCompensationVal = value;
    }


    @boundMethod
    protected onPressureCompensationValueChange(_event: React.FormEvent<HTMLElement>): boolean {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        const value = this.parseChangedSetting(target);
        this.pressureCompensationValue = value.toString();
        console.log('pressureCompensationValue: ' + this.pressureCompensationValue);
        return false;
    }
    
    @boundMethod
    protected setPressureCompensationValue(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Set Pressure compensation value Button pressed');
        this.handlePressureCompensation(this.pressureCompensationValue);
        return false;
    }

    protected handlePressureCompensation( pcValue: number) : boolean {
        try{
            let txPayload : Record<string, any> = {
                "address": this.address.toString(),
                "pcValue":pcValue.toString()
            };
            this.sendCommand("DOPressureCompensation", txPayload );
            return true;
        }
        catch{
            console.log('Error on "Setting DO Pressure Compensation"');
            return false;
        }
    }

  
    // ******* Salinity compensation *******

    public get salinityCompensationValue():number{
        return this.salinityCompensationVal;
    }
    
    public set salinityCompensationValue(value: number){
        this.salinityCompensationVal = value;
    }
  
    @boundMethod
    protected onSalinityCompensationValueChange(_event: React.FormEvent<HTMLElement>): boolean {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        const value = this.parseChangedSetting(target);
        this.salinityCompensationValue = value;
        console.log('salinityCompensationValue: ' + this.salinityCompensationValue);
        return false;
    }
    
    @boundMethod
    protected setSalinityCompensationValue(_event: React.FormEvent<HTMLElement>): boolean {
        console.log('Set Salinity compensation value Button pressed');
        this.handleSalinityCompensation(this.salinityCompensationValue);
        return false;
    }

    protected handleSalinityCompensation( scValue: number) : boolean {
        try{
            let isPpt = false;
            if(this.state.config.isPpt){
                isPpt = true;
            }

            let txPayload : Record<string, any> = {
                "address": this.address.toString(),
                "scValue":scValue.toString(),
                "isPpt": isPpt.toString(),
            };
            console.log('handleSalinityCompensation');
            this.sendCommand("DOSalinityCompensation", txPayload );
            return true;
        }
        catch{
            console.log('Error on "Setting DO Salinity Compensation"');
            return false;
        }
    }

    // **************************************** // 

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
                    <Grid item xs={7} sm={5} md={3}>
                        <Button
                            variant="contained"
                            disabled={false}
                            onClick={this.findEzoBoard}
                            fullWidth
                        >
                            {I18n.t('Find EZO Board')}
                        </Button>
                    </Grid>
                    <Grid item xs={7} sm={5} md={3}>
                        <Button
                            variant="contained"
                            disabled={false}
                            onClick={this.setFactoryReset}
                            fullWidth
                        >
                            {I18n.t('Factory Reset')}
                        </Button>
                    </Grid>
                    <Grid item xs={7} sm={5} md={3}>
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
                        <label >{I18n.t('DO Parameters Configuration')}</label>
                    </Grid>
                    <Grid item xs={7} sm={5} md={3}>
                        <label>
                            <Switch
                                checked={this.state.config.mgParamActive}
                                onChange={this.handleChange}
                                name="mgParamActive"
                            />
                            mg/L
                        </label>
                        <label>
                            <Switch
                                checked={this.state.config.percentParamActive}
                                onChange={this.handleChange}
                                name="percentParamActive"
                            />
                            %
                        </label>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12}>
                        <label >{I18n.t('DO Sensor Calibration')}</label>
                    </Grid>
                    <Grid item xs={12} sm={5} md={3}>
                        <Grid>
                            <Button 
                                variant="contained"
                                disabled={false}
                                onClick={this.doClearCalibration}
                                fullWidth
                            >
                                {I18n.t('Clear Calibration')}
                            </Button>
                        </Grid>
                        <Grid>
                            <Button 
                                variant="contained"
                                disabled={false}
                                onClick={this.doAtmosphericCalibration}
                                fullWidth
                            >
                                {I18n.t('Atmospheric Calibration')}
                            </Button>
                        </Grid>
                        <Grid>
                            <Button 
                                variant="contained"
                                disabled={false}
                                onClick={this.do0DOCalibration}
                                fullWidth
                            >
                                {I18n.t('0 DO Calibration')}
                            </Button>
                        </Grid>
                    </Grid>
                    <Grid item xs={7} sm={5} md={3}>
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
                    <Grid item xs={7} sm={5} md={3}>
                        <Grid>
                            <Button
                                variant="contained"
                                onClick={this.setPressureCompensationValue}
                                fullWidth
                            >
                                {I18n.t('Set PC Value')}
                            </Button>
                        </Grid>
                        <Grid>
                            <TextField
                                name="pressureCompensationVal"
                                label={I18n.t('Pressure compensation value')}
                                value={this.pressureCompensationValue}
                                type="number"
                                onChange={this.onPressureCompensationValueChange}
                                disabled={false}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={7} sm={5} md={3}>
                        <Grid>
                            <Button
                                variant="contained"
                                onClick={this.setSalinityCompensationValue}
                                fullWidth
                            >
                                {I18n.t('Set SC Value')}
                            </Button>
                        </Grid>
                        <Grid>
                            <TextField
                                name="salinityCompensationVal"
                                label={I18n.t('Salinity compensation value')}
                                value={this.salinityCompensationValue}
                                type="number"
                                onChange={this.onSalinityCompensationValueChange}
                                disabled={false}
                                fullWidth
                            />
                        </Grid>
                        <Grid>
                            <label>
                                <Switch
                                    checked={this.state.config.isPpt}
                                    onChange={this.handleChange}
                                    name="isPpt"
                                />
                                {I18n.t('IsPpt')}
                            </label>
                        </Grid>
                    </Grid>

                </Grid>
            </>
        );
    }
}

export const Infos: DeviceInfo[] = [
    {
        name: 'Atlas EZO D.O',
        addresses: EzoBase.getAllAddresses(0x61, 30), // 97 - 127
        type: 'DO',
        react: DO,
    },
];
