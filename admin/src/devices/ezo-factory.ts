import React from 'react';
import { EzoDeviceConfig } from '../../../src/lib/adapter-config';
import * as ScientificEzoDO from './do';
import * as ScientificEzoPH from './ph';
import * as ScientificEzoORP from './orp';
import * as ScientificEzoRTD from './rtd';
import * as ScientificEzoPump from './pmp';
import * as ScientificEzoEC from './ec';
import * as ScientificEzoPRS from './prs';

export interface DeviceInfo {
    readonly name: string;
    readonly type: string;
    readonly addresses: number[];
    readonly react: typeof React.Component;
}

export class EzoFactory {
    public static readonly supportedDevices: DeviceInfo[] = [
        ...ScientificEzoDO.Infos,
        ...ScientificEzoPH.Infos,
        ...ScientificEzoORP.Infos,
        ...ScientificEzoRTD.Infos,
        ...ScientificEzoPump.Infos,
        ...ScientificEzoEC.Infos,
        ...ScientificEzoPRS.Infos,
        
    ];

    static getSupportedDevices(address: number): DeviceInfo[] {
        return this.supportedDevices
            .filter((info) => !!info.addresses.find((a) => a === address))
            .sort(EzoFactory.compareDevice);
    }

    static createComponent(config: EzoDeviceConfig): typeof React.Component | undefined {
        console.log('createComponent', config);
        if (!config.type) {
            return undefined;
        }
        const device = this.supportedDevices.find((info) => info.type === config.type && info.name === config.name);
        if (!device) {
            return undefined;
        }

        return device.react;
    }

    private static compareDevice(a: DeviceInfo, b: DeviceInfo): number {
        const nameA = a.name == 'Generic' ? 'zzzz' : a.name;
        const nameB = b.name == 'Generic' ? 'zzzz' : b.name;

        return nameA.localeCompare(nameB);
    }
}
