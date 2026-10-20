/**
 * The layers of /deconstruyendo (#535): one EmDash entry per layer of the
 * site, bottom-up, with the facts that prove it. Copy lives in the
 * `layers` collection (ES + EN, paired by `translationOf`); this module only
 * types, orders and renders the markdown-lite those fields carry.
 */
import { getEmDashCollection } from "emdash";
import { excerptHtml } from "./excerpt";

export type LayerGroup = "cloudflare" | "worker" | "taller";
export type LayerFigure =
	| "red" | "cache" | "computo" | "datos" | "emdash"
	| "presentacion" | "contenido" | "entrega" | "calidad";

export type LayerImage = { src: string; alt?: string; width?: number; height?: number };

export type LayerFact = {
	key: string;
	text: string;
	file?: string | null;
	file_note?: string | null;
	docs?: string | null;
	status?: "ok" | "pending" | null;
	pending_note?: string | null;
};

export type Layer = {
	slug: string;
	title: string;
	position: number;
	group: LayerGroup;
	kicker?: string;
	short: string;
	map_note?: string;
	summary?: string;
	lede?: string;
	figure: LayerFigure;
	nodes?: { title: string; note?: string; edge?: string; cloudflare?: boolean; fact?: string }[];
	nodes_plain?: boolean;
	stats?: { value?: string; label: string; kind?: "number" | "ring" | "swatches" }[];
	stats_note?: string;
	photos?: { image: LayerImage; alt: string; caption: string }[];
	capture?: LayerImage;
	capture_caption?: string;
	links?: string;
	facts: LayerFact[];
};

/** The order the page reads in: the four Cloudflare layers, then what runs inside the Worker, then what crosses them. */
export const GROUP_ORDER: LayerGroup[] = ["cloudflare", "worker", "taller"];

/**
 * Names that are Cloudflare products, so the page can mark them in
 * Cloudflare's orange (founder: "ellos en naranja y nosotros en negro y
 * gris"). The one place this vocabulary is declared; a product the copy
 * starts to name goes here, or it renders as plain code.
 */
export const CLOUDFLARE_PRODUCTS = new Set([
	"Cloudflare", "Workers", "Workers Cache", "Workers Static Assets", "Static Assets",
	"Workers KV", "Workers AI", "Dynamic Workers", "Custom Domains", "D1", "R2", "Images",
	"DNSSEC", "Encrypted Client Hello", "Always Use HTTPS", "wrangler", "wrangler-action",
	"workerd", "request.cf", "Cache API",
]);

/** markdown-lite → HTML, with Cloudflare's product names marked for the orange. */
export function layerHtml(s: string | null | undefined): string {
	if (!s) return "";
	return excerptHtml(s).replace(/<code>([^<]+)<\/code>/g, (m, name: string) =>
		CLOUDFLARE_PRODUCTS.has(name) ? `<code class="cf">${name}</code>` : m,
	);
}

/** The facts the page shows: a `pending` fact stays in the CMS until it is verified on the deployed site. */
export function shownFacts(layer: Layer): LayerFact[] {
	return (layer.facts ?? []).filter((f) => f.status !== "pending");
}

export async function getLayers(locale: string): Promise<{ layers: Layer[]; cacheHint: unknown }> {
	const { entries, cacheHint } = await getEmDashCollection("layers", { locale });
	const layers = (entries ?? []).map((e) => {
		const entry = e as unknown as { id: string; slug?: string; data: Omit<Layer, "slug"> };
		return { slug: entry.slug ?? entry.id, ...entry.data };
	});
	layers.sort((a, b) => a.position - b.position);
	return { layers, cacheHint };
}
