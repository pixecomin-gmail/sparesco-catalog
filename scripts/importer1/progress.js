const readline = require("readline");

function heading(text) {
  console.log("");
  console.log("==================================================");
  console.log(text);
  console.log("==================================================");
}

function bar(label, current, total, suffix = "") {
  const width = 28;
  const ratio = total ? current / total : 1;
  const filled = Math.min(width, Math.round(ratio * width));

  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);

  process.stdout.write(
    `${label.padEnd(21)} [` +
      "█".repeat(filled) +
      "░".repeat(width - filled) +
      `] ${current}/${total}` +
      (suffix ? ` ${suffix}` : "")
  );

  if (current >= total) process.stdout.write("\n");
}

module.exports = { heading, bar };
