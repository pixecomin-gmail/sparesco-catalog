// scripts/importer/progress.js

let currentStep = 0;
let totalSteps = 0;

function start(total) {
  totalSteps = total;
  currentStep = 0;
}

function step(title) {
  currentStep++;

  console.log("");
  console.log(`[${currentStep}/${totalSteps}] ${title}`);
}

function bar(current, total) {
  const width = 30;
  const percent = total === 0 ? 0 : current / total;
  const filled = Math.round(percent * width);
  const empty = width - filled;

  process.stdout.write(
    "\r[" +
      "█".repeat(filled) +
      "░".repeat(empty) +
      `] ${current}/${total}`
  );

  if (current >= total) {
    process.stdout.write("\n");
  }
}

module.exports = {
  start,
  step,
  bar,
};