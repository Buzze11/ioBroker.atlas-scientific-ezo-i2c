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
var prs_exports = {};
__export(prs_exports, {
  PRS: () => PRS,
  default: () => PRS
});
module.exports = __toCommonJS(prs_exports);
var import_ezo_device = require("./ezo_device");
class PRS extends import_ezo_device.EZODevice {
  constructor(i2c_bus, address, info, adapter) {
    super(i2c_bus, address, info, adapter);
    this.adapter = adapter;
    this.readBufferSize = 40;
  }
  async SetPressureUnit(unit, isEnabled) {
    this.waitTime = 300;
    await this.SendCommand("U," + unit);
    this.waitTime = 300;
    await this.SendCommand("U," + (isEnabled ? "1" : "0"));
  }
  async ReadPressureUnits() {
    const cmd = "U,?";
    this.waitTime = 300;
    const res = (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1);
    return res;
  }
  async GetReading() {
    this.waitTime = 900;
    const res = (await this.SendCommand("R")).toString("ascii", 1);
    return res;
  }
  async ClearCalibration() {
    this.waitTime = 300;
    await this.SendCommand("Cal,clear");
  }
  async IsCalibrated() {
    const cmd = "Cal,?";
    this.waitTime = 300;
    const res = (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1).replace(/\0/g, "");
    return res;
  }
  async CalibrateZeroPoint() {
    this.waitTime = 900;
    await this.SendCommand("Cal,0");
  }
  async CalibrateHigh(valInCurrentScale) {
    if (!valInCurrentScale)
      return;
    this.waitTime = 900;
    await this.SendCommand("Cal," + valInCurrentScale.toString());
  }
  async SetAlarm(isEnabled, threshold, tolerance) {
    this.waitTime = 300;
    await this.SendCommand("Alarm,en," + (isEnabled ? "1" : "0"));
    await this.SendCommand("Alarm," + threshold.toString());
    await this.SendCommand("Alarm,tol," + tolerance.toString());
  }
  async GetAlarmSetupParameters() {
    const cmd = "Alarm,?";
    this.waitTime = 300;
    const res = (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1).replace(/\0/g, "").split(",");
    return res;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PRS
});
//# sourceMappingURL=prs.js.map
