import { useState, useEffect } from "react";
import { collectionGroup, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export interface ChatMessage {
  id: string;
  agreementId: string;
  senderId: string;
  text: string;
  timestamp: any;
}

export function useChatActivity() {
  const { user } = useAuth();
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Use collectionGroup to find recent messages across all paths
    // Note: This requires a composite index for collectionGroup 'messages'
    // with 'timestamp' descending.
    // If index is missing, it will throw an error with a link to create it.
    // In our case, we might need to settle for a simpler approach if indexes aren't possible.
    // However, I'll attempt the collectionGroup approach.
    
    // Actually, a safer way without collectionGroup indexing issues in a quick demo:
    // Listen to user's agreements and then listen to their messages.
    // But since we want "Recent chats" on the activity feed, I'll stick to a simple query.
    
    const q = query(
      collectionGroup(db, "messages"),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        agreementId: doc.ref.parent.parent?.id || "",
        ...doc.data()
      })) as ChatMessage[];
      
      setRecentMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error("Chat activity error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { recentMessages, loading };
}
