/** Imagen de producto: llena el recuadro y hace zoom al hover (desktop) o al tocar (mobile). */
export const PRODUCT_COVER_IMAGE_CLASS =
  'object-cover object-center scale-[1.08] transition-transform duration-500 ease-out group-hover:scale-[1.14] group-active:scale-[1.14]'

export const PRODUCT_COVER_IMAGE_SECONDARY_CLASS =
  `${PRODUCT_COVER_IMAGE_CLASS} opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-active:opacity-100`

export const PRODUCT_COVER_IMAGE_PRIMARY_SWAP_CLASS =
  `${PRODUCT_COVER_IMAGE_CLASS} transition-opacity duration-500 group-hover:opacity-0 group-active:opacity-0`
