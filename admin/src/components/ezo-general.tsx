import I18n from '@iobroker/adapter-react/i18n';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import { Box, Button, Chip, Divider, Switch } from '@material-ui/core';
import { boundMethod } from 'autobind-decorator';
import React from 'react';
import { EzoDeviceConfig, ImplementationConfigBase } from '../../../src/lib/adapter-config';
import { toHexString } from '../../../src/lib/shared';
import { AppContext } from '../common';
import Dropdown, { DropdownOption } from './dropdown';
import { EzoFactory, DeviceInfo } from '../devices/ezo-factory';
import { EzoBase} from '../devices/ezo-base';
import { EZODevice } from '../../../src/atlas-scientific-i2c';

type OnConfigChangedCallback = (newConfig: EzoDeviceConfig) => void;

interface DeviceTabProps {
    onChange: OnConfigChangedCallback;
    context: AppContext;
    config: EzoDeviceConfig;
}

interface DeviceTabState {
    config: EzoDeviceConfig;
}

export class EzoGeneral extends React.Component<DeviceTabProps, DeviceTabState, EzoBase<ImplementationConfigBase>> {
    private oldConfig?: EzoDeviceConfig;
    private oldComponent?: React.ReactNode;

    constructor(props: DeviceTabProps) {
        super(props);
        this.state = {
            config: props.config,
        };
    }

    public get address(): number {
        return this.props.config.address;
    }

    private get deviceOptions(): DropdownOption[] {
        const options = [{ title: I18n.t('Unused'), value: '' }];
        const supportedDevices = EzoFactory.getSupportedDevices(this.address);
        supportedDevices.forEach((device) => {
            options.push({ title: device.name, value: JSON.stringify(device) });
        });
        return options;
    }

    private get selectedDeviceOption(): string | undefined {
        const supportedDevices = EzoFactory.getSupportedDevices(this.state.config.address);
        const device = supportedDevices.find(
            (device) => device.type === this.state.config.type && device.name === this.state.config.name,
        );
        return device ? JSON.stringify(device) : undefined;
    }

    private renderDeviceComponent(): React.ReactNode {
        if (
            this.oldConfig &&
            this.oldConfig.name === this.state.config.name &&
            this.oldConfig.type === this.state.config.type
        ) {
            // ensure we reuse the component unless the type/name has changed
            return this.oldComponent;
        }

        this.oldConfig = { ...this.state.config };
        const DeviceComponent = EzoFactory.createComponent(this.state.config);
        if (!DeviceComponent) {
            this.oldComponent = undefined;
        } else {
            const implConfig: ImplementationConfigBase = this.state.config[this.state.config.type ?? ''];
            const hadOldComponent = !!this.oldComponent;
            this.oldComponent = (
                <DeviceComponent
                    onChange={this.onDeviceConfigChanged}
                    context={this.props.context}
                    config={implConfig}
                    baseConfig={this.state.config}
                />
            );

            if (hadOldComponent) {
                // return undefined so a new device component is created on the next rendering run,
                // otherwise the existing component will be reused if the type didn't change
                return undefined;
            }
        }
        return this.oldComponent;
    }

    @boundMethod
    private onDeviceTypeSelected(value: string): void {
        const newConfig = { ...this.state.config };
        if (value) {
            const device = JSON.parse(value) as DeviceInfo;
            newConfig.type = device.type;
            newConfig.name = device.name;
        } else {
            delete newConfig.type;
            delete newConfig.name;
        }
        this.setState({ config: newConfig }, () => this.props.onChange(this.state.config));
    }

    @boundMethod
    private onDeviceConfigChanged(newConfig: any): void {
        console.log('onDeviceConfigChanged', newConfig);
        const baseConfig = { ...this.state.config };
        baseConfig[this.state.config.type || ''] = newConfig;
        this.setState({ config: baseConfig }, () => this.props.onChange(this.state.config));
    }

    public render(): React.ReactNode {
        return (
            <>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={12} md={12}>
                        <label >{I18n.t('General Configuration')}</label>
                    </Grid>
                    <Grid item xs={7} sm={5} md={3}>
                        <TextField
                            name="address"
                            label={I18n.t('Address')}
                            value={this.state.config.address + '(' + toHexString(this.state.config.address)+ ')' }
                            type="text"
                            fullWidth
                            disabled={true}
                        />
                    </Grid>
                    <Grid item xs={7} sm={5} md={3}>
                        <Dropdown
                            title="Device Type"
                            attr="type"
                            options={this.deviceOptions}
                            value={this.selectedDeviceOption}
                            onChange={this.onDeviceTypeSelected}
                        ></Dropdown>
                    </Grid>
                </Grid>
                {this.renderDeviceComponent()}
            </>
        );
    }
}

