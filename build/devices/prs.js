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
var prs_exports = {};
__export(prs_exports, {
  default: () => PRS
});
module.exports = __toCommonJS(prs_exports);
var import_ezo_handler_base = require("./ezo-handler-base");
var ezo = __toESM(require("../atlas-scientific-i2c"));
class PRS extends import_ezo_handler_base.EzoHandlerBase {
  constructor() {
    super(...arguments);
    this.sensor = new ezo.PRS(this.adapter.i2cBus, parseInt(this.hexAddress), "", this.adapter);
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
    const deviceParameters = await this.sensor.ReadPressureUnits();
    await this.SetUnits(deviceParameters);
    const deviceName = await this.sensor.GetName();
    if (!this.config.name) {
      this.info("Devicename is not clear. Clearing Devicename");
      await this.sensor.SetName("");
    } else if (this.config.name != deviceName) {
      this.info("Devicename has changed. Setting Devicename to: " + this.config.name);
      await this.sensor.SetName(this.config.name);
    }
    await this.InitNonReadStateValues();
    await this.SetAlarmConfig(this.config.alarmActive, this.config.alarmThreshold, this.config.alarmTolerance);
    await this.CreateStateChangeListeners();
    await this.SetLed(this.config.isLedOn);
    if (!!this.config.pollingInterval && this.config.pollingInterval > 0) {
      this.startPolling(async () => await this.GetAllReadings(), this.config.pollingInterval, 5e3);
    }
  }
  async CreateStateChangeListeners() {
    this.adapter.addStateChangeListener(this.hexAddress + ".IsPaused", async (_oldValue, _newValue) => {
      this.SetPausedFlag(_newValue.toString());
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Calibrate_Clear", async (_oldValue, _newValue) => {
      if (_newValue === true) {
        this.DoCalibration("Clear", "");
      }
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Calibrate_Zeropoint", async (_oldValue, _newValue) => {
      if (_newValue.toString() != "")
        this.DoCalibration("Zeropoint", "");
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Calibrate_High", async (_oldValue, _newValue) => {
      if (_newValue.toString() != "")
        this.DoCalibration("High", _newValue.toString());
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Alarm_enabled", async (_oldValue, _newValue) => {
      if (_newValue != _oldValue) {
        this.config.alarmActive = _newValue ? true : false;
        await this.SetAlarmConfig(this.config.alarmActive, this.config.alarmThreshold, this.config.alarmTolerance);
      }
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Alarm_Threshold", async (_oldValue, _newValue) => {
      if (_newValue != _oldValue) {
        this.config.alarmThreshold = parseFloat(_newValue.toString());
        await this.SetAlarmConfig(this.config.alarmActive, this.config.alarmThreshold, this.config.alarmTolerance);
      }
    });
    this.adapter.addStateChangeListener(this.hexAddress + ".Alarm_Tolerance", async (_oldValue, _newValue) => {
      if (_newValue != _oldValue) {
        this.config.alarmTolerance = parseFloat(_newValue.toString());
        await this.SetAlarmConfig(this.config.alarmActive, this.config.alarmThreshold, this.config.alarmTolerance);
      }
    });
  }
  async CreateObjects() {
    await this.adapter.extendObjectAsync(this.hexAddress + ".Devicestatus", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PRS"),
        type: "string",
        role: "info.status",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".IsPaused", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PRS"),
        type: "boolean",
        role: "switch",
        write: true,
        states: {
          true: "paused",
          false: "unpaused"
        }
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Pressure_Value", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PRS"),
        type: "string",
        role: "value",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Info", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PRS"),
        type: "string",
        role: "info.sensor",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Led_on", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PRS"),
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
        name: this.hexAddress + " " + (this.config.name || "PRS"),
        type: "string",
        role: "info.name",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".IsCalibrated", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PRS"),
        type: "string",
        role: "value",
        write: false,
        states: {
          "0": "uncalibrated",
          "1": "only zero point",
          "2": "only high point",
          "3": "zero point and high point"
        }
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Calibrate_Clear", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PRS"),
        type: "boolean",
        role: "switch",
        write: true
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Calibrate_Zeropoint", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PRS"),
        type: "boolean",
        role: "switch",
        write: true
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Calibrate_High", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PRS"),
        type: "string",
        role: "value",
        write: true
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Units_enabled", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PRS"),
        type: "string",
        role: "value",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Alarm_enabled", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PRS"),
        type: "boolean",
        role: "switch",
        write: true
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Alarm_Threshold", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PRS"),
        type: "string",
        role: "value",
        write: false
      }
    });
    await this.adapter.extendObjectAsync(this.hexAddress + ".Alarm_Tolerance", {
      type: "state",
      common: {
        name: this.hexAddress + " " + (this.config.name || "PRS"),
        type: "string",
        role: "value",
        write: false
      }
    });
  }
  async InitNonReadStateValues() {
    try {
      await this.setStateAckAsync("IsPaused", this.pausedState);
      await this.setStateAckAsync("Calibrate_Clear", false);
      await this.setStateAckAsync("Calibrate_Zeropoint", false);
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
        const pv = await this.sensor.GetReading();
        await this.setStateAckAsync("Pressure_Value", pv);
        const info = await this.sensor.GetInfo();
        await this.setStateAckAsync("Info", info);
        const useLed = await this.sensor.GetLED();
        await this.setStateAckAsync("Led_on", useLed);
        const name = await this.sensor.GetName();
        await this.setStateAckAsync("Devicename", name);
        const ic = await this.sensor.IsCalibrated();
        await this.setStateAckAsync("IsCalibrated", ic);
        const ue = await this.sensor.ReadPressureUnits();
        await this.setStateAckAsync("Units_enabled", ue);
        const ac = await this.sensor.GetAlarmSetupParameters;
        if ((ac == null ? void 0 : ac.length) === 3) {
          if (ac[0] === "1")
            await this.setStateAckAsync("Alarm_enabled", true);
          else if (ac[0] === "0")
            await this.setStateAckAsync("Alarm_enabled", false);
          await this.setStateAckAsync("Alarm_Threshold", parseFloat(ac[1]));
          await this.setStateAckAsync("Alarm_Tolerance", parseFloat(ac[2]));
        }
        this.readingActive = false;
      }
    } catch {
      this.error("Error occured on getting Device readings");
      this.readingActive = false;
    }
  }
  async DoCalibration(calibrationtype, Value) {
    try {
      this.info("Calibrationtype: " + calibrationtype);
      await this.WaitForFinishedReading();
      switch (calibrationtype) {
        case "Clear":
          await this.sensor.ClearCalibration();
          await this.setStateAckAsync("Calibrate_Clear", false);
          return "PRS Calibration was cleared successfully";
        case "Zeropoint":
          await this.sensor.CalibrateZeroPoint();
          await this.setStateAckAsync("Calibrate_Zeropoint", false);
          return "Zeropoint calibration was done successfully";
        case "High":
          await this.sensor.CalibrateHigh(parseFloat(Value));
          await this.setStateAckAsync("Calibrate_High", "");
          return "High Calibration was done successfully";
      }
    } catch {
      return "Error occured on PRS Calibration. Calibration Task failed";
    }
  }
  async SetUnits(activatedUnits) {
    try {
      const params = activatedUnits.split(",");
      if (this.config.psiParamActive && !params.includes("psi")) {
        await this.sensor.SetPressureUnit("psi", true);
      } else if (!this.config.psiParamActive && params.includes("psi")) {
        await this.sensor.SetPressureUnit("psi", false);
      }
      if (this.config.atmParamActive && !params.includes("atm")) {
        await this.sensor.SetPressureUnit("atm", true);
      } else if (!this.config.atmParamActive && params.includes("atm")) {
        await this.sensor.SetPressureUnit("atm", false);
      }
      if (this.config.barParamActive && !params.includes("bar")) {
        await this.sensor.SetPressureUnit("bar", true);
      } else if (!this.config.barParamActive && params.includes("bar")) {
        await this.sensor.SetPressureUnit("bar", false);
      }
      if (this.config.kPaParamActive && !params.includes("kPa")) {
        await this.sensor.SetPressureUnit("kPa", true);
      } else if (!this.config.kPaParamActive && params.includes("kPa")) {
        await this.sensor.SetPressureUnit("kPa", false);
      }
      if (this.config.inh2oParamActive && !params.includes("inh2o")) {
        await this.sensor.SetPressureUnit("inh2o", true);
      } else if (!this.config.inh2oParamActive && params.includes("inh2o")) {
        await this.sensor.SetPressureUnit("inh2o", false);
      }
      if (this.config.cmh2oParamActive && !params.includes("cmh2o")) {
        await this.sensor.SetPressureUnit("cmh2o", true);
      } else if (!this.config.cmh2oParamActive && params.includes("cmh2o")) {
        await this.sensor.SetPressureUnit("cmh2o", false);
      }
      return "Successfully configured PRS parameters";
    } catch {
      return "Error occured on setting PRS parameters";
    }
  }
  async SetAlarmConfig(enabled, threshold, tolerance) {
    try {
      await this.sensor.SetAlarm(enabled, threshold, tolerance);
      return "Successfully configured PRS alarm";
    } catch {
      return "Error occured on configuring PRS alarm";
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
//# sourceMappingURL=prs.js.map
