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
var atlas_scientific_i2c_exports = {};
__export(atlas_scientific_i2c_exports, {
  DO: () => import_do_meter.DO,
  EC: () => import_ec_meter.EC,
  EZODevice: () => import_ezo_device.EZODevice,
  FindAllDevices: () => FindAllDevices,
  ORP: () => import_orp_meter.ORP,
  Pump: () => import_pump.Pump,
  RTD: () => import_rtd_meter.RTD,
  pH: () => import_ph_meter.pH
});
module.exports = __toCommonJS(atlas_scientific_i2c_exports);
var import_ezo_device = require("./ezo_device");
var import_pump = require("./pump");
var import_ph_meter = require("./ph_meter");
var import_orp_meter = require("./orp_meter");
var import_ec_meter = require("./ec_meter");
var import_do_meter = require("./do_meter");
var import_rtd_meter = require("./rtd-meter");
function later(delay) {
  return new Promise(function(resolve) {
    setTimeout(resolve, delay);
  });
}
async function FindAllDevices(i2c_bus) {
  const info = Buffer.from("I");
  const results = await i2c_bus.scan();
  const writesP = Promise.allSettled(results.map((addr) => {
    return i2c_bus.i2cWrite(addr, info.length, info);
  }));
  await writesP;
  await later(300);
  const readsP = await Promise.allSettled(results.map((addr) => {
    const rbuf = Buffer.alloc(16);
    return i2c_bus.i2cRead(addr, rbuf.length, rbuf);
  }));
  const devices = [];
  readsP.forEach((promResult, index) => {
    if (promResult.status == "fulfilled") {
      const info2 = promResult.value.buffer.toString();
      if (info2.indexOf("?I,") > -1) {
        const devType = info2.split(",")[1];
        if (devType == "PMP") {
          devices.push(new import_pump.Pump(i2c_bus, results[index], info2));
        } else if (devType == "pH") {
          devices.push(new import_ph_meter.pH(i2c_bus, results[index], info2));
        } else if (devType == "DO") {
          devices.push(new import_do_meter.DO(i2c_bus, results[index], info2));
        } else if (devType == "EC") {
          devices.push(new import_ec_meter.EC(i2c_bus, results[index], info2));
        } else if (devType == "ORP") {
          devices.push(new import_orp_meter.ORP(i2c_bus, results[index], info2));
        } else if (devType == "RTD") {
          devices.push(new import_rtd_meter.RTD(i2c_bus, results[index], info2));
        } else {
          devices.push(new import_ezo_device.EZODevice(i2c_bus, results[index], info2));
        }
      }
    }
  });
  return devices;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DO,
  EC,
  EZODevice,
  FindAllDevices,
  ORP,
  Pump,
  RTD,
  pH
});
//# sourceMappingURL=index.js.map
