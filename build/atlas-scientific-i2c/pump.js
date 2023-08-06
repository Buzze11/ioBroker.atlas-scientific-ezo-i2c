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
var pump_exports = {};
__export(pump_exports, {
  Pump: () => Pump,
  default: () => Pump
});
module.exports = __toCommonJS(pump_exports);
var import_ezo_device = require("./ezo_device");
class Pump extends import_ezo_device.EZODevice {
  constructor(i2c_bus, address, info, adapter) {
    super(i2c_bus, address, info, adapter);
    this.adapter = adapter;
    this.readBufferSize = 16;
  }
  async StartDispensing(reverse) {
    this.waitTime = 300;
    if (reverse) {
      await this.SendCommand("D,-*");
    } else {
      await this.SendCommand("D,*");
    }
  }
  async StopDispensing() {
    this.waitTime = 300;
    return (await this.SendCommand("X")).toString().split(",")[1];
  }
  async Dispense(ml) {
    this.waitTime = 300;
    await this.SendCommand("D," + ml);
  }
  async Dose(ml, min) {
    this.waitTime = 300;
    await this.SendCommand(`D,${ml},${min}`);
  }
  async DispenseConstantRate(rate, min) {
    this.waitTime = 300;
    await this.SendCommand(`DC,${rate},${min}`);
  }
  async PauseDispensing() {
    this.waitTime = 300;
    await this.SendCommand("P");
  }
  async IsPaused() {
    const cmd = "P,?";
    return (await this.SendCommand(cmd))[cmd.length + 1] == 1;
  }
  async GetPumpVoltage() {
    const cmd = "PV,?";
    this.waitTime = 300;
    return (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1);
  }
  async GetReading() {
    this.waitTime = 300;
    return Number.parseFloat((await this.SendCommand("R")).toString("ascii", 1));
  }
  async GetTotalDispensedVolume(absolute) {
    this.waitTime = 300;
    let cmd = "TV,?";
    if (absolute) {
      cmd = "ATV,?";
    }
    return (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1);
  }
  async ClearTotalDispensedVolume() {
    this.waitTime = 300;
    await this.SendCommand("clear");
  }
  async isCalibrated() {
    const cmd = "Cal,?";
    this.waitTime = 300;
    return (await this.SendCommand(cmd))[cmd.length + 1].toString();
  }
  async Calibrate(volume) {
    this.waitTime = 300;
    await this.SendCommand("Cal," + volume);
  }
  async ClearCalibration() {
    this.waitTime = 300;
    await this.SendCommand("Cal,clear");
  }
  async SetParameters(parameter, isEnabled) {
    this.waitTime = 300;
    await this.SendCommand(`O,${parameter},${isEnabled ? 1 : 0}`);
  }
  async GetParametersEnabled() {
    const cmd = "O,?";
    this.waitTime = 300;
    return (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1);
  }
  SetPumpName(name) {
  }
  GetPumpName() {
    return 0;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Pump
});
//# sourceMappingURL=pump.js.map
