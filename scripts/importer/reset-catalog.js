const readline = require("readline");

const {
  removePrefix,
} = require("./r2-client");

function confirm() {
  const rl =
    readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

  return new Promise(
    (resolve) => {
      rl.question(
        'Type "DELETE CATALOG" to delete all R2 catalog data: ',
        (answer) => {
          rl.close();

          resolve(
            answer.trim() ===
              "DELETE CATALOG"
          );
        }
      );
    }
  );
}

async function main() {
  const yes =
    process.argv.includes("--yes");

  if (
    !yes &&
    !(await confirm())
  ) {
    console.log("Cancelled.");
    return;
  }

  const count =
    await removePrefix(
      "catalog/"
    );

  console.log(
    `Deleted ${count} R2 objects under catalog/.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
