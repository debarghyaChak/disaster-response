"use client";
import { useState, useEffect } from "react";

export default function SocialMediaPage() {
  const [disasters, setDisasters] = useState([]);
  const [selectedDisasterId, setSelectedDisasterId] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDisasters();
  }, []);

  async function fetchSocialMediaPosts() {
    if (!selectedDisasterId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/disasters/${selectedDisasterId}/social-media`
      );
      const data = await res.json();
      console.log("Fetched response:", data); // ✅ Debug log

      if (!data || !data.posts || data.posts.length === 0) {
        setPosts([]);
        alert("No social media posts found for this disaster.");
      } else {
        setPosts(data.posts); // ✅ Correct usage
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      alert("An error occurred while fetching posts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedDisasterId) {
      console.log("Fetching posts for:", selectedDisasterId);
      console.log("Fetching posts for:", selectedDisasterId);
      fetchSocialMediaPosts();
    }
  }, [selectedDisasterId]);

  async function fetchDisasters() {
    try {
      const res = await fetch("http://localhost:5000/disasters");
      const data = await res.json();
      setDisasters(data || []);
    } catch (error) {
      console.error("Failed to fetch disasters:", error);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Social Media Posts</h2>

      <div className="mb-6">
        <select
          value={selectedDisasterId}
          onChange={(e) => setSelectedDisasterId(e.target.value)}
          className="p-2 border rounded w-full md:w-2/3 bg-gray-900 text-white border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select a Disaster --</option>
          {disasters.map((disaster) => (
            <option key={disaster.id} value={disaster.id}>
              {disaster.title} - {disaster.location_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        {posts.length > 0 ? (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li
                key={`${post.timestamp}-${post.user}`}
                className="p-4 bg-gray-900 rounded shadow text-white"
              >
                <p className="font-bold text-blue-400 capitalize">
                  {post.type || "Post"}
                </p>
                <p className="text-sm text-gray-300">
                  {post.post || "No content"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Posted by: {post.user || "Unknown"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          selectedDisasterId &&
          !loading && <p className="text-gray-500 text-sm"></p>
        )}
      </div>
    </div>
  );
}
