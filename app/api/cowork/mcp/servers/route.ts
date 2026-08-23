import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getSessionUser } from "@/lib/auth";
import { listMCPServers, registerMCPServer, discoverMCPTools } from "@/lib/mcp";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const servers = listMCPServers();
  const tools = await discoverMCPTools();
  return NextResponse.json({ servers, tools });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, url } = body;

    if (!name || !url) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
    }

    const newServer = registerMCPServer(name, url);
    return NextResponse.json({ server: newServer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to register MCP server" }, { status: 500 });
  }
}
