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
var async_exports = {};
__export(async_exports, {
  Delay: () => Delay,
  Polling: () => Polling
});
module.exports = __toCommonJS(async_exports);
class Delay {
  constructor(ms, adapter) {
    this.ms = ms;
    this.adapter = adapter;
    this.started = false;
    this.cancelled = false;
  }
  runAsnyc() {
    if (this.started) {
      throw new Error(`Can't run delay twice!`);
    }
    this.started = true;
    return new Promise((resolve, reject) => {
      if (this.cancelled) {
        return;
      }
      this.reject = reject;
      this.timeout = this.adapter.setTimeout(resolve, this.ms);
    });
  }
  cancel() {
    if (!this.started || this.cancelled) {
      return;
    }
    this.cancelled = true;
    if (this.timeout) {
      this.adapter.clearTimeout(this.timeout);
    }
    if (this.reject) {
      this.reject(new Error("Cancelled"));
    }
  }
}
class Polling {
  constructor(callback, adapter) {
    this.callback = callback;
    this.adapter = adapter;
    this.enabled = false;
  }
  async runAsync(interval, minInterval) {
    if (this.enabled) {
      return;
    }
    this.enabled = true;
    interval = Math.max(interval, minInterval || 1);
    while (this.enabled) {
      await this.callback();
      try {
        this.delay = new Delay(interval, this.adapter);
        await this.delay.runAsnyc();
      } catch (error) {
        break;
      }
    }
  }
  stop() {
    var _a;
    this.enabled = false;
    (_a = this.delay) == null ? void 0 : _a.cancel();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Delay,
  Polling
});
//# sourceMappingURL=async.js.map
