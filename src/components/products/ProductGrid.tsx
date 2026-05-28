import ProductCard from './ProductCard'
import type { Product } from '@/types'

interface Props {
  products: Product[]
  title?: string
}

export default function ProductGrid({ products, title }: Props) {
  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500 text-lg">No se encontraron productos.</p>
      </div>
    )
  }

  return (
    <section>
      {title && (
        <h2 className="text-white font-bold text-2xl mb-6">{title}</h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
