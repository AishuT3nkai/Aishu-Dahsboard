import { NextRequest, NextResponse } from "next/server";
import { bridge } from "@/lib/bridge";
import { ApiError, handleApiError, requireAdminSession, requireAuthorizedGuild } from "@/lib/authGuard";

async function authorizedGuildId(req: NextRequest) {
  const session = await requireAdminSession();
  return requireAuthorizedGuild(
    session.discordAccessToken,
    req.nextUrl.searchParams.get("guildId")
  );
}

function webhookIdFromRequest(req: NextRequest): string {
  const id = req.nextUrl.searchParams.get("webhookId");
  if (!id || !/^\d+$/.test(id)) {
    throw new ApiError(400, "A valid webhookId is required.");
  }
  return id;
}

export async function GET(req: NextRequest) {
  try {
    const guildId = await authorizedGuildId(req);
    const action = req.nextUrl.searchParams.get("action");
    if (action === "deliveries") {
      return NextResponse.json({
        data: await bridge.listWebhookDeliveries(guildId, webhookIdFromRequest(req)),
      });
    }
    return NextResponse.json({ data: await bridge.listWebhooks(guildId) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const guildId = await authorizedGuildId(req);
    const action = req.nextUrl.searchParams.get("action");
    if (action === "test") {
      return NextResponse.json({
        data: await bridge.testWebhook(guildId, webhookIdFromRequest(req)),
      });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as { endpoint?: unknown }).endpoint !== "string" ||
      !Array.isArray((body as { events?: unknown }).events) ||
      !(body as { events: unknown[] }).events.every((event) => typeof event === "string")
    ) {
      return NextResponse.json({ error: "Endpoint and event list are required." }, { status: 400 });
    }
    const data = await bridge.createWebhook(guildId, body as { endpoint: string; events: string[] });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guildId = await authorizedGuildId(req);
    const id = webhookIdFromRequest(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
    }
    const data = await bridge.updateWebhook(
      guildId,
      id,
      body as { endpoint?: string; events?: string[]; enabled?: boolean }
    );
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const guildId = await authorizedGuildId(req);
    await bridge.deleteWebhook(guildId, webhookIdFromRequest(req));
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
