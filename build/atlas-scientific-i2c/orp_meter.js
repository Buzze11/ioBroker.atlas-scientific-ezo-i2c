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
var orp_meter_exports = {};
__export(orp_meter_exports, {
  ORP: () => ORP,
  default: () => ORP
});
module.exports = __toCommonJS(orp_meter_exports);
var import_ezo_device = require("./ezo_device");
class ORP extends import_ezo_device.EZODevice {
  constructor(i2c_bus, address, info, adapter) {
    super(i2c_bus, address, info, adapter);
    this.adapter = adapter;
  }
  async ClearCalibration() {
    this.waitTime = 300;
    await this.SendCommand("Cal,clear");
  }
  async Calibrate(value) {
    this.waitTime = 900;
    await this.SendCommand("Cal," + value);
  }
  async IsCalibrated() {
    this.waitTime = 300;
    const cmd = "Cal,?";
    return (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1).replace(/\0/g, "");
  }
  async GetReading() {
    this.waitTime = 900;
    const r = (await this.SendCommand("R")).toString("ascii", 1).replace(/\0/g, "");
    return r;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ORP
});
//# sourceMappingURL=orp_meter.js.map
