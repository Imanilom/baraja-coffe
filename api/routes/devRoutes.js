// routes/devRoutes.js
import express from 'express';
import { resetMongoSessions } from '../utils/mongoSessionReset.js';

const router = express.Router();

router.post('/reset-sessions', async (req, res) => {
  try {
    // if (process.env.NODE_ENV !== 'development') {
    //   return res.status(403).json({ error: 'Not allowed in production' });
    // }
    
    const result = await resetMongoSessions();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;