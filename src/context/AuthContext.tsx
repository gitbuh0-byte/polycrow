import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, firebaseAvailable } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadingTimeout = window.setTimeout(() => {
      setLoading(false);
      console.error("Firebase authentication timed out. Check Vercel Firebase environment variables and authorized domains.");
    }, 2500);

    if (!firebaseAvailable) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      window.clearTimeout(loadingTimeout);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
        window.clearTimeout(loadingTimeout);
      }
    }, (error) => {
      console.error("Firebase authentication error:", error);
      setUser(null);
      setProfile(null);
      setLoading(false);
      window.clearTimeout(loadingTimeout);
    });
    return () => {
      window.clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && firebaseAvailable) {
      const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        setProfile(doc.data() || null);
        setLoading(false);
      }, (error) => {
        console.error("Profile Snapshot error:", error);
        setLoading(false);
      });
      return unsub;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
