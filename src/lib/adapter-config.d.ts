// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
    namespace ioBroker {
        interface AdapterConfig {
            busNumber: number;
            devices: EzoDeviceConfig[];
        }
    }
}

export interface EzoDeviceConfig {
    address?: number;
    name?: string;
    type?: string;
    isLedOn?: boolean;
    isActive?: boolean;
    pollingInterval?: number;


    // this can't be described properly with TypeScript as a key of type string wouldn't allow other properties,
    // thus we allow "any" even thought when indexing with a string, we always want an ImplementationConfigBase
    [key: string]: ImplementationConfigBase | any;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ImplementationConfigBase {}
