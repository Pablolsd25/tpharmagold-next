import { createClient } from '@/lib/supabase/server'
import HomeReviewsSection from '@/components/home/HomeReviewsSection'
import type { ReviewItem } from '@/components/reviews/ReviewCard'

export default async function HomePageReviews() {
  const supabase = await createClient()

  const { data: reviewsRaw } = await supabase
    .from('reviews')
    .select('id, reviewer_name, rating, title, comment, created_at, product:products(name, slug)')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(6)

  const homeReviews: ReviewItem[] = (reviewsRaw ?? []).map((r) => {
    const product = Array.isArray(r.product) ? r.product[0] : r.product
    return { ...r, product: product ?? null }
  })

  return <HomeReviewsSection reviews={homeReviews} />
}
