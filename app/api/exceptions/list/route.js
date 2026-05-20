import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken, getUserProfile } from "@/lib/firebase-admin";
import { jsonError, jsonSuccess } from "@/lib/api-response";

export async function GET(request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    const decodedToken = await verifyFirebaseToken(token);

    if (!decodedToken) {
      return jsonError("Unauthorized", 401);
    }

    const profile = await getUserProfile(decodedToken.uid);

    if (!profile) {
      return jsonError("User profile not found", 404);
    }

    const db = await connectDb();

    let exceptions;

    if (profile.role === "admin" || profile.role === "teacher") {
      exceptions = await db
        .collection("exceptions")
        .find({ status: "pending" })
        .sort({ createdAt: -1 })
        .toArray();
    } else if (profile.role === "student") {
      exceptions = await db
        .collection("exceptions")
        .find({ status: "pending", studentEmail: decodedToken.email })
        .sort({ createdAt: -1 })
        .toArray();
    } else {
      return jsonError("Forbidden", 403);
    }

    return jsonSuccess(exceptions, 200);
  } catch (error) {
    console.error("Exception fetch error:", error);
    return jsonError("Internal server error", 500);
  }
}
