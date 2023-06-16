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
var rtd_meter_exports = {};
__export(rtd_meter_exports, {
  RTD: () => RTD,
  default: () => RTD
});
module.exports = __toCommonJS(rtd_meter_exports);
var import_ezo_device = require("./ezo_device");
class RTD extends import_ezo_device.EZODevice {
  constructor(i2c_bus, address, info, adapter) {
    super(i2c_bus, address, info, adapter);
    this.adapter = adapter;
  }
  async ClearCalibration() {
    this.waitTime = 300;
    await this.SendCommand("Cal,clear");
  }
  async CalibrateTemperature(value) {
    this.waitTime = 600;
    await this.SendCommand("Cal," + value);
  }
  async IsCalibrated() {
    const cmd = "Cal,?";
    this.waitTime = 300;
    return (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1).replace(/\0/g, "");
  }
  async SetTemperatureScale(value) {
    if (value === "c" || value === "k" || value === "f") {
      let cmd = "S,";
      this.waitTime = 300;
      await this.SendCommand(cmd + value);
    }
  }
  async GetTemperatureScale() {
    const cmd = "S,?";
    this.waitTime = 300;
    let res = (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1).replace(/\0/g, "");
    return res;
  }
  async GetReading() {
    const cmd = "R";
    this.waitTime = 600;
    let res = (await this.SendCommand(cmd)).toString("ascii", 1).replace(/\0/g, "");
    return res;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RTD
});
//# sourceMappingURL=rtd-meter.js.map
