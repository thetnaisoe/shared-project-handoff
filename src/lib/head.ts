export const pageHead = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} — Lab2Market AI` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Lab2Market AI` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
