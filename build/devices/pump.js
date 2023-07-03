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
var pump_exports = {};
__export(pump_exports, {
  default: () => PeristalticPump
});
module.exports = __toCommonJS(pump_exports);
var import_ezo_handler_base = require("./ezo-handler-base");
var ezo = __toESM(require("../atlas-scientific-i2c"));
class PeristalticPump extends import_ezo_handler_base.EzoHandlerBase {
  constructor() {
    super(...arguments);
    this.sensor = new ezo.Pump(this.adapter.i2cBus, parseInt(this.hexAddress), "", this.adapter);
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
    const deviceParameters = await this.sensor.GetParametersEnabled();
    if (!this.config.name) {
      this.info("Devicename is not clear. Clearing Devicename");
      await this.sensor.SetName("");
    } else if (this.config.name !== deviceName) {
      this.info("Devicenamehas changed. Setting Devicename to: " + this.config.name);
      await this.sensor.SetName(this.config.name);
    }
    if (this.config.V_ParamActive && !deviceParameters.includes("V")) {
      await this.sensor.SetParameters("V", true);
    } else if (!this.config.V_ParamActive && deviceParameters.includes("V")) {
      await this.sensor.SetParameters("V", false);
    }
    if (this.config.TV_ParamActive && !deviceParameters.includes("TV")) {
      await this.sensor.SetParameters("TV", true);
    } else if (!this.config.TV_ParamActive && deviceParameters.includes("TV")) {
      await this.sensor.SetParameters("TV", false);
    }
    if (this.config.ATV_ParamActive && !deviceParameters.includes("ATV")) {
      await this.sensor.SetParameters("ATV", true);
    } else if (!this.config.ATV_ParamActive && deviceParameters.includes("ATV")) {
      await this.sensor.SetParameters("ATV", false);
    }
    await this.CreateStateChangeListeners();
    await this.SetLed(this.config.isLedOn);
    if (!!this.config.pollingInterval && this.config.pollingInterval > 0) {
      this.startPolling(async () => await this.GetAllReadings(), this.config.pollingInterval, 5e3);
    }
  }
  async CreateStateChangeListeners() {
    this.adapter.addStateChangeListener(this.hexAddress + ".Continous_dispense", async (_oldValue, _newValue) => {
      if (_newValue === true) {
        this.SetContinousDispenseMode(_newValue);
      }
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Dose_over_time", async (_oldValue, _newValue) => {
      if (_newValue === "string") {
        this.DoseOverTime(_newValue);
      }
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Dispense_volume", async (_oldValue, _newValue) => {
      if (_newValue === "string") {
        this.DispenseVolume(_newValue);
      }
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Constant_flow_rate", async (_oldValue, _newValue) => {
      if (_newValue === "string") {
        this.SetConstantFlowRate(_newValue);
      }
    });
  }
  async CreateObjects() {
    await this.adapter.extendObjectAsync(this.hexAddress + ".Devicestatus", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "Pump"),
        type: "string",
        role: "info.status",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Pump_Voltage", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "Pump"),
        type: "string",
        role: "value",
        unit: "V",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Dispensed_Volume", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "Pump"),
        type: "string",
        role: "value",
        unit: "ml",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Total_Dispensed_Volume", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "Pump"),
        type: "string",
        role: "value",
        unit: "ml",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".abs_Total_Dispensed_Volume", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "Pump"),
        type: "string",
        role: "value",
        unit: "ml",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Info", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "Pump"),
        type: "string",
        role: "info.sensor",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Led_on", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "Pump"),
        type: "boolean",
        role: "value",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Devicename", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "Pump"),
        type: "string",
        role: "info.name",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".IsCalibrated", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "Pump"),
        type: "string",
        role: "value",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Parameters_enabled", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "Pump"),
        type: "string",
        role: "value",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Pump_Paused", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "Pump"),
        type: "boolean",
        role: "value",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Continous_dispense", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "Pump"),
        type: "boolean",
        role: "switch",
        write: true
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Dose_over_time", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "Pump"),
        type: "string",
        role: "value",
        write: true
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Dispense_volume", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "Pump"),
        type: "string",
        role: "value",
        write: true
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Constant_flow_rate", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "Pump"),
        type: "string",
        role: "value",
        write: true
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
        const ds = await this.sensor.GetDeviceStatus();
        await this.setStateAckAsync("Devicestatus", ds);
        const dv = await this.sensor.GetReading();
        await this.setStateAckAsync("Dispensed_Volume", dv);
        const info = await this.sensor.GetInfo();
        await this.setStateAckAsync("Info", info);
        const useLed = await this.sensor.GetLED();
        await this.setStateAckAsync("Led_on", useLed);
        const name = await this.sensor.GetName();
        await this.setStateAckAsync("Devicename", name);
        const ic = await this.sensor.isCalibrated();
        await this.setStateAckAsync("IsCalibrated", ic);
        const tdv = await this.sensor.GetTotalDispensedVolume(false);
        await this.setStateAckAsync("Total_Dispensed_Volume", tdv);
        const abs_tdv = await this.sensor.GetTotalDispensedVolume(true);
        await this.setStateAckAsync("abs_Total_Dispensed_Volume", abs_tdv);
        const pe = await this.sensor.GetParametersEnabled();
        await this.setStateAckAsync("Parameters_enabled", pe);
        const pv = await this.sensor.GetPumpVoltage();
        await this.setStateAckAsync("Pump_Voltage", pv);
        const ip = await this.sensor.IsPaused();
        await this.setStateAckAsync("Pump_Paused", ip);
      }
    } catch {
    }
  }
  async DoCalibration(calibrationtype, Volume) {
    try {
      this.info("Calibrationtype: " + calibrationtype);
      switch (calibrationtype) {
        case "Clear":
          await this.sensor.ClearCalibration();
          return "Pump Calibration was cleared successfully";
          break;
        case "Standard":
          await this.sensor.Calibrate(Volume);
          return "Pump Calibration was done successfully";
          break;
      }
    } catch {
      return "Error occured on Pump Calibration. Calibration Task failed";
    }
  }
  async SetContinousDispenseMode(on_off) {
    try {
      this.info("Continous_dispense: " + on_off);
      if (on_off) {
        await this.sensor.StartDispensing(this.config.reverse);
      } else {
        await this.sensor.StopDispensing();
      }
    } catch {
      return "Error occured on starting continous dispense";
    }
  }
  async DoseOverTime(value) {
    try {
      const separator = ",";
      const substrings = value.trim().split(separator);
      if (substrings.length > 1) {
        const volume = parseInt(substrings[0]);
        const duration = parseInt(substrings[1]);
        this.info("Dose_over_time - Volume: " + volume + " Duration: " + duration);
        await this.sensor.Dose(volume, duration);
      }
    } catch {
      return "Error occured on executing dose over time";
    }
  }
  async DispenseVolume(value) {
    try {
      this.info("Dispense - Volume: " + value);
      await this.sensor.Dispense(value);
    } catch {
      return "Error occured on dispensing volume";
    }
  }
  async SetConstantFlowRate(value) {
    try {
      const separator = ",";
      const substrings = value.trim().split(separator);
      if (substrings.length > 1) {
        const volume_per_min = parseInt(substrings[0]);
        const duration = substrings[1];
        this.info("Dose_over_time - Volume/minute: " + volume_per_min + " Duration: " + duration);
        await this.sensor.DispenseConstantRate(volume_per_min, duration);
      }
    } catch {
      return "Error occured on maintaining constant flow rate";
    }
  }
  async ClearTotalDispensedVolume() {
    try {
      this.info("Clearing total dispensed Volume ");
      await this.sensor.ClearTotalDispensedVolume();
    } catch {
      return "Error occured on starting continous dispense";
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
//# sourceMappingURL=pump.js.map
