"use client";
import { useState, useEffect } from "react";
import {
  createDisaster,
  getDisasters,
  deleteDisaster,
  updateDisaster,
} from "@/utils/api";

export default function DisastersPage() {
  const [disasters, setDisasters] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location_name: "",
    tags: "",
  });
  const [loading, setLoading] = useState(false);

  // Modal-specific state
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    location_name: "",
    tags: "",
  });
  const [editId, setEditId] = useState(null);

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this disaster?")) {
      const res = await deleteDisaster(id);
      if (res?.success !== false) {
        alert("Disaster deleted successfully");
        fetchDisasters();
      } else {
        alert("Failed to delete");
      }
    }
  };

  const handleEdit = (dis) => {
    setEditForm({
      title: dis.title,
      description: dis.description,
      location_name: dis.location_name,
      tags: dis.tags?.join(", ") || "",
    });
    setEditId(dis.id);
    setShowModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tagList = editForm.tags.split(",").map((tag) => tag.trim());
      await updateDisaster(editId, { ...editForm, tags: tagList });
      setShowModal(false);
      fetchDisasters();
    } catch (err) {
      console.error("Error updating disaster:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisasters();
  }, []);

  async function fetchDisasters() {
    try {
      const data = await getDisasters();
      setDisasters(data);
    } catch (err) {
      console.error("Error fetching disasters:", err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const tagList = form.tags.split(",").map((tag) => tag.trim());
      await createDisaster({ ...form, tags: tagList });
      setForm({ title: "", description: "", location_name: "", tags: "" });
      fetchDisasters();
    } catch (err) {
      console.error("Error creating disaster:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-4">Create Disaster</h2>
      <form onSubmit={handleSubmit} className="space-y-4 mb-10">
        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Location Name (optional)"
          value={form.location_name}
          onChange={(e) =>
            setForm({ ...form, location_name: e.target.value })
          }
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-2">All Disasters</h2>
      <ul className="space-y-2">
        {disasters.map((dis) => (
          <li key={dis.id} className="p-4 bg-gray-900 rounded shadow">
            <p className="font-bold text-blue-500">{dis.title}</p>
            <p>{dis.description}</p>
            <p className="text-sm text-gray-400">
              Location: {dis.location_name}
            </p>
            <p className="text-sm text-gray-400">
              Tags: {dis.tags?.join(", ")}
            </p>
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => handleEdit(dis)}
                className="text-yellow-500 hover:text-yellow-700 transition text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(dis.id)}
                className="text-red-600 hover:text-red-800 transition text-sm"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Update Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 px-4">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-lg shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-4">
              Edit Disaster
            </h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={editForm.title}
                disabled
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                className="w-full p-2 border rounded bg-gray-800 text-white cursor-not-allowed opacity-70"
                required
              />
              <textarea
                placeholder="Description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                className="w-full p-2 border rounded bg-gray-800 text-white"
                required
              />
              <input
                type="text"
                placeholder="Location Name"
                value={editForm.location_name}
                disabled
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    location_name: e.target.value,
                  })
                }
                className="w-full p-2 border rounded bg-gray-800 text-white cursor-not-allowed opacity-70"
              />
              <input
                type="text"
                placeholder="Tags"
                value={editForm.tags}
                onChange={(e) =>
                  setEditForm({ ...editForm, tags: e.target.value })
                }
                className="w-full p-2 border rounded bg-gray-800 text-white"
              />
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
