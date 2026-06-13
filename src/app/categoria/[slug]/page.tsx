import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductGrid from "@/components/products/ProductGrid";
import BrandBanner from "@/components/ui/BrandBanner";
import PageHero from "@/components/layout/PageHero";
import { fetchActiveProductsByCategory } from "@/lib/product-categories";
import type { Product, Category } from "@/types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

const CATEGORY_THEME: Record<
  string,
  {
    displayName: string;
    description: string;
    accentColor: string;
    glowRgba: string;
  }
> = {
  mujeres: {
    displayName: "Para Ellas",
    description: "Suplementos y nutrición especialmente diseñados para mujeres",
    accentColor: "#E8177A",
    glowRgba: "rgba(232,23,122,0.08)",
  },
  hombres: {
    displayName: "Para Ellos",
    description: "Suplementos y nutrición para hombres de alto rendimiento",
    accentColor: "#D4AF37",
    glowRgba: "rgba(201,162,39,0.12)",
  },
  premium: {
    displayName: "Productos Premium",
    description: "Los productos más vendidos y legendarios de T Pharma Gold",
    accentColor: "#D4AF37",
    glowRgba: "rgba(201,162,39,0.12)",
  },
  suplementos: {
    displayName: "Suplementos Tpharma Gold",
    description: "Línea completa de suplementación T Pharma Gold",
    accentColor: "#D4AF37",
    glowRgba: "rgba(201,162,39,0.12)",
  },
  "t-health": {
    displayName: "T Health Línea Natural",
    description: "Suplementos de línea natural",
    accentColor: "#D4B85A",
    glowRgba: "rgba(212,184,90,0.10)",
  },
  "formulas-rendimiento": {
    displayName: "Fórmulas de Rendimiento Avanzado",
    description: "Fórmulas de alto rendimiento para atletas",
    accentColor: "#6366f1",
    glowRgba: "rgba(99,102,241,0.08)",
  },
  vanguardia: {
    displayName: "Suplementación de Vanguardia",
    description: "Lo más avanzado en suplementación",
    accentColor: "#a855f7",
    glowRgba: "rgba(168,85,247,0.08)",
  },
  moduladores: {
    displayName: "Moduladores Receptores Selectivos",
    description: "Moduladores de vanguardia",
    accentColor: "#3b82f6",
    glowRgba: "rgba(59,130,246,0.08)",
  },
  "factores-crecimiento": {
    displayName: "Factores de Crecimiento",
    description: "Factores de crecimiento de alta pureza",
    accentColor: "#14b8a6",
    glowRgba: "rgba(20,184,166,0.08)",
  },
};

const DEFAULT_THEME = {
  accentColor: "#D4AF37",
  glowRgba: "rgba(201,162,39,0.12)",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const theme = CATEGORY_THEME[slug];
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();
  const name = theme?.displayName ?? data?.name ?? "Categoría";
  return { title: name };
}

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  const products = await fetchActiveProductsByCategory(
    supabase,
    (category as Category).id,
  );

  const cat = category as Category;
  const prods = products as Product[];

  const theme = CATEGORY_THEME[slug] ?? {
    ...DEFAULT_THEME,
    displayName: cat.name,
    description: cat.description ?? "",
  };

  return (
    <div
      style={
        {
          "--accent": theme.accentColor,
          "--accent-dim": theme.accentColor,
        } as React.CSSProperties
      }
    >
      <PageHero glowColor={theme.glowRgba}>
        <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-6 font-display uppercase tracking-wide">
          <Link href="/" className="hover:text-zinc-300 transition-colors">
            Inicio
          </Link>
          <span className="text-zinc-700">/</span>
          <Link
            href="/tienda"
            className="hover:text-zinc-300 transition-colors"
          >
            Tienda
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-accent">{theme.displayName}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-white font-display font-bold text-4xl sm:text-5xl uppercase tracking-tight leading-none">
              {theme.displayName}
            </h1>
            <div className="mt-3 h-[3px] w-14 bg-accent rounded-full" />
            {theme.description && (
              <p className="text-zinc-400 mt-4 text-sm max-w-lg leading-relaxed">
                {theme.description}
              </p>
            )}
          </div>
          <span className="text-zinc-600 font-display text-sm uppercase tracking-wider shrink-0">
            {prods.length} {prods.length === 1 ? "producto" : "productos"}
          </span>
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ProductGrid products={prods} />
      </div>

      <BrandBanner />
    </div>
  );
}
