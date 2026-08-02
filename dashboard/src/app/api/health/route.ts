import { NextResponse } from "next/server";

export async function GET() {
  try {
    const controlPlaneUrl =
      process.env.CONTROL_PLANE_URL || "http://localhost:8000";
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
  } catch (error: any) {
    return NextResponse.json(
      { status: "offline", error: error.message },
      { status: 200 },
    );
  }
}
