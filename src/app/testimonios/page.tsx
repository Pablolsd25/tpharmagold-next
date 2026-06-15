import type { Metadata } from 'next'
import PinkKitTestimoniosContent from '@/components/testimonios/PinkKitTestimoniosContent'

export const metadata: Metadata = {
  title: 'Testimonios Pink Kit para Mujeres',
  description:
    'Testimonios reales de clientas Pink Kit: glúteos, piernas y busto. Miles de mujeres avalan T Pharma Gold.',
}

export default function TestimoniosPage() {
  return <PinkKitTestimoniosContent />
}
