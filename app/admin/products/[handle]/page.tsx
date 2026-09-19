import EditProductClient from "./EditProductClient";

export const runtime = "edge";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  return (
    <EditProductClient
      handle={handle}
    />
  );
}