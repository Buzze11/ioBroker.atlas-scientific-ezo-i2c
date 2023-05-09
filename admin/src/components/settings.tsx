import I18n from '@iobroker/adapter-react/i18n';
import Box from '@material-ui/core/Box';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { Theme, withStyles } from '@material-ui/core/styles';
import { CreateCSSProperties } from '@material-ui/core/styles/withStyles';
import { boundMethod } from 'autobind-decorator';
import React from 'react';
import { EzoDeviceConfig } from '../../../src/lib/adapter-config';
import { toHexString } from '../../../src/lib/shared';
import { AppContext } from '../common';
import { EzoGeneral } from './ezo-general';
import { General } from '../pages/general';

const styles = (theme: Theme): Record<string, CreateCSSProperties> => ({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
        display: 'flex',
        height: 'calc(100% - 102px)',
    },
    tabs: {
        borderRight: `1px solid ${theme.palette.divider}`,
    },
    tabpanel: {
        width: '100%',
        overflowY: 'scroll',
    },
});

interface SettingsProps {
    classes: Record<string, string>;
    native: ioBroker.AdapterConfig;
    context: AppContext;

    onChange: (attr: string, value: any) => void;
}

interface SettingsState {
    tabIndex: number;

    devices: EzoDeviceConfig[];
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: any;
    value: any;
    className: string;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            {...other}
        >
            {value === index && <Box p={3}>{children}</Box>}
        </div>
    );
}

class Settings extends React.Component<SettingsProps, SettingsState> {
    constructor(props: SettingsProps) {
        super(props);

        this.state = { tabIndex: 0, devices: this.props.native.devices };
    }

    @boundMethod
    private onGeneralChange(attr: string, value: any): void {
        this.props.onChange(attr, value);
        if (attr === 'devices') {
            this.setState({ devices: value });
        }
    }

    @boundMethod
    private onDeviceChange(config: EzoDeviceConfig): void {
        console.log('onDeviceChange()', config);
        const index = this.state.devices.findIndex((device) => device.address === config.address);
        if (index >= 0) {
            const devices = [...this.state.devices];
            devices[index] = config;
            this.onGeneralChange('devices', devices);
        }
    }

    @boundMethod
    private handleTabChange(_event: React.ChangeEvent<any>, newValue: number): void {
        this.setState({ tabIndex: newValue });
    }

    private get labels(): string[] {
        const all = [I18n.t('General')];
        this.state.devices.forEach((device) => {
            all.push(toHexString(device.address).replace('x', '𝗑')); // replace the regular x with a math symbol to show it in lowercase
        });
        return all;
    }

    render(): React.ReactNode {
        const { classes, native, context } = this.props;
        return (
            <div className={classes.root}>
                <Tabs
                    orientation="vertical"
                    variant="scrollable"
                    value={this.state.tabIndex}
                    onChange={this.handleTabChange}
                    className={classes.tabs}
                >
                    {this.labels.map((k, i) => (
                        <Tab key={`tab-${i}`} label={k} id={`tab-${i}`} />
                    ))}
                </Tabs>
                <TabPanel value={this.state.tabIndex} index={0} className={classes.tabpanel}>
                    <General settings={native} context={context} onChange={this.onGeneralChange} />
                </TabPanel>
                {this.state.devices.map((device, i) => (
                    <TabPanel
                        key={`tabpanel-${i + 1}`}
                        value={this.state.tabIndex}
                        index={i + 1}
                        className={classes.tabpanel}
                    >
                        <EzoGeneral
                            key={device.address}
                            context={context}
                            config={device}
                            onChange={this.onDeviceChange}
                        />
                    </TabPanel>
                ))}
            </div>
        );
    }
}

export default withStyles(styles)(Settings);
