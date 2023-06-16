import { AtlasScientificEzoI2cAdapter } from "../main";

export class Delay {
    private started = false;
    private cancelled = false;
    private timeout?: any;

    private reject?: (reason?: any) => void;

    constructor(private ms: number, protected readonly adapter: AtlasScientificEzoI2cAdapter) {}

    public runAsnyc(): Promise<void> {
        if (this.started) {
            throw new Error(`Can't run delay twice!`);
        }
        this.started = true;
        return new Promise((resolve, reject) => {
            if (this.cancelled) {
                return;
            }
            this.reject = reject;
            this.timeout = this.adapter.setTimeout(resolve, this.ms);
        });
    }

    public cancel(): void {
        if (!this.started || this.cancelled) {
            return;
        }

        this.cancelled = true;
        if (this.timeout) {
            this.adapter.clearTimeout(this.timeout);
        }
        if (this.reject) {
            this.reject(new Error('Cancelled'));
        }
    }
}

export type PollingCallback = () => Promise<void>;

export class Polling {
    private enabled = false;
    private delay?: Delay;

    constructor(private callback: PollingCallback, protected readonly adapter: AtlasScientificEzoI2cAdapter) {}

    async runAsync(interval: number, minInterval?: number): Promise<void> {
        if (this.enabled) {
            return;
        }

        this.enabled = true;
        interval = Math.max(interval, minInterval || 1);
        while (this.enabled) {
            await this.callback();
            try {
                this.delay = new Delay(interval, this.adapter);
                await this.delay.runAsnyc();
            } catch (error) {
                // delay got cancelled, let's break out of the loop
                break;
            }
        }
    }

    stop(): void {
        this.enabled = false;
        this.delay?.cancel();
    }
}
