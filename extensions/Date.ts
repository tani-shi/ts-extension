export {};

declare global {
  interface Date {
    addDays(days: number): Date;
    addHours(hours: number): Date;
    addMinutes(minutes: number): Date;
    addSeconds(seconds: number): Date;
  }
}

Date.prototype.addDays = function (this: Date, days: number): Date {
  const result = new Date(this);
  result.setDate(this.getDate() + days);
  return result;
};

Date.prototype.addHours = function (this: Date, hours: number): Date {
  const result = new Date(this);
  result.setHours(this.getHours() + hours);
  return result;
};

Date.prototype.addMinutes = function (this: Date, minutes: number): Date {
  const result = new Date(this);
  result.setMinutes(this.getMinutes() + minutes);
  return result;
};

Date.prototype.addSeconds = function (this: Date, seconds: number): Date {
  const result = new Date(this);
  result.setSeconds(this.getSeconds() + seconds);
  return result;
};
