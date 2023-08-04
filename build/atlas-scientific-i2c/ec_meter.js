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
var ec_meter_exports = {};
__export(ec_meter_exports, {
  EC: () => EC,
  default: () => EC
});
module.exports = __toCommonJS(ec_meter_exports);
var import_ezo_device = require("./ezo_device");
class EC extends import_ezo_device.EZODevice {
  constructor(i2c_bus, address, info, adapter) {
    super(i2c_bus, address, info, adapter);
    this.adapter = adapter;
    this.readBufferSize = 40;
  }
  async SetProbeType(value) {
    if (!value)
      return;
    await this.SendCommand("K," + value);
    this.waitTime = 300;
  }
  async GetProbeType() {
    const cmd = "K,?";
    this.waitTime = 300;
    const k = (await this.SendCommand(cmd)).toString("ascii", cmd.length);
    this.waitTime = 600;
    return k;
  }
  async SetTemperatureCompensation(value, takeReading = false) {
    if (takeReading) {
      this.waitTime = 900;
      const r = (await this.SendCommand("RT," + value)).toString("ascii", 1);
      this.waitTime = 300;
      return r;
    } else {
      await this.SendCommand("T," + value);
      this.waitTime = 300;
      return null;
    }
  }
  async GetTemperatureCompensation() {
    const cmd = "T,?";
    const res = (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1);
    this.waitTime = 300;
    return res;
  }
  async SetParameter(parameter, isEnabled) {
    await this.SendCommand("O," + parameter + "," + (isEnabled ? "1" : "0"));
    this.waitTime = 300;
  }
  async GetParametersEnabled() {
    const cmd = "O,?";
    const res = (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1);
    this.waitTime = 300;
    return res;
  }
  async SetTDSConversionFactor(value) {
    value = Math.min(1, Math.max(value, 0.01));
    await this.SendCommand("TDS," + value);
    this.waitTime = 300;
  }
  async GetTDSConversionFactor() {
    const cmd = "TDS,?";
    const res = (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1);
    this.waitTime = 300;
    return res;
  }
  async GetReading() {
    this.waitTime = 600;
    const r = (await this.SendCommand("R")).toString("ascii", 1);
    this.waitTime = 300;
    return r;
  }
  async ClearCalibration() {
    await this.SendCommand("Cal,clear");
    this.waitTime = 300;
  }
  async IsCalibrated() {
    const cmd = "Cal,?";
    const res = (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1).replace(/\0/g, "");
    this.waitTime = 300;
    return res;
  }
  async CalibrateDry() {
    await this.SendCommand("Cal,dry,");
    this.waitTime = 600;
  }
  async CalibrateSinglepoint(val) {
    if (!val)
      return;
    this.waitTime = 900;
    await this.SendCommand("Cal," + val.toString());
    this.waitTime = 600;
  }
  async CalibrateLow(val) {
    if (!val)
      return;
    this.waitTime = 900;
    await this.SendCommand("Cal,low," + val.toString());
    this.waitTime = 600;
  }
  async CalibrateHigh(val) {
    if (!val)
      return;
    this.waitTime = 900;
    await this.SendCommand("Cal,high," + val.toString());
    this.waitTime = 600;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EC
});
//# sourceMappingURL=ec_meter.js.map
