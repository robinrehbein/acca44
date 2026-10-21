/** Generated illustrative images for fictional demo models, not manufacturer photos. */
export const productImages: Record<string, string> = Object.fromEntries(
  [
    "kamo-gutsu-riva",
    "kamo-gutsu-porto",
    "kamo-gutsu-lido",
    "kamo-gutsu-monte",
    "satorisan-seebrise",
    "satorisan-ufer",
    "satorisan-waldpfad",
    "satorisan-morgenlicht",
    "acca-tasche-hafen",
    "acca-tasche-promenade",
    "acca-guertel-klassik",
    "acca-guertel-geflecht",
  ].map((slug) => [slug, `/images/products/${slug}.jpg`]),
);

export const productImage = (slug: string) =>
  productImages[slug] ?? "/images/shoe-demo.jpg";
