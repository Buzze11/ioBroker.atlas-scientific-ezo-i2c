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
var do_exports = {};
__export(do_exports, {
  default: () => DO
});
module.exports = __toCommonJS(do_exports);
var import_ezo_handler_base = require("./ezo-handler-base");
var ezo = __toESM(require("../atlas-scientific-i2c"));
class DO extends import_ezo_handler_base.EzoHandlerBase {
  constructor() {
    super(...arguments);
    this.sensor = new ezo.DO(this.adapter.i2cBus, parseInt(this.hexAddress), "", this.adapter);
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
    const deviceParameters = await this.sensor.GetParametersEnabled();
    const deviceName = await this.sensor.GetName();
    if (!this.config.name) {
      this.info("Devicename is not clear. Clearing Devicename");
      await this.sensor.SetName("");
    } else if (this.config.name !== deviceName) {
      this.info("Devicenamehas changed. Setting Devicename to: " + this.config.name);
      await this.sensor.SetName(this.config.name);
    }
    if (this.config.mgParamActive && !deviceParameters.includes("MG")) {
      await this.sensor.SetParameter("MG", true);
    } else if (!this.config.mgParamActive && deviceParameters.includes("MG")) {
      await this.sensor.SetParameter("MG", false);
    }
    if (this.config.percentParamActive && !deviceParameters.includes("%")) {
      await this.sensor.SetParameter("%", true);
    } else if (!this.config.percentParamActive && deviceParameters.includes("%")) {
      await this.sensor.SetParameter("%", false);
    }
    await this.SetLed(this.config.isLedOn);
    await this.CreateStateChangeListeners();
    await this.InitNonReadStateValues();
    if (this.config.isActive && !!this.config.pollingInterval && this.config.pollingInterval > 0) {
      this.startPolling(async () => await this.GetAllReadings(), this.config.pollingInterval, 5e3);
    }
  }
  async CreateStateChangeListeners() {
    this.adapter.addStateChangeListener(this.hexAddress + ".Temperature_compensation", async (_oldValue, _newValue) => {
      this.SetTemperatureCompensation(_newValue.toString());
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Salinity_compensation", async (_oldValue, _newValue) => {
      const sc = await this.sensor.GetSalinityCompensation();
      if (sc[1] == "ppt") {
        this.SetSalinityCompensation(_newValue.toString(), "true");
      } else {
        this.SetSalinityCompensation(_newValue.toString(), "false");
      }
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Pressure_compensation", async (_oldValue, _newValue) => {
      this.SetPressureCompensation(_newValue.toString());
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".IsPaused", async (_oldValue, _newValue) => {
      this.SetPausedFlag(_newValue.toString());
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Calibrate_Clear", async (_oldValue, _newValue) => {
      if (_newValue === true) {
        this.DoCalibration("Clear");
      }
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Calibrate_Atmospheric", async (_oldValue, _newValue) => {
      if (_newValue === true) {
        this.DoCalibration("Atmospheric");
      }
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Calibrate_Zero_DO", async (_oldValue, _newValue) => {
      if (_newValue === true) {
        this.DoCalibration("0DO");
      }
    });
  }
  async InitNonReadStateValues() {
    try {
      await this.setStateAckAsync("IsPaused", this.pausedState);
      await this.setStateAckAsync("Calibrate_Clear", false);
      await this.setStateAckAsync("Calibrate_Atmospheric", false);
      await this.setStateAckAsync("Calibrate_Zero_DO", false);
      return "State objects initialized successfully";
    } catch {
      this.error("Error occured on initializing state objects");
    }
  }
  async CreateObjects() {
    await this.adapter.extendObjectAsync(this.hexAddress + ".Devicestatus", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "DO"),
        type: "string",
        role: "info.status",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".IsPaused", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "DO"),
        type: "boolean",
        role: "switch",
        write: true,
        states: {
          true: "paused",
          false: "unpaused"
        }
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Dissolved_Oxygen", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "DO"),
        type: "string",
        role: "value",
        unit: "mg/L, Saturation %",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Temperature_compensation", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "DO"),
        type: "number",
        role: "value.temperature",
        unit: "\xB0C",
        write: true
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Salinity_compensation", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "DO"),
        type: "number",
        role: "value",
        unit: "uS / ppt",
        write: true
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Salinity_compensation_ispPt", {
      type: "state",
      common: {
        name: this.hexAddress + " " + this.config.name,
        type: "boolean",
        role: "value",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Pressure_compensation", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "DO"),
        type: "number",
        role: "value.pressure",
        unit: "kPa",
        write: true
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Parameters_enabled", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "DO"),
        type: "string",
        role: "value",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Info", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "DO"),
        type: "string",
        role: "info.sensor",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Led_on", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "DO"),
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
        name: this.hexAddress + " " + (this.config.name || "DO"),
        type: "string",
        role: "info.name",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".IsCalibrated", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "DO"),
        type: "string",
        role: "value",
        write: false,
        states: {
          "0": "uncalibrated",
          "1": "Atmospheric",
          "2": "Atmospheric & 0DO"
        }
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Calibrate_Clear", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "DO"),
        type: "boolean",
        role: "switch",
        write: true
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Calibrate_Atmospheric", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "DO"),
        type: "boolean",
        role: "switch",
        write: true
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Calibrate_Zero_DO", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "DO"),
        type: "boolean",
        role: "switch",
        write: true
      }
    });
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
        const ox = await this.sensor.GetReading();
        await this.setStateAckAsync("Dissolved_Oxygen", ox);
        const tc = await this.sensor.GetTemperatureCompensation();
        await this.setStateAckAsync("Temperature_compensation", parseFloat(tc));
        const sc = await this.sensor.GetSalinityCompensation();
        await this.setStateAckAsync("Salinity_compensation", parseFloat(sc[0]));
        await this.setStateAckAsync("Salinity_compensation_ispPt", sc[1] == "ppt");
        const pc = await this.sensor.GetPressureCompensation();
        await this.setStateAckAsync("Pressure_compensation", parseFloat(pc));
        const pe = await this.sensor.GetParametersEnabled();
        await this.setStateAckAsync("Parameters_enabled", pe);
        const info = await this.sensor.GetInfo();
        await this.setStateAckAsync("Info", info);
        const useLed = await this.sensor.GetLED();
        await this.setStateAckAsync("Led_on", useLed);
        const name = await this.sensor.GetName();
        await this.setStateAckAsync("Devicename", name);
        const ic = await this.sensor.IsCalibrated();
        await this.setStateAckAsync("IsCalibrated", ic);
        this.readingActive = false;
      }
    } catch {
      this.error("Error occured on getting Device readings");
      this.readingActive = false;
    }
  }
  async DoCalibration(calibrationtype) {
    try {
      await this.WaitForFinishedReading();
      this.info("Calibrationtype: " + calibrationtype);
      switch (calibrationtype) {
        case "Clear":
          await this.sensor.ClearCalibration();
          await this.setStateAckAsync("Calibrate_Clear", false);
          return "DO Calibration was cleared successfully";
          break;
        case "Atmospheric":
          await this.sensor.CalibrateAtmosphericOxygen();
          await this.setStateAckAsync("Calibrate_Atmospheric", false);
          return "Atmospheric DO Calibration was done successfully";
          break;
        case "0DO":
          await this.sensor.Calibrate0DissolvedOxygen();
          await this.setStateAckAsync("Calibrate_Zero_DO", false);
          return "0DO Calibration was done successfully";
          break;
      }
    } catch {
      return "Error occured on DO Calibration. Calibration Task failed";
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
  async SetPressureCompensation(compensationValue) {
    try {
      this.info("Pressurecompensation: " + compensationValue);
      await this.sensor.SetPressureCompensation(compensationValue);
    } catch {
      return "Error occured on setting pressure compensation";
    }
  }
  async SetSalinityCompensation(compensationValue, isPpt) {
    try {
      this.info("Salinitycompensation: " + compensationValue + " isPpt: " + isPpt);
      if (isPpt.includes("true")) {
        await this.sensor.SetSalinityCompensation(parseFloat(compensationValue), true);
      } else {
        await this.sensor.SetSalinityCompensation(parseFloat(compensationValue), false);
      }
    } catch {
      return "Error occured on setting Salinity_compensation";
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
//# sourceMappingURL=do.js.map
