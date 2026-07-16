function line() {
  console.log("==================================================");
}

function title(text) {
  line();
  console.log(text);
  line();
}

function section(text) {
  console.log("");
  console.log("▶ " + text);
}

function success(text) {
  console.log("✔ " + text);
}

function info(text) {
  console.log("ℹ " + text);
}

function error(text) {
  console.log("✖ " + text);
}

function bar(current, total, label = "") {
  const width = 30;
  const percent = total ? current / total : 0;
  const filled = Math.round(percent * width);

  process.stdout.write(
    "\r" +
      label +
      " [" +
      "█".repeat(filled) +
      "░".repeat(width - filled) +
      `] ${current}/${total}`
  );

  if (current >= total) process.stdout.write("\n");
}

module.exports = {
  title,
  section,
  success,
  info,
  error,
  bar,
};