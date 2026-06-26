// scripts/importer/add-collection.js
// REPLACE ENTIRE FILE

const readline = require("readline");

const logger = require("./logger");
const config = require("./config");
const validator = require("./validator");
const progress = require("./progress");

const excelReader = require("./excel-reader");
const imageUploader = require("./image-uploader");
const productBuilder = require("./product-builder");
const writer = require("./write-products");
const updateProductsIndex = require("./update-products-index");
const updateCollections = require("./update-collections");
const report = require("./report");

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function chooseCollection(collections) {
  console.log("");

  collections.forEach((collection, index) => {
    console.log(`${index + 1}. ${collection.name}`);
    console.log(`   ${collection.excelFiles.length} Excel file(s)`);

    collection.excelFiles.forEach((file) => {
      console.log(`   - ${file}`);
    });

    console.log("");
  });

  console.log("A. Import ALL");
  console.log("Q. Quit");
  console.log("");

  const answer = (await ask("Select : ")).toUpperCase();

  if (answer === "Q") process.exit(0);

  if (answer === "A") return "ALL";

  const selected = collections[Number(answer) - 1];

  if (!selected) {
    throw new Error("Invalid selection.");
  }

  return selected;
}

async function uploadImages(products) {
  const tasks = [];

  for (const product of products) {
    for (const variant of product.variants) {
      if (!variant.image) continue;
      if (variant.__skipImageUpload) continue;

      tasks.push({ product, variant });
    }
  }

  const total = tasks.length;
  let current = 0;
  let uploaded = 0;
  const failedImages = [];

  const CONCURRENCY = 30;

  console.log(`Uploading ${total} images...\n`);

  if (total === 0) {
    return {
      uploaded,
      failedImages,
    };
  }

  async function worker() {
    while (tasks.length) {
      const task = tasks.shift();
      const { product, variant } = task;

      try {
        const variantKey =
          variant.partNumber ||
          variant.option1Value ||
          variant.title;

        variant.image = await imageUploader.upload(
          variant.image,
          product.collection,
          product.handle,
          variantKey
        );

        uploaded++;
      } catch (err) {
        failedImages.push([
          variant.image,
          err.message,
        ]);
      }

      current++;

      const percent = Math.round((current / total) * 100);
      const width = 30;
      const filled = Math.round((percent / 100) * width);

      process.stdout.write(
        "\r[" +
          "█".repeat(filled) +
          "░".repeat(width - filled) +
          `] ${percent}% (${current}/${total})`
      );
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(CONCURRENCY, total) },
      () => worker()
    )
  );

  process.stdout.write("\n");

  for (const product of products) {
    product.images = [
      ...new Set(
        product.variants
          .map((v) => v.image)
          .filter(Boolean)
      ),
    ];
  }

  return {
    uploaded,
    failedImages,
  };
}

async function importCollection(collection) {
  logger.section(`Importing ${collection.name}`);
  const startedAt = Date.now();

  progress.step("Reading Excel");

  const rows = excelReader.readExcels(collection.excelPaths);

  excelReader.validateColumns(rows);

  const grouped = excelReader.groupProducts(rows);

  logger.success(`${grouped.rows} rows`);
  logger.success(`${grouped.products} products`);
  logger.success(`${grouped.variants} variants`);

  progress.step("Building Products");

  const products = productBuilder.build(
    grouped.groupedProducts,
    collection.name
  );

  progress.step("Merging Products");

  const writeResult = writer.mergeOnly(products);

  progress.step("Uploading Images");

  const uploadResult = await uploadImages(writeResult.products);

  logger.success(`${uploadResult.uploaded} images uploaded`);

  progress.step("Writing Products");

  const written = writer.writeMerged(writeResult.products);

  writeResult.stats.written = written;

  progress.step("Updating Products Index");

  const indexResult = updateProductsIndex.update(
    writeResult.products
  );

  progress.step("Updating Search Index");

  require("./update-search-index").update();

  progress.step("Updating Collections");

  const collectionsResult = updateCollections.update();

  progress.step("Updating Collection Products");

  require("./update-collection-products").update();

  progress.step("Creating Report");

  const reportFolder = report.create(
    collection.name,
    {
      productsFound: grouped.products,
      rowsFound: grouped.rows,
      variantsFound: grouped.variants,

      newProducts:
        writeResult.stats.newProducts,

      updatedProducts:
        writeResult.stats.updatedProducts,

      newVariants:
        writeResult.stats.newVariants,

      updatedVariants:
        writeResult.stats.updatedVariants,

      imagesUploaded: uploadResult.uploaded,

      failedImages: uploadResult.failedImages.length,

      timeTaken: `${Math.round((Date.now() - startedAt) / 1000)}s`,

      completedAt: new Date().toISOString(),
    },
    [],
    uploadResult.failedImages
  );

  logger.line();

  logger.success("IMPORT COMPLETED");

  logger.success(
    `Products : ${grouped.products}`
  );

  logger.success(
    `New Products : ${writeResult.stats.newProducts}`
  );

  logger.success(
    `Updated Products : ${writeResult.stats.updatedProducts}`
  );

  logger.success(
    `New Variants : ${writeResult.stats.newVariants}`
  );

  logger.success(
    `Updated Variants : ${writeResult.stats.updatedVariants}`
  );

  logger.success(
    `Images Uploaded : ${uploadResult.uploaded}`
  );

  logger.success(
    `Index Size : ${indexResult.products.length}`
  );

  logger.success(
    `Collections : ${collectionsResult.count}`
  );

  logger.success(`Report : ${reportFolder}`);

  logger.line();
}

async function main() {
  logger.initializeLog();

  logger.title("SPARESCO IMPORTER");

  config.initializeFolders();

  progress.start(9);

  progress.step("Environment");
  validator.validateEnvironment();

  progress.step("Project");
  validator.validateFolders();

  progress.step("Collections");
  const collections =
    validator.validateCollections();

  const env = config.getEnvironment();

  imageUploader.initialize(env);

  const selected =
    await chooseCollection(collections);

  if (selected === "ALL") {
    for (const collection of collections) {
      await importCollection(collection);
    }

    logger.success(
      "ALL COLLECTIONS IMPORTED"
    );

    return;
  }

  await importCollection(selected);
}

main().catch((err) => {
  logger.error(err.message);
  console.error(err);
  process.exit(1);
});