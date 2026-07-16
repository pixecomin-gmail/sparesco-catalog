const readline = require("readline");

function heading(text) {
  console.log("");
  console.log("==================================================");
  console.log(text);
  console.log("==================================================");
}

function renderBar(current, total, width = 24) {
  const ratio = total ? current / total : 1;
  const filled = Math.min(width, Math.round(ratio * width));

  return (
    "[" +
    "█".repeat(filled) +
    "░".repeat(width - filled) +
    `] ${current}/${total}`
  );
}

class Dashboard {
  constructor() {
    this.started = false;
    this.lines = 8;
    this.state = {
      stage: "Starting",
      collectionCurrent: 0,
      collectionTotal: 0,
      excelCurrent: 0,
      excelTotal: 0,
      productCurrent: 0,
      productTotal: 0,
      cacheCurrent: 0,
      cacheTotal: 0,
      currentCollection: "-",
      currentExcel: "-",
      currentHandle: "-",
      completed: 0,
      failed: 0,
    };
  }

  update(next) {
    Object.assign(this.state, next);
    this.draw();
  }

  draw() {
    const s = this.state;

    if (this.started) {
      readline.moveCursor(process.stdout, 0, -this.lines);
    } else {
      this.started = true;
    }

    const rows = [
      `Stage              ${s.stage}`,
      `Image cache        ${renderBar(s.cacheCurrent, s.cacheTotal)}`,
      `Collection         ${renderBar(s.collectionCurrent, s.collectionTotal)}`,
      `Excel              ${renderBar(s.excelCurrent, s.excelTotal)}`,
      `Products           ${renderBar(s.productCurrent, s.productTotal)}`,
      `Current collection ${s.currentCollection}`,
      `Current Excel      ${s.currentExcel}`,
      `Current handle     ${s.currentHandle} | completed ${s.completed}, failed ${s.failed}`,
    ];

    for (const row of rows) {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(row + "\n");
    }
  }

  finish() {
    if (!this.started) return;
    this.draw();
  }
}

function bar(label, current, total, suffix = "") {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);

  process.stdout.write(
    `${label.padEnd(21)} ${renderBar(current, total, 28)}` +
      (suffix ? ` ${suffix}` : "")
  );

  if (current >= total) process.stdout.write("\n");
}

module.exports = {
  heading,
  bar,
  Dashboard,
};
