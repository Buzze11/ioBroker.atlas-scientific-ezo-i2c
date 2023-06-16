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
var ezo_device_exports = {};
__export(ezo_device_exports, {
  EZODevice: () => EZODevice,
  default: () => EZODevice
});
module.exports = __toCommonJS(ezo_device_exports);
const waitTime = 300;
class EZODevice {
  constructor(i2c_bus, address, info, adapter) {
    this.adapter = adapter;
    this.i2c_bus = i2c_bus;
    this.address = address;
    this.info = info;
    this.readBufferSize = 16;
    this.waitTime = 300;
  }
  Delay() {
    return new Promise((resolve, reject) => {
      this.adapter.setTimeout(resolve, this.waitTime);
    });
  }
  async SendCommand(command) {
    const wbuf = Buffer.from(command);
    const rbuf = Buffer.alloc(this.readBufferSize);
    return new Promise((resolve, reject) => {
      this.i2c_bus.i2cWrite(this.address, wbuf.length, wbuf).then(async (_) => {
        await this.Delay();
        let r;
        try {
          r = await this.i2c_bus.i2cRead(this.address, rbuf.length, rbuf);
          if (r.buffer.indexOf(0) < 0) {
            let nr = Buffer.concat([r.buffer]);
            while (r.buffer.indexOf(0) < 0) {
              r = await this.i2c_bus.i2cRead(this.address, rbuf.length, rbuf);
              nr = Buffer.concat([nr, r.buffer]);
            }
            resolve(nr);
          } else {
            resolve(rbuf);
          }
        } catch (e) {
          reject(e);
        }
      }).catch(reject);
    });
  }
  async Factory() {
    await this.SendCommand("Factory").catch((error) => {
    });
  }
  async GetInfo() {
    this.waitTime = 300;
    const res = (await this.SendCommand("I")).toString().replace(/\0/g, "");
    return res;
  }
  async SetProtocolLock(lock) {
    this.waitTime = 300;
    await this.SendCommand("Plock," + (lock ? 1 : 0));
  }
  async GetProtocolLocked() {
    this.waitTime = 300;
    const cmd = "Plock,?";
    return (await this.SendCommand(cmd))[cmd.length + 1].toString().replace(/\0/g, "") == "1";
  }
  async Find() {
    this.waitTime = 300;
    await this.SendCommand("Find");
  }
  async GetLED() {
    const cmd = "L,?";
    this.waitTime = 300;
    const resp = (await this.SendCommand(cmd)).toString().replace(/\0/g, "");
    return resp[cmd.length + 1] == "1";
  }
  async SetLED(isOn) {
    this.waitTime = 300;
    await this.SendCommand("L," + (isOn ? 1 : 0));
  }
  async SetName(name) {
    this.waitTime = 300;
    let n = name.replace(" ", "");
    if (n.length > 16)
      n = n.substr(0, 16);
    await this.SendCommand("Name," + n);
  }
  async GetName() {
    const cmd = "Name,?";
    this.waitTime = 300;
    const resp = await this.SendCommand(cmd);
    return (await this.SendCommand(cmd)).toString("ascii", cmd.length + 1).replace(/\0/g, "");
  }
  async Sleep() {
    this.waitTime = 300;
    const wbuf = Buffer.from("Sleep");
    await this.i2c_bus.i2cWrite(this.address, wbuf.length, wbuf);
  }
  async ChangeI2CAddress(newAddress) {
    this.waitTime = 300;
    const wbuf = Buffer.from(`I2C,${newAddress}`);
    this.i2c_bus.i2cWrite(this.address, wbuf.length, wbuf);
    this.address = newAddress;
  }
  async GetDeviceStatus() {
    this.waitTime = 300;
    const res = (await this.SendCommand("Status")).toString("ascii", 1).replace(/\0/g, "");
    return res;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EZODevice
});
//# sourceMappingURL=ezo_device.js.map
