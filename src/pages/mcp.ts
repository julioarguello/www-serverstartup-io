/**
 * Model Context Protocol (MCP) server — public, read-only.
 *
 * Exposes the site's own CMS content (services, blog posts, company info) as
 * MCP tools so AI agents (claude.ai, ChatGPT, Claude Code…) can query Server
 * Startup's live content. A consultancy whose own website is agent-readable —
 * the natural extension of /deconstruyendo (see issue #225).
 *
 * Transport: stateless Streamable-HTTP. Each POST is a self-contained JSON-RPC
 * 2.0 request answered with a single application/json response (no SSE, no
 * session state). Read-only: no auth, no writes, no secrets. Phone/WhatsApp
 * stay encoded in site settings and are deliberately NOT exposed here — same
 * anti-scraping stance as the rendered pages.
 */
import type { APIRoute } from "astro";
import { getEmDashCollection, getEmDashEntry, getSiteSettings } from "emdash";
import type { SiteSettings } from "../types";
import { extractText } from "../utils/reading-time";

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "serverstartup-content", version: "1.0.0" };
const MAX_CONTENT_CHARS = 8000;

const CORS_HEADERS: Record<string, string> = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Protocol-Version",
};

// ─── JSON-RPC plumbing ────────────────────────────────────────────────────────

interface JsonRpcRequest {
	jsonrpc: string;
	id?: string | number | null;
	method: string;
	params?: Record<string, unknown>;
}

function rpcResult(id: string | number | null | undefined, result: unknown): Response {
	return new Response(JSON.stringify({ jsonrpc: "2.0", id: id ?? null, result }), {
		headers: { "Content-Type": "application/json", ...CORS_HEADERS },
	});
}

function rpcError(id: string | number | null | undefined, code: number, message: string): Response {
	return new Response(JSON.stringify({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }), {
		status: 200,
		headers: { "Content-Type": "application/json", ...CORS_HEADERS },
	});
}

// A tool result: MCP wraps tool output as a list of content blocks.
function toolText(payload: unknown): { content: { type: "text"; text: string }[] } {
	const text = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
	return { content: [{ type: "text", text }] };
}

// ─── Tool catalogue ───────────────────────────────────────────────────────────

const TOOLS = [
	{
		name: "company_info",
		description: "Public information about Server Startup: name, tagline and public email.",
		inputSchema: { type: "object", properties: {}, additionalProperties: false },
	},
	{
		name: "list_services",
		description: "List Server Startup's services (title, summary and page URL).",
		inputSchema: {
			type: "object",
			properties: { limit: { type: "number", description: "Max services to return (default 20)." } },
			additionalProperties: false,
		},
	},
	{
		name: "list_posts",
		description: "List recent blog posts (title, excerpt, publish date and URL).",
		inputSchema: {
			type: "object",
			properties: { limit: { type: "number", description: "Max posts to return (default 20)." } },
			additionalProperties: false,
		},
	},
	{
		name: "get_post",
		description: "Get the full plain-text content of one blog post by its slug/id.",
		inputSchema: {
			type: "object",
			properties: { id: { type: "string", description: "Post slug/id, e.g. from list_posts." } },
			required: ["id"],
			additionalProperties: false,
		},
	},
	{
		name: "search_content",
		description: "Keyword search across services and blog posts (title, excerpt and body).",
		inputSchema: {
			type: "object",
			properties: { query: { type: "string", description: "Search terms." } },
			required: ["query"],
			additionalProperties: false,
		},
	},
] as const;

// ─── Tool implementations ─────────────────────────────────────────────────────

function clamp(text: string): string {
	return text.length > MAX_CONTENT_CHARS ? `${text.slice(0, MAX_CONTENT_CHARS)}…` : text;
}

async function runTool(name: string, args: Record<string, unknown>, origin: string): Promise<unknown> {
	switch (name) {
		case "company_info": {
			const settings = (await getSiteSettings()) as SiteSettings;
			return {
				name: settings.title ?? "Server Startup",
				tagline: settings.tagline ?? "",
				email: settings.email ?? "ventas@serverstartup.io",
				website: origin,
				contact_url: `${origin}/contacto`,
			};
		}

		case "list_services": {
			const limit = typeof args.limit === "number" ? args.limit : 20;
			const { entries } = await getEmDashCollection("services");
			return entries.slice(0, limit).map((e) => ({
				id: e.id,
				title: e.data.title ?? "",
				summary: e.data.excerpt ?? "",
				url: `${origin}/${e.id}`,
			}));
		}

		case "list_posts": {
			const limit = typeof args.limit === "number" ? args.limit : 20;
			const { entries } = await getEmDashCollection("posts", { orderBy: { published_at: "desc" } });
			return entries.slice(0, limit).map((e) => ({
				id: e.id,
				title: e.data.title ?? "",
				excerpt: e.data.excerpt ?? "",
				published_at: e.data.publishedAt ? e.data.publishedAt.toISOString() : null,
				url: `${origin}/posts/${e.id}`,
			}));
		}

		case "get_post": {
			const id = typeof args.id === "string" ? args.id : "";
			if (!id) throw new Error("Missing required argument: id");
			const { entry } = await getEmDashEntry("posts", id);
			if (!entry) return { found: false, id };
			return {
				found: true,
				id: entry.id,
				title: entry.data.title ?? "",
				excerpt: entry.data.excerpt ?? "",
				published_at: entry.data.publishedAt ? entry.data.publishedAt.toISOString() : null,
				url: `${origin}/posts/${entry.id}`,
				content: clamp(extractText(entry.data.content)),
			};
		}

		case "search_content": {
			const query = (typeof args.query === "string" ? args.query : "").trim().toLowerCase();
			if (!query) throw new Error("Missing required argument: query");
			const [posts, services] = await Promise.all([
				getEmDashCollection("posts"),
				getEmDashCollection("services"),
			]);
			const haystack = [
				...posts.entries.map((e) => ({ type: "post" as const, e, url: `${origin}/posts/${e.id}` })),
				...services.entries.map((e) => ({ type: "service" as const, e, url: `${origin}/${e.id}` })),
			];
			return haystack
				.filter(({ e }) => {
					const blob = `${e.data.title ?? ""} ${e.data.excerpt ?? ""} ${extractText(e.data.content)}`.toLowerCase();
					return blob.includes(query);
				})
				.slice(0, 10)
				.map(({ type, e, url }) => ({ type, id: e.id, title: e.data.title ?? "", excerpt: e.data.excerpt ?? "", url }));
		}

		default:
			throw new Error(`Unknown tool: ${name}`);
	}
}

// ─── HTTP surface ─────────────────────────────────────────────────────────────

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS_HEADERS });

export const GET: APIRoute = () =>
	new Response(
		JSON.stringify({
			error: "This is an MCP endpoint. Use HTTP POST with JSON-RPC 2.0 (Streamable HTTP).",
			server: SERVER_INFO,
			tools: TOOLS.map((t) => t.name),
		}),
		{ status: 405, headers: { "Content-Type": "application/json", Allow: "POST, OPTIONS", ...CORS_HEADERS } },
	);

export const POST: APIRoute = async ({ request, site, url }) => {
	const origin = site?.origin ?? url.origin;

	let body: JsonRpcRequest;
	try {
		body = (await request.json()) as JsonRpcRequest;
	} catch {
		return rpcError(null, -32700, "Parse error: body is not valid JSON");
	}

	const { id, method } = body;
	const params = body.params ?? {};

	// Notifications (no id) — acknowledge with 202, no JSON-RPC body.
	if (id === undefined || id === null) {
		if (typeof method === "string" && method.startsWith("notifications/")) {
			return new Response(null, { status: 202, headers: CORS_HEADERS });
		}
	}

	switch (method) {
		case "initialize":
			return rpcResult(id, {
				protocolVersion:
					typeof params.protocolVersion === "string" ? params.protocolVersion : PROTOCOL_VERSION,
				capabilities: { tools: {} },
				serverInfo: SERVER_INFO,
			});

		case "ping":
			return rpcResult(id, {});

		case "tools/list":
			return rpcResult(id, { tools: TOOLS });

		case "tools/call": {
			const name = typeof params.name === "string" ? params.name : "";
			const args =
				params.arguments && typeof params.arguments === "object"
					? (params.arguments as Record<string, unknown>)
					: {};
			if (!TOOLS.some((t) => t.name === name)) {
				return rpcError(id, -32602, `Unknown tool: ${name}`);
			}
			try {
				const result = await runTool(name, args, origin);
				return rpcResult(id, toolText(result));
			} catch (e) {
				// Tool-level failure: report as an MCP tool error, not a transport error.
				return rpcResult(id, {
					...toolText(`Error: ${e instanceof Error ? e.message : String(e)}`),
					isError: true,
				});
			}
		}

		default:
			return rpcError(id, -32601, `Method not found: ${method}`);
	}
};

// Astro would otherwise try to prerender this route at build time, where the
// D1 binding is unavailable; force on-demand (server) rendering.
export const prerender = false;
