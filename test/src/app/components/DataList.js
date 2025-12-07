"use client";

import { useEffect, useState } from "react";
import { db } from "../utils/db";

export default function DataList() {
  const [posts, setPosts] = useState([]);
  const [isOnline, setIsOnline] = useState(true);

  async function loadData() {
    try {
      // Online mode
      const res = await fetch("https://jsonplaceholder.typicode.com/posts");
      const data = await res.json();

      // Save to IndexedDB
      await db.posts.clear();
      await db.posts.bulkPut(data);

      setPosts(data);
      setIsOnline(true);
    } catch (err) {
      console.log("Offline: Loading from IndexedDB…");

      // Offline mode → load from IndexedDB
      const offlineData = await db.posts.toArray();

      if (offlineData.length > 0) {
        setPosts(offlineData);
        setIsOnline(false);
      } else {
        // No cached data → redirect to No Internet page
        window.location.href = "/no-internet";
      }
    }
  }

  useEffect(() => {
    loadData();

    // Listen for online/offline changes
    window.addEventListener("online", () => loadData());
    window.addEventListener("offline", () => setIsOnline(false));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold">Posts</h2>
      <p>Status: {isOnline ? "Online" : "Offline (using cache)"}</p>

      {posts.map(p => (
        <div key={p.id} className="border p-2 m-2">
          <h3 className="font-bold">{p.title}</h3>
          <p>{p.body}</p>
        </div>
      ))}
    </div>
  );
}
