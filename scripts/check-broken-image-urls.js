const fs = require("fs");
const path = require("path");
const https = require("https");

const PRODUCTS_DIR = path.join(process.cwd(), "data", "products");
const REPORT_DIR = path.join(process.cwd(), "data", "reports");
const REPORT_FILE = path.join(REPORT_DIR, "broken-image-urls.json");

if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

function checkUrl(url) {
  return new Promise((resolve) => {
    if (!url || !url.startsWith("http")) {
      resolve({ ok: false, status: "INVALID_URL" });
      return;
    }

    const req = https.request(url, { method: "HEAD", timeout: 10000 }, (res) => {
      resolve({
        ok: res.statusCode >= 200 && res.statusCode < 400,
        status: res.statusCode,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, status: "TIMEOUT" });
    });

    req.on("error", () => {
      resolve({ ok: false, status: "REQUEST_ERROR" });
    });

    req.end();
  });
}

async function main() {
  const files = fs.readdirSync(PRODUCTS_DIR).filter((file) => file.endsWith(".json"));

  const broken = [];
  let checked = 0;

  for (const file of files) {
    const filePath = path.join(PRODUCTS_DIR, file);
    const product = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const urls = [];

    if (product.image) {
      urls.push({
        type: "product",
        url: product.image,
        variantTitle: "",
        sku: "",
      });
    }

    if (Array.isArray(product.variants)) {
      product.variants.forEach((variant) => {
        if (variant.image) {
          urls.push({
            type: "variant",
            url: variant.image,
            variantTitle: variant.title || "",
            sku: variant.sku || "",
          });
        }
      });
    }

    for (const item of urls) {
      checked++;

      const result = await checkUrl(item.url);

      if (!result.ok) {
        broken.push({
          collection: product.collection || "",
          collectionHandle: product.collectionHandle || "",
          productTitle: product.title || "",
          productHandle: product.handle || file.replace(".json", ""),
          partNumber: product.partNumber || "",
          vendor: product.vendor || "",
          imageType: item.type,
          variantTitle: item.variantTitle,
          sku: item.sku,
          status: result.status,
          imageUrl: item.url,
        });
      }

      if (checked % 100 === 0) {
        console.log(`Checked ${checked} image URLs... Broken: ${broken.length}`);
      }
    }
  }

  fs.writeFileSync(REPORT_FILE, JSON.stringify(broken, null, 2));

  console.log("");
  console.log("Done.");
  console.log(`Checked URLs: ${checked}`);
  console.log(`Broken URLs: ${broken.length}`);
  console.log(`Report saved: ${REPORT_FILE}`);
}

main();