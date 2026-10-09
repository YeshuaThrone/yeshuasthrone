import { serializeJsonLd } from "@/lib/seo";

/**
 * One `<script type="application/ld+json">` per structured-data object.
 * Server component; the body is serialized with `<` escaped so page copy can
 * never close the tag early.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Serialized with serializeJsonLd, which escapes "<"; this is JSON, not markup.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
