const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  // Static mock posts—adjust as needed
  const mockPosts = [
    {
      user: 'citizen1',
      post: '#floodrelief Need food in ' + (req.query.location || 'affected area'),
      timestamp: new Date().toISOString(),
      type: 'need',
    },
    {
      user: 'volunteer42',
      post: 'Offering shelter near ' + (req.query.location || 'town center'),
      timestamp: new Date().toISOString(),
      type: 'offer',
    },
    {
      user: 'alert_bot',
      post: `#alert Weather worsening—stay safe!`,
      timestamp: new Date().toISOString(),
      type: 'alert',
    },
  ];
  res.json({ posts: mockPosts });
});

module.exports = router;
