import { createClient } from '@/lib/supabase/server'
import { getAllHomeSectionProducts } from '@/lib/home-section-products'
import { HOME_SECTIONS } from '@/lib/tpharma-home'
import HomeProductSection from '@/components/home/HomeProductSection'

export const revalidate = 120

export default async function HomePageSections() {
  const supabase = await createClient()
  const sectionProducts = await getAllHomeSectionProducts(supabase)

  return (
    <>
      {HOME_SECTIONS.map((section) => (
        <div
          key={section.id}
          id={section.id === 'premium' ? 'productos-premium' : undefined}
        >
          <HomeProductSection
            section={section}
            products={sectionProducts[section.id] ?? []}
          />
        </div>
      ))}
    </>
  )
}
