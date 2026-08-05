import type { CollectionParams, CollectorConnector, RawCollectedItem } from "../../src/types/collector";

export class RSSConnector implements CollectorConnector {
  name = "rss";

  isConfigured(): boolean {
    return Boolean(process.env.RSS_FEEDS);
  }

  async collect(params: CollectionParams): Promise<RawCollectedItem[]> {
    if (!this.isConfigured()) return [];
    const feeds = process.env.RSS_FEEDS!.split(",").map((feed) => feed.trim()).filter(Boolean);
    const items: RawCollectedItem[] = [];

    for (const feedUrl of feeds) {
      const response = await fetch(feedUrl);
      if (!response.ok) continue;
      const xml = await response.text();
      const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 30);
      matches.forEach((match, index) => {
        const block = match[1] ?? "";
        const title = readTag(block, "title");
        const link = readTag(block, "link");
        const description = readTag(block, "description");
        const pubDate = readTag(block, "pubDate");
        const matchesQuery = params.queries.some((query) =>
          `${title} ${description}`.toLowerCase().includes(query.toLowerCase())
        );
        if (matchesQuery) {
          items.push({
            id: `${feedUrl}-${index}`,
            collectedAt: new Date().toISOString(),
            publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            title,
            summary: description,
            content: description,
            url: link,
            domain: link ? safeDomain(link) : "",
            platform: "RSS",
            authorName: feedUrl,
            source: this.name,
            metadata: { feedUrl }
          });
        }
      });
    }

    return items;
  }
}

function readTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return (match?.[1] ?? "").replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1").replace(/<[^>]*>/g, "").trim();
}

function safeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
