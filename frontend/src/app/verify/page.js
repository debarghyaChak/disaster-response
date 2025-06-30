"use client";
import { useState } from "react";

export default function ImageVerifyPage() {
  const [imageFile, setImageFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(e) {
    e.preventDefault();
    if (!imageFile) return;

    const formData = new FormData();
    formData.append("image", imageFile);

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/disasters/verify-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      setResult(data);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Upload Image for Verification</h2>
      <form onSubmit={handleUpload} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          required
          className="block w-full hover: text-blue-200"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 transition-all duration-200 ease-in-out text-white font-semibold px-6 py-2 rounded-lg shadow-md disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Upload & Verify"}
        </button>
      </form>

      {result && (
        <div className="mt-6 bg-gray-900 text-white p-4 rounded shadow">
          <img src={result.imageUrl} alt="Uploaded" className="w-full rounded mb-2" />
          <p className="text-green-400 font-mono whitespace-pre-wrap">{result.analysis}</p>
        </div>
      )}
    </div>
  );
}
