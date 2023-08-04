var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var main_exports = {};
__export(main_exports, {
  AtlasScientificEzoI2cAdapter: () => AtlasScientificEzoI2cAdapter
});
module.exports = __toCommonJS(main_exports);
var utils = __toESM(require("@iobroker/adapter-core"));
var i2c = __toESM(require("i2c-bus"));
var import_shared = require("./lib/shared");
var ezo = __toESM(require("./atlas-scientific-i2c"));
class AtlasScientificEzoI2cAdapter extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "atlas-scientific-ezo-i2c"
    });
    this.currentStateValues = {};
    this.stateChangeListeners = {};
    this.foreignStateChangeListeners = {};
    this.deviceHandlers = [];
    this.wait = false;
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("message", this.onMessage.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  get i2cBus() {
    return this.bus;
  }
  addStateChangeListener(id, listener) {
    const key = this.namespace + "." + id;
    if (!this.stateChangeListeners[key]) {
      this.stateChangeListeners[key] = [];
    }
    this.stateChangeListeners[key].push(listener);
    this.log.info("Added StateChangeListener: " + key);
  }
  addForeignStateChangeListener(id, listener) {
    if (!this.foreignStateChangeListeners[id]) {
      this.foreignStateChangeListeners[id] = [];
      this.subscribeForeignStates(id);
    }
    this.foreignStateChangeListeners[id].push(listener);
  }
  async setStateAckAsync(id, value) {
    this.currentStateValues[this.namespace + "." + id] = value;
    await this.setStateAsync(id, value, true);
  }
  setStateAck(id, value) {
    this.currentStateValues[this.namespace + "." + id] = value;
    this.setState(id, value, true);
  }
  getStateValue(id) {
    return this.currentStateValues[this.namespace + "." + id];
  }
  async onReady() {
    this.setState("info.connection", false, true);
    const allStates = await this.getStatesAsync("*");
    for (const id in allStates) {
      if (allStates[id] && allStates[id].ack) {
        this.currentStateValues[id] = allStates[id].val;
      }
    }
    this.log.info("Using bus number: " + this.config.busNumber);
    this.bus = await this.openBusAsync(this.config.busNumber);
    if (this.bus == null) {
      this.log.info("Error opening I2C Bus: " + this.config.busNumber);
      this.setState("info.connection", false, true);
    } else {
      this.log.info("Opened I2C Bus: " + this.config.busNumber);
      this.setState("info.connection", true, true);
    }
    if (!this.config.devices || this.config.devices.length === 0) {
      return;
    }
    for (let i = 0; i < this.config.devices.length; i++) {
      const deviceConfig = this.config.devices[i];
      if (!deviceConfig.name || !deviceConfig.type) {
        continue;
      }
      try {
        const module2 = await Promise.resolve().then(() => __toESM(require(__dirname + "/devices/" + deviceConfig.type.toLowerCase())));
        const handler = new module2.default(deviceConfig, this);
        this.deviceHandlers.push(handler);
      } catch (error) {
        this.log.error(`Couldn't create ${deviceConfig.type} ${(0, import_shared.toHexString)(deviceConfig.address)}: ${error}`);
      }
    }
    await Promise.all(
      this.deviceHandlers.map(async (h) => {
        try {
          await h.startAsync();
        } catch (error) {
          this.log.error(`Couldn't start ${h.type} ${h.hexAddress}: ${error}`);
        }
      })
    );
    this.subscribeStates("*");
  }
  async onUnload(callback) {
    try {
      await Promise.all(this.deviceHandlers.map((h) => h.stopAsync()));
      await this.bus.close();
      callback();
    } catch (e) {
      callback();
    }
  }
  async onStateChange(id, state) {
    if (!state) {
      this.log.debug(`State ${id} deleted`);
      return;
    }
    this.log.debug(`stateChange ${id} ${JSON.stringify(state)}`);
    if (this.foreignStateChangeListeners[id]) {
      const listeners2 = this.foreignStateChangeListeners[id];
      await Promise.all(listeners2.map((listener) => listener(state.val)));
      return;
    }
    if (state.ack) {
      return;
    }
    if (!this.stateChangeListeners[id]) {
      this.log.error("Unsupported state change: " + id);
      return;
    }
    const listeners = this.stateChangeListeners[id];
    const oldValue = this.currentStateValues[id];
    await Promise.all(listeners.map((listener) => listener(oldValue, state.val)));
  }
  async onMessage(obj) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t;
    this.log.info("onMessage: " + JSON.stringify(obj));
    try {
      if (typeof obj === "object" && obj.message) {
        switch (obj.command) {
          case "search":
            const res = await this.SearchEzoDevices(parseInt(obj.message));
            this.result = JSON.stringify(res || []);
            this.log.info("Search found: " + this.result);
            this.wait = true;
            break;
          case "FindEzoBoard":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await this.dev.FindEzoBoard();
            }
            this.log.error("Error occured on finding EZO Board: " + res);
            break;
          case "FactoryReset":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await this.dev.FactoryReset();
            }
            this.log.error("Error occured on finding EZO Board: " + res);
            break;
          case "SetI2CAddress":
            let newAddress = this.GetParameterStringFromMessage(obj, "newI2CAddress");
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await this.dev.ChangeI2CAddress(newAddress);
            }
            if (obj.callback) {
              this.sendTo(obj.from, obj.command, this.result, obj.callback);
              this.log.info("Answering with messageresult : " + this.result);
            }
            this.log.error("Error occured on setting new I2C address: " + res);
            break;
          case "DOCalibration":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_a = this.dev) == null ? void 0 : _a.DoCalibration(obj.message["calibrationtype"]));
            }
            this.log.error("Error occured on DO Calibration: " + res);
            break;
          case "DOPressureCompensation":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_b = this.dev) == null ? void 0 : _b.SetPressureCompensation(obj.message["pcValue"]));
              break;
            }
            this.log.error("Error occured on setting pressure compensation: " + res);
            break;
          case "DOSalinityCompensation":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_c = this.dev) == null ? void 0 : _c.SetSalinityCompensation(obj.message["scValue"], obj.message["isPpt"]));
              break;
            }
            this.log.error("Error occured on setting salinity compensation: " + res);
            break;
          case "PHCalibration":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_d = this.dev) == null ? void 0 : _d.DoCalibration(obj.message["calibrationtype"], obj.message["phValue"]));
            }
            this.log.error("Error occured on DO Calibration: " + res);
            break;
          case "TemperatureCompensation":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              const deviceType = obj.message["deviceType"];
              switch (deviceType) {
                case "DO":
                  this.result = await ((_e = this.dev) == null ? void 0 : _e.SetTemperatureCompensation(obj.message["tcValue"]));
                  break;
                case "PH":
                  this.result = await ((_f = this.dev) == null ? void 0 : _f.SetTemperatureCompensation(obj.message["tcValue"]));
                  break;
                case "EC":
                  this.result = await ((_g = this.dev) == null ? void 0 : _g.SetTemperatureCompensation(obj.message["tcValue"]));
                  break;
              }
            }
            this.log.error("Error occured on setting temperature compensation: " + res);
            break;
          case "ORPCalibration":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_h = this.dev) == null ? void 0 : _h.DoCalibration(obj.message["calibrationtype"], obj.message["orpValue"]));
            }
            this.log.error("Error occured on ORP Calibration: " + res);
            break;
          case "RTDCalibration":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_i = this.dev) == null ? void 0 : _i.DoCalibration(obj.message["calibrationtype"], obj.message["tempValue"]));
            }
            this.log.error("Error occured on RTD Calibration: " + res);
            break;
          case "PumpCalibration":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_j = this.dev) == null ? void 0 : _j.DoCalibration(obj.message["calibrationtype"], obj.message["VolumeValue"]));
            }
            this.log.error("Error occured on Pump Calibration: " + res);
            break;
          case "PumpClearDispensedVolume":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_k = this.dev) == null ? void 0 : _k.ClearTotalDispensedVolume());
            }
            this.log.error("Error occured on clearing total dispensed volume: " + res);
            break;
          case "PumpSetContinousDispense":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_l = this.dev) == null ? void 0 : _l.SetContinousDispenseMode(true));
            }
            this.log.error("Error occured on staring continous dispense: " + res);
            break;
          case "PumpStopDispense":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_m = this.dev) == null ? void 0 : _m.SetContinousDispenseMode(false));
            }
            this.log.error("Error occured on stopping dispense: " + res);
            break;
          case "PumpPause":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_n = this.dev) == null ? void 0 : _n.DoPauseDispense());
            }
            this.log.error("Error occured on pausing dispense: " + res);
            break;
          case "PumpSetDoseOverTime":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_o = this.dev) == null ? void 0 : _o.DoseOverTime(obj.message["doseOverTimeValue"]));
            }
            this.log.error("Error occured on starting dose over time: " + res);
            break;
          case "PumpSetDispenseVolume":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_p = this.dev) == null ? void 0 : _p.DispenseVolume(obj.message["dispenseValue"]));
            }
            this.log.error("Error occured on starting dispense volume: " + res);
            break;
          case "PumpSetConstantFlowRate":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_q = this.dev) == null ? void 0 : _q.SetConstantFlowRate(obj.message["constantFlowRateValue"]));
            }
            this.log.error("Error occured on starting dispense volume: " + res);
            break;
          case "ECCalibration":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_r = this.dev) == null ? void 0 : _r.DoCalibration(obj.message["calibrationtype"], obj.message["ecValue"]));
            }
            this.log.error("Error occured on EC Calibration: " + res);
            break;
          case "EcTDSConversion":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_s = this.dev) == null ? void 0 : _s.SetTdsConversion(obj.message["tdsValue"]));
            }
            this.log.error("Error occured on EC Calibration: " + res);
            break;
          case "EcProbeType":
            if (this.dev = await this.GetDeviceHandler(obj)) {
              this.result = await ((_t = this.dev) == null ? void 0 : _t.SetProbeType(obj.message["probeTypeValue"]));
            }
            this.log.error("Error occured on setting probe type: " + res);
            break;
          default:
            this.result = "Unknown command";
            this.log.warn("Unknown command: " + obj.command);
            break;
        }
      }
      if (obj.callback) {
        this.sendTo(obj.from, obj.command, this.result, obj.callback);
        this.log.info("Answering with messageresult : " + this.result);
      }
    } catch {
    }
  }
  async SendBackResult(obj) {
    if (obj.callback) {
      this.sendTo(obj.from, obj.command, this.result, obj.callback);
    }
    this.wait = true;
  }
  async GetDeviceHandler(obj) {
    try {
      const addressString = await this.GetParameterStringFromMessage(obj, "address");
      const addressStringHex = (0, import_shared.toHexString)(parseInt(addressString));
      if (addressStringHex) {
        const handler = await this.GetDeviceHandlerByAddress(addressStringHex);
        return handler;
      } else {
        this.log.error("GetDeviceHandler(): Device with this address has not been found");
      }
    } catch {
      this.log.error("GetDeviceHandler(): Error on getting DeviceHandler");
    }
  }
  async GetDeviceHandlerByAddress(hexAddress) {
    const handler = this.deviceHandlers.find((h) => h.hexAddress == hexAddress);
    return handler;
  }
  GetParameterStringFromMessage(obj, parameterName) {
    const parameter = obj.message[parameterName];
    return parameter;
  }
  async SearchEzoDevices(busNumber) {
    if (busNumber === this.config.busNumber) {
      this.log.debug("Searching on current bus " + busNumber);
    } else {
      this.log.debug("Searching on new bus " + busNumber);
    }
    const searchBus = await this.openBusAsync(busNumber);
    const res = await ezo.FindAllDevices(searchBus, this);
    const devices = [];
    res.forEach(async (item) => {
      if (item instanceof ezo.EZODevice) {
        devices.push(item.address);
      } else {
        console.log("Found Device is not an Atlas EZO Device");
      }
    });
    searchBus.close();
    return devices;
  }
  async openBusAsync(busNumber) {
    return await i2c.openPromisified(busNumber);
  }
}
if (module.parent) {
  module.exports = (options) => new AtlasScientificEzoI2cAdapter(options);
} else {
  (() => new AtlasScientificEzoI2cAdapter())();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AtlasScientificEzoI2cAdapter
});
//# sourceMappingURL=main.js.map
