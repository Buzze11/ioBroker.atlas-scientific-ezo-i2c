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
var ph_exports = {};
__export(ph_exports, {
  default: () => PH
});
module.exports = __toCommonJS(ph_exports);
var import_ezo_handler_base = require("./ezo-handler-base");
var ezo = __toESM(require("../atlas-scientific-i2c"));
class PH extends import_ezo_handler_base.EzoHandlerBase {
  constructor() {
    super(...arguments);
    this.sensor = new ezo.pH(this.adapter.i2cBus, parseInt(this.hexAddress), "");
  }
  async startAsync() {
    if (!this.config.isActive)
      return;
    this.debug("Starting");
    const name = this.config.name || this.name;
    await this.adapter.extendObjectAsync(this.hexAddress, {
      type: "device",
      common: {
        name: this.hexAddress + " (" + name + ")",
        role: "sensor"
      },
      native: this.config
    });
    await this.CreateObjects();
    let deviceName = await this.sensor.GetName();
    if (!this.config.name) {
      this.info("Devicename is not clear. Clearing Devicename");
      await this.sensor.SetName("");
    } else if (this.config.name !== deviceName) {
      this.info("Devicenamehas changed. Setting Devicename to: " + this.config.name);
      await this.sensor.SetName(this.config.name);
    }
    await this.CreateStateChangeListeners();
    await this.SetLed(this.config.isLedOn);
    if (!!this.config.pollingInterval && this.config.pollingInterval > 0) {
      this.startPolling(async () => await this.GetAllReadings(), this.config.pollingInterval, 5e3);
    }
  }
  async CreateStateChangeListeners() {
    this.adapter.addStateChangeListener(this.hexAddress + ".Temperature compensation (Celsius)", async (_oldValue, _newValue) => {
      this.SetTemperatureCompensation(_newValue.toString());
    });
  }
  async CreateObjects() {
    await this.adapter.extendObjectAsync(this.hexAddress + ".Device Status", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "string",
        role: "value"
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".PH Value", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "string",
        role: "value"
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Temperature compensation (Celsius)", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "number",
        role: "value"
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Slope Acid", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "array",
        role: "value"
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Slope Base", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "array",
        role: "value"
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Slope Zero Point", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "array",
        role: "value"
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Info", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "string",
        role: "value"
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Led on", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "boolean",
        role: "value"
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Devicename", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "string",
        role: "value"
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".IsCalibrated", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "string",
        role: "value"
      }
    });
  }
  async stopAsync() {
    this.debug("Stopping");
    this.stopPolling();
  }
  async GetAllReadings() {
    try {
      if (this.sensor != null) {
        var ds = await this.sensor.GetDeviceStatus();
        await this.setStateAckAsync("Device Status", ds);
        var ph = await this.sensor.GetReading();
        await this.setStateAckAsync("PH Value", ph);
        var tc = await this.sensor.GetTemperatureCompensation();
        await this.setStateAckAsync("Temperature compensation (Celsius)", parseFloat(tc));
        var info = await this.sensor.GetInfo();
        await this.setStateAckAsync("Info", info);
        var useLed = await this.sensor.GetLED();
        await this.setStateAckAsync("Led on", useLed);
        var name = await this.sensor.GetName();
        await this.setStateAckAsync("Devicename", name);
        var ic = await this.sensor.IsCalibrated();
        await this.setStateAckAsync("IsCalibrated", ic);
        var slope = await this.sensor.GetSlope();
        if (slope[0] != null)
          await this.setStateAckAsync("Slope Acid", slope[0]);
        if (slope[1] != null)
          await this.setStateAckAsync("Slope Base", slope[1]);
        if (slope[2] != null)
          await this.setStateAckAsync("Slope Zero Point", slope[2]);
      }
    } catch {
    }
  }
  async DoCalibration(calibrationtype, phValue) {
    try {
      this.info("Calibrationtype: " + calibrationtype);
      switch (calibrationtype) {
        case "Clear":
          await this.sensor.ClearCalibration();
          return "DO Calibration was cleared successfully";
          break;
        case "Low":
          await this.sensor.CalibrateLow(parseFloat(phValue));
          return "Low Calibration was done successfully";
          break;
        case "Mid":
          await this.sensor.CalibrateMid(parseFloat(phValue));
          return "Mid Calibration was done successfully";
          break;
        case "High":
          await this.sensor.CalibrateHigh(parseFloat(phValue));
          return "High Calibration was done successfully";
          break;
      }
    } catch {
      return "Error occured on PH Calibration. Calibration Task failed";
    }
  }
  async SetTemperatureCompensation(compensationValue) {
    try {
      this.info("Temperaturecompensation: " + compensationValue);
      await this.sensor.SetTemperatureCompensation(parseFloat(compensationValue));
    } catch {
      return "Error occured on setting temperature compensation";
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
//# sourceMappingURL=ph.js.map
