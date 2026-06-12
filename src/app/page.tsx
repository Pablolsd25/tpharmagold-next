import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import {
  DEFAULT_HOME_VIDEO_POSTER,
  getHomeVideoSettings,
} from '@/lib/home-video'
import HomeIntroVideo from '@/components/home/HomeIntroVideo'
import GanamosBanner from '@/components/home/GanamosBanner'
import AboutSection from '@/components/home/AboutSection'
import HomeContactSection from '@/components/home/HomeContactSection'
import HomePageSections from '@/components/home/HomePageSections'
import HomeSectionsSkeleton from '@/components/home/HomeSectionsSkeleton'

export default async function HomePage() {
  const supabase = await createClient()
  const { video480 } = await getHomeVideoSettings(supabase)

  return (
    <div className="bg-black">
      <HomeIntroVideo video480={video480} poster={DEFAULT_HOME_VIDEO_POSTER} />
      <GanamosBanner />

      <Suspense fallback={<HomeSectionsSkeleton />}>
        <HomePageSections />
      </Suspense>

      <AboutSection />
      <HomeContactSection />
    </div>
  )
}
