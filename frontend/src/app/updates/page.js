"use client";
import { useEffect, useState } from "react";

export default function NewsUpdatesPage() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUpdates();
  }, []);

  async function fetchUpdates() {
    setLoading(true);
    try {
      const res = await fetch(
        "http://localhost:5000/disasters/official-updates"
      );
      const data = await res.json();
      setUpdates(data || []);
    } catch (err) {
      console.error("Failed to fetch official updates:", err);
      alert("An error occurred while fetching news updates.");
    } finally {
      setLoading(false);
    }
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = updates.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(updates.length / itemsPerPage);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Official News Updates</h2>

      {loading ? (
        <p className="text-white">Loading updates...</p>
      ) : updates.length > 0 ? (
        <>
          <ul className="space-y-4">
            {currentItems.map((item, idx) => (
              <li
                key={`${item.link}-${idx}`}
                className="p-4 bg-gray-900 rounded shadow text-white"
              >
                <p className="text-md text-blue-400 mb-1 break-words">
                  {item.title}
                </p>
                <p className="text-sm text-gray-300">
                  Category: {item.category || "General"}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  By: {item.author || "Unknown"}
                </p>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  View Source
                </a>
                <p className="text-xs text-gray-500 mt-1">
                  Published: {new Date(item.pubDate).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>

          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50"
            >
              &lt;
            </button>
            <span className="text-white text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-500">No updates available at this moment.</p>
      )}
    </div>
  );
}
