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

    // Fetch the authenticated user's profile
    const profile = await getUserProfile(decodedToken.uid);

    if (!profile) {
      return jsonError("User profile not found", 404);
    }

    const db = await connectDb();

    let query = { status: "pending" };

    if (profile.role !== "admin" && profile.role !== "teacher") {
      query.studentEmail = decodedToken.email;
    }

    const exceptions = await db
      .collection("exceptions")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return jsonSuccess(exceptions, 200);
  } catch (error) {
    console.error("Exception fetch error:", error);
    return jsonError("Internal server error", 500);
  }
}
