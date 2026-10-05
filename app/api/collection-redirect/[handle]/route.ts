export const runtime =
  "edge";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      handle: string;
    }>;
  }
) {
  try {
    const {
      handle: rawHandle,
    } = await context.params;

    const handle =
      decodeURIComponent(
        rawHandle
      )
        .trim()
        .toLowerCase();

    if (!handle) {
      return Response.json(
        {
          redirect: null,
        }
      );
    }

    const r2Base =
      process.env
        .NEXT_PUBLIC_R2_PUBLIC_URL;

    if (!r2Base) {
      return Response.json(
        {
          redirect: null,
        }
      );
    }

    const url =
      `${r2Base.replace(
        /\/$/,
        ""
      )}/catalog/indexes/collection-redirects.json`;

    const response =
      await fetch(
        url,
        {
          cache: "no-store",
        }
      );

    if (!response.ok) {
      return Response.json({
        redirect: null,
      });
    }

    const redirects =
      await response.json() as Record<
        string,
        string
      >;

    const destination =
      String(
        redirects?.[handle] ||
          ""
      ).trim();

    return Response.json({
      redirect:
        destination ||
        null,
    });
  } catch {
    return Response.json({
      redirect: null,
    });
  }
}