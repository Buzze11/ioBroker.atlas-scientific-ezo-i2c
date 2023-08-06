var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var do_meter_exports = {};
__export(do_meter_exports, {
  DO: () => DO,
  default: () => DO
});
module.exports = __toCommonJS(do_meter_exports);
var import_ezo_device = require("./ezo_device");
class DO extends import_ezo_device.EZODevice {
  constructor(i2c_bus, address, info, adapter) {
    super(i2c_bus, address, info, adapter);
    this.adapter = adapter;
  }
  async ClearCalibration() {
    this.waitTime = 300;
    await this.SendCommand("Cal,clear");
  }
  async CalibrateAtmosphericOxygen() {
    this.waitTime = 1300;
    await this.SendCommand("Cal");
  }
  async Calibrate0DissolvedOxygen() {
    this.waitTime = 1300;
    await this.SendCommand("Cal,0");
  }
  async IsCalibrated() {
    const cmd = "Cal,?";
    this.waitTime = 300;
    return (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1).replace(/\0/g, "");
  }
  async SetTemperatureCompensation(value, takeReading = false) {
    let cmd = "T,";
    if (takeReading) {
      this.waitTime = 900;
      cmd = "RT,";
      const r = (await this.SendCommand(cmd + value)).toString("ascii", cmd.length + 1).replace(/\0/g, "");
      this.waitTime = 300;
      return r;
    } else {
      await this.SendCommand(cmd + value);
      return null;
    }
  }
  async GetTemperatureCompensation() {
    const cmd = "T,?";
    this.waitTime = 300;
    return (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1).replace(/\0/g, "");
  }
  async SetSalinityCompensation(value, isPpt = false) {
    this.waitTime = 300;
    await this.SendCommand("S," + value + (isPpt ? ",ppt" : ""));
  }
  async GetSalinityCompensation() {
    const cmd = "S,?";
    this.waitTime = 300;
    const resp = (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1).replace(/\0/g, "").split(",");
    return resp;
  }
  async SetPressureCompensation(value) {
    this.waitTime = 300;
    await this.SendCommand("P," + value);
  }
  async GetPressureCompensation() {
    const cmd = "P,?";
    this.waitTime = 300;
    return (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1).replace(/\0/g, "");
  }
  async SetParameter(parameter, isEnabled) {
    this.waitTime = 300;
    await this.SendCommand("O," + parameter + "," + (isEnabled ? "1" : "0"));
  }
  async GetParametersEnabled() {
    const cmd = "O,?";
    this.waitTime = 300;
    return (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1).replace(/\0/g, "");
  }
  async GetReading() {
    this.waitTime = 600;
    const r = (await this.SendCommand("R")).toString("ascii", 1).replace(/\0/g, "");
    return r;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DO
});
//# sourceMappingURL=do_meter.js.map
