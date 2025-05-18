import express from 'express';
import { enhanceEmail } from '../services/aiService.js';

const router = express.Router();

router.post('/enhance', async (req, res) => {
  try {
    const { content, tone, targetWords, inputType, enforceExactWordCount } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!targetWords || targetWords < 1) {
      return res.status(400).json({ error: 'Invalid target word count' });
    }

    const result = await enhanceEmail({
      content,
      tone,
      targetWords,
      inputType,
      enforceExactWordCount
    });

    res.json(result);
  } catch (error) {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      res.status(401).json({ 
        error: 'Invalid API key. Please check your OpenAI API key configuration.'
      });
    } else if (error.response?.status === 429) {
      res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again in a moment.' 
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Failed to enhance content. Please try again.' 
      });
    }
  }
});

export const enhanceEmailRoute = router;