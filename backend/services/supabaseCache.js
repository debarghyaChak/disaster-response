const supabase = require("./supabase"); // ✅ Add this line

async function getCache(key) {
  const { data, error } = await supabase
    .from("cache")
    .select("value")
    .eq("key", key)
    .single();

  if (error || !data) return null;

  try {
    return JSON.parse(data.value);
  } catch (err) {
    return data.value;
  }
}

async function setCache(key, value) {
  const stringValue = JSON.stringify(value);

  const { error } = await supabase
    .from("cache")
    .upsert([{ key, value: stringValue }]);

  if (error) console.error("Cache set error:", error.message);
}

module.exports = { getCache, setCache };
