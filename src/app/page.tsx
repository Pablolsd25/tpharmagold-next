import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getHomePageVideos } from "@/lib/home-video";
import {
  buildHomeCategoryCards,
  getHomeFeaturedCategories,
} from "@/lib/home-categories";
import { getProductIdsInCategory } from "@/lib/product-categories";
import { PRODUCT_WITH_CATEGORY } from "@/lib/supabase/product-selects";
import ProductGrid from "@/components/products/ProductGrid";
import VideoHero from "@/components/home/VideoHero";
import VideoShowcase from "@/components/home/VideoShowcase";
import AboutSection from "@/components/home/AboutSection";
import HomeReviewsSection from "@/components/home/HomeReviewsSection";
import type { ReviewItem } from "@/components/reviews/ReviewCard";
import type { Product } from "@/types";

export default async function HomePage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const homeVideos = await getHomePageVideos(adminSupabase);

  const [featuredCategories, { count: totalProducts }, { data: reviewsRaw }] =
    await Promise.all([
      getHomeFeaturedCategories(supabase),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("reviews")
        .select("id, reviewer_name, rating, title, comment, created_at, product:products(name, slug)")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const categoryCards = buildHomeCategoryCards(
    featuredCategories,
    totalProducts ?? 0,
  );

  const featuredProductLists = await Promise.all(
    featuredCategories.map(async (cat) => {
      const ids = await getProductIdsInCategory(supabase, cat.id);
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from("products")
        .select(PRODUCT_WITH_CATEGORY)
        .eq("is_active", true)
        .in("id", ids)
        .order("sort_order", { ascending: true })
        .limit(3);
      return data ?? [];
    }),
  );

  const homeReviews: ReviewItem[] = (reviewsRaw ?? []).map((r) => {
    const product = Array.isArray(r.product) ? r.product[0] : r.product;
    return { ...r, product: product ?? null };
  });

  const products = featuredProductLists.flat() as Product[];

  return (
    <div>
      {/* Hero — Video intro T Pharma Gold */}
      <VideoHero video480={homeVideos.video480} video1080={homeVideos.video1080} />

      {/* Video promocional — antes de categorías */}
      <VideoShowcase videoUrl={homeVideos.showcaseVideo} />

      {/* Categorías */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center mb-10">
          <h2 className="text-white font-display font-bold text-3xl sm:text-4xl uppercase tracking-tight">
            Explora por categoría
          </h2>
          <div className="mt-3 h-[3px] w-12 bg-accent rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {categoryCards.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={`group relative rounded-xl ${cat.cardBg} border ${cat.cardBorder} ${cat.cardShadow}
                transition-all duration-300 overflow-hidden flex flex-col gap-3 p-5
                hover:scale-[1.02]`}
            >
              {/* Left color stripe */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
                style={{ background: cat.stripe }}
              />

              {/* Top row: pill badge */}
              <div className="flex items-center justify-between pl-1">
                <span
                  className={`text-[10px] font-display uppercase tracking-widest px-2 py-0.5 rounded-md border ${cat.pillBg} ${cat.pillText} ${cat.pillBorder}`}
                >
                  {cat.tag}
                </span>
              </div>

              {/* Content */}
              <div className="pl-1">
                <h3 className="text-white font-display font-bold text-lg uppercase tracking-wide leading-tight">
                  {cat.label}
                </h3>
                <p className="text-zinc-400 text-xs mt-1 leading-snug">
                  {cat.sub}
                </p>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-1.5 pl-1 mt-1">
                <span className="text-[10px] font-display uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors duration-200">
                  Ver productos
                </span>
                <span
                  className={`text-zinc-600 ${cat.arrowColor} group-hover:translate-x-1 transition-all duration-200`}
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Productos destacados */}
      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-white font-display font-bold text-3xl uppercase tracking-tight">
                Productos destacados
              </h2>
              <div className="mt-2 h-[3px] w-10 bg-accent rounded-full" />
            </div>
            <Link
              href="/tienda"
              className="text-accent hover:text-white text-xs font-display uppercase tracking-widest transition-colors flex items-center gap-1 group"
            >
              Ver todos
              <span className="group-hover:translate-x-1 transition-transform duration-200">
                →
              </span>
            </Link>
          </div>
          <ProductGrid products={products} columns={3} />
        </section>
      )}

      {/* Quiénes somos */}
      <AboutSection />

      {/* Ventajas */}
      <section className="border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                ),
                title: "Envío seguro",
                desc: "A todo México desde $99",
              },
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                ),
                title: "Garantía de calidad",
                desc: "Productos 100% originales",
              },
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                ),
                title: "Pago seguro",
                desc: "Con Openpay, tarjeta o efectivo",
              },
            ].map((v) => (
              <div key={v.title} className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-accent">
                  {v.icon}
                </div>
                <h3 className="text-white font-display font-semibold uppercase tracking-wide text-sm">
                  {v.title}
                </h3>
                <p className="text-zinc-500 text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeReviewsSection reviews={homeReviews} />
    </div>
  );
}
