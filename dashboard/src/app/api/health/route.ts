import { NextResponse } from "next/server";

export async function GET() {
  try {
    const controlPlaneUrl = process.env.CONTROL_PLANE_URL;
    if (!controlPlaneUrl) {
      console.error("CONTROL_PLANE_URL is not configured");
      return NextResponse.json({ status: "offline" }, { status: 200 });
    }
    const res = await fetch(`${controlPlaneUrl}/health`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ status: "degraded" }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json({
      status: data.status === "healthy" ? "online" : "degraded",
      details: data,
    });
  } catch (error: unknown) {
    console.error("Control plane health check failed:", error);
    return NextResponse.json({ status: "offline" }, { status: 200 });
  }
}
