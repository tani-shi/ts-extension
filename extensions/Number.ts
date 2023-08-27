export {};

declare global {
  interface Number {
    formatBytes(): string;
  }
}

Number.prototype.formatBytes = function () {
  const num = Number(this);
  if (num < 1024) {
    return `${num}B`;
  }
  if (num < 1024 ** 2) {
    return `${(num / 1024.0).toFixed(2)}KB`;
  }
  if (num < 1024 ** 3) {
    return `${(num / 1024.0 ** 2).toFixed(2)}MB`;
  }
  if (num < 1024 ** 4) {
    return `${(num / 1024.0 ** 3).toFixed(2)}GB`;
  }
  return `${(num / 1024.0 ** 4).toFixed(2)}TB`;
};
