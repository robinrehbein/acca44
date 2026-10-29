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

/** Approximate edge colors of the supplied product images. */
export const productBackground = (slug: string) => ({
  w1122: '#fdf9f1', w1150: '#fbf6f0', w1181: '#fcf7f0',
  w1160: '#f6eee6', w373: '#fdf8f0', w1164: '#f9f4ec',
} as Record<string, string>)[slug] ?? '#f8f4ec';
