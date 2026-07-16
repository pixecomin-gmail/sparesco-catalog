export function getThumbnailFilename(
  filename?: string
) {
  if (!filename) return "";

  const clean = filename
    .split("?")[0]
    .replace(/\\/g, "/");

  const slash =
    clean.lastIndexOf("/");

  const name =
    slash >= 0
      ? clean.slice(slash + 1)
      : clean;

  const dot =
    name.lastIndexOf(".");

  const stem =
    dot > 0
      ? name.slice(0, dot)
      : name;

  return `${stem}.webp`;
}

export function getCatalogThumbnailUrl({
  image,
  imageFolder,
  collection,
}: {
  image?: string;
  imageFolder?: string;
  collection?: string;
}) {
  if (!image) return "";

  if (image.startsWith("http")) {
    return image;
  }

  const base =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

  const folder =
    imageFolder ||
    collection ||
    "products";

  const filename =
    getThumbnailFilename(image);

  return (
    `${base.replace(/\/$/, "")}` +
    `/catalog/thumbs/${folder}/${filename}`
  );
}
