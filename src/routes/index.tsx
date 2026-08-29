import { createFileRoute } from "@tanstack/react-router";
import { WealthScale } from "@/components/scale/WealthScale";

const title = "The Scale of Wealth — US Inequality at Solar-System Size";
const description =
  "An interactive 3D visualization: from $1 to $7.8 trillion, each sphere's volume matches the money. The median US household is the Earth.";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: "The Scale of Wealth",
          description,
          about: "Wealth inequality in the United States",
          learningResourceType: "Interactive visualization",
        }),
      },
    ],
  }),
  component: WealthScale,
});
