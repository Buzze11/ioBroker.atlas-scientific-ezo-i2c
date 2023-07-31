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
    this.sensor = new ezo.pH(this.adapter.i2cBus, parseInt(this.hexAddress), "", this.adapter);
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
    const deviceName = await this.sensor.GetName();
    if (!this.config.name) {
      this.info("Devicename is not clear. Clearing Devicename");
      await this.sensor.SetName("");
    } else if (this.config.name !== deviceName) {
      this.info("Devicenamehas changed. Setting Devicename to: " + this.config.name);
      await this.sensor.SetName(this.config.name);
    }
    await this.CreateStateChangeListeners();
    await this.InitNonReadStateValues();
    await this.SetLed(this.config.isLedOn);
    if (!!this.config.pollingInterval && this.config.pollingInterval > 0) {
      this.startPolling(async () => await this.GetAllReadings(), this.config.pollingInterval, 5e3);
    }
  }
  async CreateStateChangeListeners() {
    this.adapter.addStateChangeListener(this.hexAddress + ".Temperature_compensation", async (_oldValue, _newValue) => {
      this.SetTemperatureCompensation(_newValue.toString());
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".IsPaused", async (_oldValue, _newValue) => {
      this.SetPausedFlag(_newValue.toString());
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Calibrate_Clear", async (_oldValue, _newValue) => {
      if (_newValue === true) {
        this.DoCalibration("Clear", "0");
      }
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Calibrate_Low", async (_oldValue, _newValue) => {
      if (_newValue.toString() != "")
        this.DoCalibration("Low", _newValue.toString());
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Calibrate_Mid", async (_oldValue, _newValue) => {
      if (_newValue.toString() != "")
        this.DoCalibration("Mid", _newValue.toString());
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Calibrate_High", async (_oldValue, _newValue) => {
      if (_newValue.toString() != "")
        this.DoCalibration("High", _newValue.toString());
    });
  }
  async CreateObjects() {
    await this.adapter.extendObjectAsync(this.hexAddress + ".Devicestatus", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "string",
        role: "info.status",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".IsPaused", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "boolean",
        role: "switch",
        write: true,
        states: {
          true: "paused",
          false: "unpaused"
        }
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".PH_Value", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "string",
        role: "value",
        unit: "pH",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Temperature_compensation", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "number",
        role: "value.temperature",
        unit: "\xB0C",
        write: true
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Slope_Acid", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "array",
        role: "value",
        unit: "%",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Slope_Base", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "array",
        role: "value",
        unit: "%",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Slope_Zero_Point", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "array",
        role: "value",
        unit: "mV",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Info", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "string",
        role: "info.sensor",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Led_on", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "boolean",
        role: "value",
        write: false,
        states: {
          true: "on",
          false: "off"
        }
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Devicename", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "string",
        role: "info.name",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".IsCalibrated", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "string",
        role: "value",
        write: false,
        states: {
          "0": "uncalibrated",
          "1": "one point",
          "2": "two point",
          "3": "three point"
        }
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Calibrate_Clear", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "boolean",
        role: "switch",
        write: true
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Calibrate_Low", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "string",
        role: "value",
        unit: "pH",
        write: true
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Calibrate_Mid", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "string",
        role: "value",
        unit: "pH",
        write: true
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Calibrate_High", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PH"),
        type: "string",
        role: "value",
        unit: "pH",
        write: true
      }
    });
  }
  async InitNonReadStateValues() {
    try {
      await this.setStateAckAsync("IsPaused", this.pausedState);
      await this.setStateAckAsync("Calibrate_Clear", false);
      await this.setStateAckAsync("Calibrate_Low", "");
      await this.setStateAckAsync("Calibrate_Mid", "");
      await this.setStateAckAsync("Calibrate_High", "");
      return "State objects initialized successfully";
    } catch {
      this.error("Error occured on initializing state objects");
    }
  }
  async stopAsync() {
    this.debug("Stopping");
    this.readingActive = false;
    this.stopPolling();
  }
  async GetAllReadings() {
    try {
      if (this.sensor != null && this.pausedState === false) {
        this.readingActive = true;
        const ds = await this.sensor.GetDeviceStatus();
        await this.setStateAckAsync("Devicestatus", ds);
        const ph = await this.sensor.GetReading();
        await this.setStateAckAsync("PH_Value", ph);
        const tc = await this.sensor.GetTemperatureCompensation();
        await this.setStateAckAsync("Temperature_compensation", parseFloat(tc));
        const info = await this.sensor.GetInfo();
        await this.setStateAckAsync("Info", info);
        const useLed = await this.sensor.GetLED();
        await this.setStateAckAsync("Led_on", useLed);
        const name = await this.sensor.GetName();
        await this.setStateAckAsync("Devicename", name);
        const ic = await this.sensor.IsCalibrated();
        await this.setStateAckAsync("IsCalibrated", ic);
        const slope = await this.sensor.GetSlope();
        if (slope[0] != null)
          await this.setStateAckAsync("Slope_Acid", slope[0]);
        if (slope[1] != null)
          await this.setStateAckAsync("Slope_Base", slope[1]);
        if (slope[2] != null)
          await this.setStateAckAsync("Slope_Zero_Point", slope[2]);
        this.readingActive = false;
      }
    } catch {
      this.error("Error occured on getting Device readings");
      this.readingActive = false;
    }
  }
  async DoCalibration(calibrationtype, phValue) {
    try {
      this.info("Calibrationtype: " + calibrationtype);
      await this.WaitForFinishedReading();
      switch (calibrationtype) {
        case "Clear":
          await this.sensor.ClearCalibration();
          await this.setStateAckAsync("Calibrate_Clear", false);
          return "PH Calibration was cleared successfully";
        case "Low":
          await this.sensor.CalibrateLow(parseFloat(phValue));
          await this.setStateAckAsync("Calibrate_Low", "");
          return "Low Calibration was done successfully";
        case "Mid":
          await this.sensor.CalibrateMid(parseFloat(phValue));
          await this.setStateAckAsync("Calibrate_Mid", "");
          return "Mid Calibration was done successfully";
        case "High":
          await this.sensor.CalibrateHigh(parseFloat(phValue));
          await this.setStateAckAsync("Calibrate_High", "");
          return "High Calibration was done successfully";
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
