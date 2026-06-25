from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
import os
import mimetypes
import boto3

load_dotenv(".env.local")

BASE_DIR = Path(__file__).resolve().parents[1]
IMPORTS_DIR = BASE_DIR / "imports"

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET = os.getenv("R2_BUCKET", "sparesco-images")

MAX_WORKERS = 20
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}


def slugify(name):
    return (
        name.lower()
        .replace("&", "and")
        .replace(" ", "-")
        .replace("_", "-")
        .replace("/", "-")
    )


def get_s3_client():
    if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY]):
        raise RuntimeError("Missing R2 env values. Check .env file.")

    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


def upload_file(s3, file_path, collection_slug):
    key = f"{collection_slug}/{file_path.name}"
    content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"

    try:
        s3.upload_file(
            str(file_path),
            R2_BUCKET,
            key,
            ExtraArgs={"ContentType": content_type},
        )
        return {"status": "uploaded", "file": str(file_path), "key": key}
    except Exception as e:
        return {"status": "failed", "file": str(file_path), "key": key, "error": str(e)}


def process_collection(s3, collection_dir):
    images_dir = collection_dir / "images"
    reports_dir = collection_dir / "reports"
    reports_dir.mkdir(exist_ok=True)

    if not images_dir.exists():
        print(f"Skipping {collection_dir.name}: images folder not found")
        return

    image_files = [
        p for p in images_dir.rglob("*")
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    ]

    if not image_files:
        print(f"Skipping {collection_dir.name}: no images found")
        return

    collection_slug = slugify(collection_dir.name)
    print(f"\n[{collection_dir.name}] {len(image_files)} images found")

    uploaded = 0
    failed = 0
    report_rows = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [
            executor.submit(upload_file, s3, file_path, collection_slug)
            for file_path in image_files
        ]

        total = len(futures)

        for index, future in enumerate(as_completed(futures), start=1):
            result = future.result()
            report_rows.append(result)

            if result["status"] == "uploaded":
                uploaded += 1
            else:
                failed += 1

            if result["status"] == "failed":
                print("FAILED:", result["file"])
                print("ERROR:", result.get("error", ""))

            if index % 10 == 0 or index == total:
                percent = round((index / total) * 100, 2)
                print(f"{index}/{total} done ({percent}%) | uploaded: {uploaded} | failed: {failed}")

    report_file = reports_dir / "r2_upload_report.csv"

    with report_file.open("w", encoding="utf-8") as f:
        f.write("status,file,key,error\n")
        for row in report_rows:
            f.write(
                f"{row.get('status','')},"
                f"\"{row.get('file','')}\","
                f"\"{row.get('key','')}\","
                f"\"{row.get('error','')}\"\n"
            )

    print(f"Report saved: {report_file}")


def main():
    s3 = get_s3_client()

    if not IMPORTS_DIR.exists():
        raise RuntimeError("imports folder not found")

    collections = [p for p in IMPORTS_DIR.iterdir() if p.is_dir()]

    if not collections:
        raise RuntimeError("No collection folders found inside imports")

    for collection_dir in collections:
        process_collection(s3, collection_dir)

    print("\nR2 upload complete.")


if __name__ == "__main__":
    main()