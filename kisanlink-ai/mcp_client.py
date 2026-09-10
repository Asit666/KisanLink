"""Small MCP JSON-RPC client for KisanLink market-data tools."""

import json
import os
from typing import Any

import requests


class McpClientError(RuntimeError):
    """Raised when the MCP server cannot provide a valid tool result."""


class KisanLinkMcpClient:
    def __init__(self, server_url: str | None = None, token: str | None = None):
        self.server_url = server_url or os.getenv("MCP_SERVER_URL", "http://localhost:8080/mcp")
        self.token = token if token is not None else os.getenv("KISANLINK_MCP_TOKEN", "")

    def call_tool(self, name: str, arguments: dict[str, Any]) -> Any:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["X-MCP-Token"] = self.token

        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {"name": name, "arguments": arguments},
        }
        try:
            response = requests.post(self.server_url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            envelope = response.json()
        except requests.RequestException as exc:
            raise McpClientError(f"MCP request failed: {exc}") from exc
        except ValueError as exc:
            raise McpClientError("MCP returned invalid JSON") from exc

        if "error" in envelope:
            raise McpClientError(str(envelope["error"]))

        content = envelope.get("result", {}).get("content", [])
        if not content or content[0].get("type") != "text":
            raise McpClientError("MCP returned no text tool result")
        try:
            return json.loads(content[0]["text"])
        except (KeyError, TypeError, ValueError) as exc:
            raise McpClientError("MCP tool result was not valid JSON") from exc

    def historical_prices(self, crop: str, market: str | None, days: int) -> dict[str, Any]:
        arguments: dict[str, Any] = {"crop": crop, "days": min(max(days, 1), 730)}
        if market:
            arguments["market"] = market
        return self.call_tool("get_historical_prices", arguments)
