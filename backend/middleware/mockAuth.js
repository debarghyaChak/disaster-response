// middleware/mockAuth.js
const users = {
  netrunnerX: { id: "netrunnerX", role: "admin" },
  reliefAdmin: { id: "reliefAdmin", role: "contributor" },
  volunteer123: { id: "volunteer123", role: "contributor" },
  aidWorker01: { id: "aidWorker01", role: "contributor" },
  cityHelper: { id: "cityHelper", role: "contributor" },
  coordinatorZ: { id: "coordinatorZ", role: "admin" }, // Additional admin
};

function mockAuth(req, res, next) {
  const userId = req.header("x-user-id");
  if (!userId || !users[userId]) {
    return res.status(401).json({ error: "Unauthorized: Invalid user" });
  }

  req.user = users[userId];
  next();
}

module.exports = mockAuth;
