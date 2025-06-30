"use client";
import { useState, useEffect } from "react";

export default function ResourcesPage() {
  const [disasters, setDisasters] = useState([]);
  const [selectedDisasterId, setSelectedDisasterId] = useState("");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDisasters();
  }, []);

  useEffect(() => {
    fetchResources();
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

  async function fetchResources() {
    if (!selectedDisasterId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/disasters/${selectedDisasterId}/resources`
      );
      const data = await res.json();

      if (!data || data.length === 0) {
        setResources([]);
        alert("No resources found near this disaster.");
      } else {
        setResources(data);
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      alert("An error occurred while fetching resources.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Search Resources Nearby</h2>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
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
        {resources.length > 0 ? (
          <ul className="space-y-3">
            {resources.map((res) => (
              <li
                key={res.id}
                className="p-4 bg-gray-900 rounded shadow text-white"
              >
                <p className="font-bold text-blue-400">{res.name}</p>
                <p className="text-sm text-gray-300">
                  Type: {res.type || "N/A"}
                </p>
                <p className="text-sm text-gray-400">
                  Location: {res.location_name || "Unknown"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          selectedDisasterId && !loading && <p className="text-gray-500"></p>
        )}
      </div>
    </div>
  );
}
