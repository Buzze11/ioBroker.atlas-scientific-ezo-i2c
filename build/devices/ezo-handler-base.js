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
var ezo_handler_base_exports = {};
__export(ezo_handler_base_exports, {
  EzoHandlerBase: () => EzoHandlerBase
});
module.exports = __toCommonJS(ezo_handler_base_exports);
var import_async = require("../lib/async");
var import_shared = require("../lib/shared");
class EzoHandlerBase {
  constructor(deviceConfig, adapter) {
    this.deviceConfig = deviceConfig;
    this.adapter = adapter;
    if (!deviceConfig.type || !deviceConfig.name) {
      throw new Error("Type and name of device must be specified");
    }
    this.type = deviceConfig.type;
    this.name = deviceConfig.name;
    this.config = deviceConfig[deviceConfig.type];
    this.hexAddress = (0, import_shared.toHexString)(deviceConfig.address);
  }
  startPolling(callback, interval, minInterval) {
    this.stopPolling();
    this.polling = new import_async.Polling(callback, this.adapter);
    this.polling.runAsync(interval, minInterval).catch((error) => this.error("Polling error: " + error));
  }
  stopPolling() {
    var _a;
    (_a = this.polling) == null ? void 0 : _a.stop();
  }
  async setStateAckAsync(state, value) {
    await this.adapter.setStateAckAsync(this.hexAddress + "." + state, value);
  }
  setStateAck(state, value) {
    this.adapter.setStateAck(this.hexAddress + "." + state, value);
  }
  getStateValue(state) {
    return this.adapter.getStateValue(this.hexAddress + "." + state);
  }
  silly(message) {
    this.adapter.log.silly(`${this.type} ${this.hexAddress}: ${message}`);
  }
  debug(message) {
    this.adapter.log.debug(`${this.type} ${this.hexAddress}: ${message}`);
  }
  info(message) {
    this.adapter.log.info(`${this.type} ${this.hexAddress}: ${message}`);
  }
  warn(message) {
    this.adapter.log.warn(`${this.type} ${this.hexAddress}: ${message}`);
  }
  error(message) {
    this.adapter.log.error(`${this.type} ${this.hexAddress}: ${message}`);
  }
  async FindEzoBoard() {
    try {
      if (this.sensor) {
        await this.sensor.Find();
        return "Find Sensor was initiated successfully. Please check for blinking LED";
      }
    } catch {
      return "FindEzoBoard(): Error initiating Find().";
    }
  }
  async FactoryReset() {
    try {
      if (this.sensor) {
        await this.sensor.Factory();
        return "Factory Reset was initiated successfully.";
      }
    } catch {
      return "FactoryReset(): Error initiating Factory Reset.";
    }
  }
  async ChangeI2CAddress(newAddress) {
    try {
      if (this.sensor) {
        await this.sensor.ChangeI2CAddress(parseInt(newAddress));
        return "New I2C adress: " + newAddress + " was set successfully.";
      }
    } catch {
      return "ChangeI2CAddress(): Error setting new I2C address.";
    }
  }
  async SetLed(ledOn) {
    try {
      this.info("Led Usage: " + ledOn.toString());
      await this.sensor.SetLED(ledOn);
    } catch {
      return "Error occured on setting led usage";
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EzoHandlerBase
});
//# sourceMappingURL=ezo-handler-base.js.map
