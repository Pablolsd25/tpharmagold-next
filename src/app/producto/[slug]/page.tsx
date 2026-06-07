import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PRODUCT_WITH_CATEGORY } from "@/lib/supabase/product-selects";
import ProductDetail from "@/components/products/ProductDetail";
import ReviewForm from "@/components/reviews/ReviewForm";
import ReviewCard from "@/components/reviews/ReviewCard";
import Stars from "@/components/reviews/Stars";
import type { Product, ProductOption } from "@/types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("name, description")
    .eq("slug", slug)
    .single();
  return {
    title: data?.name ?? "Producto",
    description: data?.description ?? undefined,
  };
}

export default async function ProductoPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(PRODUCT_WITH_CATEGORY)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!product) notFound();

  const { data: options } = await supabase
    .from("product_options")
    .select("*, values:product_option_values(*)")
    .eq("product_id", product.id)
    .order("sort_order");

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, reviewer_name, rating, title, comment, created_at")
    .eq("product_id", product.id)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ProductDetail
        product={product as Product}
        options={(options ?? []) as ProductOption[]}
      />

      <section className="mt-16 border-t border-zinc-800 pt-10 space-y-8">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-white font-display font-bold text-2xl uppercase tracking-wide">
            Reseñas
          </h2>
          {avgRating !== null && (
            <div className="flex items-center gap-2">
              <Stars rating={Math.round(avgRating)} />
              <span className="text-zinc-400 text-sm">
                {avgRating.toFixed(1)} · {reviews!.length}{" "}
                {reviews!.length === 1 ? "reseña" : "reseñas"}
              </span>
            </div>
          )}
        </div>

        {reviews && reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}

        <ReviewForm productId={product.id} productName={product.name} />
      </section>
    </div>
  );
}
