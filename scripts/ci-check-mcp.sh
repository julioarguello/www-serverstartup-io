#!/usr/bin/env bash
# ci-check-mcp.sh — smoke test for the public MCP endpoint (issue #225).
#
# Asserts the JSON-RPC 2.0 / Streamable-HTTP contract of /mcp against a running
# instance. Black-box, no dependencies beyond curl — same style as
# ci-check-headers.sh. Works against the local stack or a deployed URL, so you
# can verify a preview yourself:
#
#   scripts/ci-check-mcp.sh http://localhost:8787      # local stack
#   scripts/ci-check-mcp.sh https://<preview-url>      # a deployed preview
set -uo pipefail

BASE="${1:?usage: ci-check-mcp.sh <base-url>}"
MCP="$BASE/mcp"
FAIL=0

rpc() { # $1 = JSON body → prints response body
	curl -s -H "Content-Type: application/json" -X POST "$MCP" -d "$1"
}

want() { # $1 = label, $2 = haystack, $3 = needle (grep -F)
	if printf '%s' "$2" | grep -qF -- "$3"; then
		echo "  ok   $1"
	else
		echo "  FAIL $1 (expected to contain: $3)" >&2
		FAIL=1
	fi
}

want_status() { # $1 = label, $2 = actual, $3 = expected
	if [ "$2" = "$3" ]; then
		echo "  ok   $1 ($2)"
	else
		echo "  FAIL $1 (got $2, expected $3)" >&2
		FAIL=1
	fi
}

# ── initialize: server advertises protocol + identity ────────────────────────
INIT=$(rpc '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18"}}')
want "initialize → protocolVersion" "$INIT" '"protocolVersion"'
want "initialize → serverInfo"      "$INIT" '"serverInfo"'

# ── tools/list: every advertised tool is present ─────────────────────────────
LIST=$(rpc '{"jsonrpc":"2.0","id":2,"method":"tools/list"}')
for tool in company_info list_services list_posts get_post search_content; do
	want "tools/list → $tool" "$LIST" "\"$tool\""
done

# ── tools/call company_info: returns live CMS data as a text content block ───
COMPANY=$(rpc '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"company_info","arguments":{}}}')
want "company_info → content block" "$COMPANY" '"content"'
want "company_info → live brand"    "$COMPANY" 'Server Startup'

# ── tools/call list_services: entries carry title + url ──────────────────────
SERVICES=$(rpc '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"list_services","arguments":{"limit":3}}}')
want "list_services → title field" "$SERVICES" '\"title\":'
want "list_services → url field"   "$SERVICES" '\"url\":'

# ── tools/call search_content: keyword hit returns results ───────────────────
SEARCH=$(rpc '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"search_content","arguments":{"query":"cloudflare"}}}')
want "search_content → typed hit" "$SEARCH" '\"type\":'

# ── unknown tool: JSON-RPC invalid-params error, not a crash ─────────────────
UNKNOWN=$(rpc '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"does_not_exist","arguments":{}}}')
want "unknown tool → -32602 error" "$UNKNOWN" '-32602'

# ── notification (no id): acknowledged with 202, no body ─────────────────────
NOTIF_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Content-Type: application/json" \
	-X POST "$MCP" -d '{"jsonrpc":"2.0","method":"notifications/initialized"}')
want_status "notifications/initialized → 202" "$NOTIF_STATUS" "202"

# ── GET is not the transport: 405 with an Allow hint ─────────────────────────
GET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$MCP")
want_status "GET /mcp → 405" "$GET_STATUS" "405"

if [ "$FAIL" -eq 0 ]; then
	echo "mcp smoke: all checks passed"
fi
exit $FAIL
