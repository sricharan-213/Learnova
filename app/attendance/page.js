"use client";

import { Navbar } from "@/components/Navbar";
import FaceRecognizer from "@/components/FaceRecognizer";
import useLabels from "@/components/useLabels";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const AttendancePage = () => {
  const { labels, loading, error } = useLabels();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated or unverified users
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth");
      } else if (!user.emailVerified) {
        router.push("/verify");
      }
    }
  }, [authLoading, user, router]);

  // While checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <span className="w-5 h-5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin mr-3"></span>
        <span className="text-indigo-300 text-xl">
          Checking authentication...
        </span>
      </div>
    );
  }

  if (!user) return null; // wait for redirect

  // Loading labels
  if (loading) {
    return (
      <div className="min-h-screen pt-10 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center pt-20 space-x-3">
          <span className="w-5 h-5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin"></span>
          <span className="text-indigo-300 text-xl">Loading labels...</span>
        </div>
      </div>
    );
  }

  // Error loading labels
  if (error) {
    return (
      <div className="min-h-screen pt-10 bg-gradient-to-br from-slate-400 to-slate-900">
        <Navbar />
        <div className="flex flex-col items-center justify-center mt-10">
          <span className="text-red-500 text-xl">Error loading labels!</span>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ✅ Authenticated, verified, and labels ready
  return (
    <div className="min-h-screen pt-10 bg-gradient-to-br from-slate-400 to-slate-900">
      <Navbar />
      <FaceRecognizer labels={labels} />
    </div>
  );
};

export default AttendancePage;
