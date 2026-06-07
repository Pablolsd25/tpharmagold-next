import { createClient } from "@/lib/supabase/server";
import { isOffersCategory } from "@/lib/offers";
import ProductGrid from "@/components/products/ProductGrid";
import PageHero from "@/components/layout/PageHero";
import type { Product } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nuestras Ofertas" };

export default async function OfertasPage() {
  const supabase = await createClient();

  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, slug, name");

  const offerCatIds = (allCategories ?? [])
    .filter(isOffersCategory)
    .map((c) => c.id);
  const offerFilters = ["is_offer.eq.true"];
  for (const id of offerCatIds) offerFilters.push(`category_id.eq.${id}`);

  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("is_active", true)
    .or(offerFilters.join(","))
    .order("sort_order", { ascending: true });

  return (
    <div>
      {/* Page header */}
      <PageHero
        title="Nuestras Ofertas"
        subtitle="Productos en oferta especial — precios exclusivos por tiempo limitado."
        image="/hero-secondary.jpg"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {products && products.length > 0 ? (
          <ProductGrid products={products as Product[]} />
        ) : (
          <p className="text-zinc-500 text-sm text-center py-16">
            No hay ofertas activas en este momento. ¡Vuelve pronto!
          </p>
        )}
      </div>
    </div>
  );
}
