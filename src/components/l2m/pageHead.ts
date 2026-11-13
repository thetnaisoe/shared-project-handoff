// Route head helper carrying the Lab2Markt brand.
// Mirrors the shared head helper's shape but uses this app's own name, so
// page titles and share tags never fall back to another product's name.
export const pageHead = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} — Lab2Markt` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Lab2Markt` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
