import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
     if (!auth) {
    setLoading(false);
    return;
  }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

          if (userDoc.exists()) {
            const profileData = userDoc.data();
            setUser(firebaseUser);
            setUserProfile(profileData);
          } else {
            // User exists in Auth but no profile in Firestore
            setUser(firebaseUser);
            setUserProfile(null);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }

        setError(null);
      } catch (err) {
        console.error("Auth state change error:", err);
        setError(err.message);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error("Sign out error:", err);
      setError(err.message);
    }
  };

  return {
    user,
    userProfile,
    loading,
    error,
    signOut,
    isAuthenticated: !!user,
    hasProfile: !!userProfile,
  };
};
