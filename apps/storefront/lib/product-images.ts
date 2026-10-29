/** Product photos are based on supplied reference photographs. */
export const productImages: Record<string, string> = {
  w1122: '/images/products/w1122.png',
  w1150: '/images/products/w1150.png',
  w1181: '/images/products/w1181.png',
  w1160: '/images/products/w1160.png',
  w373: '/images/products/w373.png',
  w1164: '/images/products/w1164.png',
};
export const productImage = (slug: string) =>
  productImages[slug] ?? '/images/shoe.svg';

export const productGallery = (slug: string): string[] =>
  productImages[slug] ? [productImages[slug], ...[1, 2, 3].map(i => `/images/products/${slug}-${i}.png`)] : [productImage(slug)];

export const displayProductName = (name: string) => name.replace(/^W\d+\s+/i, '');
