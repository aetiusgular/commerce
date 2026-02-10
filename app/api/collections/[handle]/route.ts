import { getCollectionProducts } from "lib/shopify";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  props: { params: Promise<{ handle: string }> }
) {
  try {
    // Await params before accessing handle
    const params = await props.params;
    const products = await getCollectionProducts({ collection: params.handle });
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching collection products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}