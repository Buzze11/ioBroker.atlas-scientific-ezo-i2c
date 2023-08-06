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
var ph_meter_exports = {};
__export(ph_meter_exports, {
  default: () => pH,
  pH: () => pH
});
module.exports = __toCommonJS(ph_meter_exports);
var import_ezo_device = require("./ezo_device");
class pH extends import_ezo_device.EZODevice {
  constructor(i2c_bus, address, info, adapter) {
    super(i2c_bus, address, info, adapter);
    this.adapter = adapter;
  }
  async Read() {
    this.waitTime = 900;
    const resp = await this.SendCommand("R");
    return Number.parseFloat(resp.toString("ascii", 1).replace(/\0/g, ""));
  }
  async ClearCalibration() {
    this.waitTime = 300;
    await this.SendCommand("Cal,clear");
  }
  async IsCalibrated() {
    this.waitTime = 300;
    const cmd = "Cal,?";
    return (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1).replace(/\0/g, "");
  }
  async CalibrateMid(ph) {
    if (!ph)
      ph = 7;
    this.waitTime = 900;
    await this.SendCommand("Cal,mid," + ph.toString());
    this.waitTime = 300;
  }
  async CalibrateLow(ph) {
    if (!ph)
      ph = 4;
    this.waitTime = 900;
    await this.SendCommand("Cal,low," + ph.toString());
  }
  async CalibrateHigh(ph) {
    if (!ph)
      ph = 10;
    this.waitTime = 900;
    await this.SendCommand("Cal,high," + ph.toString());
  }
  async GetReading() {
    this.waitTime = 900;
    const r = (await this.SendCommand("R")).toString("ascii", 1).replace(/\0/g, "");
    return r;
  }
  async GetTemperatureCompensation() {
    this.waitTime = 300;
    const cmd = "T,?";
    return (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1).replace(/\0/g, "");
  }
  async SetTemperatureCompensation(value, takeReading = false) {
    if (takeReading) {
      this.waitTime = 900;
      const r = (await this.SendCommand("RT," + value)).toString("ascii", 1).replace(/\0/g, "");
      return r;
    } else {
      this.waitTime = 900;
      await this.SendCommand("T," + value);
    }
  }
  async GetSlope() {
    const cmd = "Slope,?";
    this.waitTime = 300;
    return (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1).replace(/\0/g, "").split(",");
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  pH
});
//# sourceMappingURL=ph_meter.js.map
