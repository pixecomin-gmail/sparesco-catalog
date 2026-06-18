from pathlib import Path
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import requests
import pandas as pd

COLLECTION_NAME = "Eppensteiner"

BASE_DIR = Path(__file__).resolve().parents[1]
COLLECTION_DIR = BASE_DIR / "imports" / COLLECTION_NAME
IMPORTS_DIR = COLLECTION_DIR / "excel"
IMAGES_DIR = COLLECTION_DIR / "images"
REPORTS_DIR = COLLECTION_DIR / "reports"

IMAGE_COLUMNS = ["Image Src", "Image URL", "Image", "Images", "image", "image_url"]

MAX_WORKERS = 30
TIMEOUT = 25
RETRY_ROUNDS = 2


def safe_filename(url, index):
    parsed = urlparse(str(url))
    ext = Path(parsed.path).suffix.lower()

    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        ext = ".jpg"

    url_hash = hashlib.md5(str(url).encode("utf-8")).hexdigest()[:12]
    return f"{index:06d}_{url_hash}{ext}"


def find_image_column(df):
    for col in IMAGE_COLUMNS:
        if col in df.columns:
            return col
    return None


def collect_urls():
    excel_files = sorted(IMPORTS_DIR.glob("*.xlsx"))
    urls = []

    print(f"Collection: {COLLECTION_NAME}")
    print(f"Excel files found: {len(excel_files)}")

    for excel_file in excel_files:
        print(f"Reading: {excel_file.name}")
        df = pd.read_excel(excel_file)

        image_col = find_image_column(df)

        if not image_col:
            print(f"No image column found in {excel_file.name}")
            continue

        for row_no, value in df[image_col].dropna().items():
            value = str(value).strip()

            if value.startswith("http"):
                urls.append({
                    "source_file": excel_file.name,
                    "row_number": row_no + 2,
                    "url": value,
                })

    unique = {}
    for item in urls:
        unique[item["url"]] = item

    final_urls = list(unique.values())
    print(f"Total unique image URLs: {len(final_urls)}")
    return final_urls


def download_one(index_item):
    index, item = index_item
    url = item["url"]
    filename = safe_filename(url, index)
    output_path = IMAGES_DIR / filename

    if output_path.exists() and output_path.stat().st_size > 0:
        return {**item, "filename": filename, "status": "skipped", "error": ""}

    try:
        r = requests.get(
            url,
            timeout=TIMEOUT,
            headers={"User-Agent": "Mozilla/5.0"},
        )

        if r.status_code != 200:
            return {**item, "filename": filename, "status": "failed", "error": f"HTTP {r.status_code}"}

        output_path.write_bytes(r.content)

        if output_path.stat().st_size == 0:
            output_path.unlink(missing_ok=True)
            return {**item, "filename": filename, "status": "failed", "error": "empty file"}

        return {**item, "filename": filename, "status": "downloaded", "error": ""}

    except Exception as e:
        return {**item, "filename": filename, "status": "failed", "error": str(e)}


def run_batch(items):
    results = []
    total = len(items)

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(download_one, item) for item in items]

        for count, future in enumerate(as_completed(futures), start=1):
            result = future.result()
            results.append(result)

            if count % 100 == 0 or count == total:
                downloaded = sum(1 for r in results if r["status"] == "downloaded")
                skipped = sum(1 for r in results if r["status"] == "skipped")
                failed = sum(1 for r in results if r["status"] == "failed")
                print(f"{count}/{total} | downloaded: {downloaded} | skipped: {skipped} | failed: {failed}")

    return results


def save_report(results, filename):
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    path = REPORTS_DIR / filename
    pd.DataFrame(results).to_csv(path, index=False, encoding="utf-8-sig")
    print(f"Report saved: {path}")


def main():
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    urls = collect_urls()

    if not urls:
        print("STOPPED: 0 image URLs found.")
        print("No Excel file was edited.")
        return

    indexed_urls = list(enumerate(urls, start=1))

    print("\nStarting fast download...")
    results = run_batch(indexed_urls)

    for retry_round in range(1, RETRY_ROUNDS + 1):
        failed = [r for r in results if r["status"] == "failed"]

        if not failed:
            break

        print(f"\nRetry round {retry_round}: {len(failed)} failed images")

        retry_items = []
        for failed_item in failed:
            original_index = next(
                i for i, item in indexed_urls if item["url"] == failed_item["url"]
            )
            retry_items.append((original_index, failed_item))

        results = [r for r in results if r["status"] != "failed"]
        results.extend(run_batch(retry_items))

    downloaded = sum(1 for r in results if r["status"] == "downloaded")
    skipped = sum(1 for r in results if r["status"] == "skipped")
    failed = sum(1 for r in results if r["status"] == "failed")

    print("\nDONE")
    print(f"Downloaded: {downloaded}")
    print(f"Skipped: {skipped}")
    print(f"Failed: {failed}")
    print("No Excel file was edited.")

    save_report(results, "image_download_report.csv")

    failed_results = [r for r in results if r["status"] == "failed"]
    if failed_results:
        save_report(failed_results, "failed_images.csv")


if __name__ == "__main__":
    main()