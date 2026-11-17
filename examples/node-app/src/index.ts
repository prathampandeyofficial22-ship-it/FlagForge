import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { FlagForgeClient } from '@flagforge/node-sdk';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// 1. Initialize FlagForge Client with Environment SDK Key
const flagforge = new FlagForgeClient({
  apiKey: process.env.FLAGFORGE_API_KEY || 'ff_server_dev_mock_key',
  baseUrl: process.env.FLAGFORGE_BASE_URL || 'http://localhost:4000/api/v1',
  enableLocalCache: true,
  cacheTtlMs: 30000, // 30 seconds
  timeoutMs: 2500,
  offlineFallback: {
    'ai-recommendations': false,
    'new-checkout': false,
  },
});

app.use(express.json());

// Health route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'example-node-service' });
});

// Feature Flagged Checkout Route
app.get('/checkout', async (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'anon_user';
  const plan = (req.query.plan as string) || 'free';
  const country = (req.query.country as string) || 'US';

  // Evaluate feature flag for this user
  const isNewCheckoutEnabled = await flagforge.isEnabled('new-checkout', {
    key: userId,
    attributes: { plan, country },
  });

  if (isNewCheckoutEnabled) {
    res.json({
      flow: 'modern-v2',
      message: 'Serving modern streamlined checkout experience (FlagForge rollout)',
      userId,
    });
  } else {
    res.json({
      flow: 'legacy-v1',
      message: 'Serving standard legacy checkout experience',
      userId,
    });
  }
});

// Detailed Flag Evaluation with Reason & Metadata
app.get('/evaluate-feature', async (req: Request, res: Response) => {
  const flagKey = (req.query.flag as string) || 'ai-recommendations';
  const userId = (req.query.userId as string) || 'user_123';
  const email = (req.query.email as string) || 'user@example.com';
  const country = (req.query.country as string) || 'CA';

  const evaluation = await flagforge.evaluate(flagKey, {
    key: userId,
    attributes: { email, country },
  });

  res.json({
    result: evaluation,
    meta: {
      explanation: `Flag evaluated via FlagForge SDK with reason: ${evaluation.reason}`,
    },
  });
});

// Batch Features Route
app.get('/user-features', async (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'user_777';

  const features = await flagforge.evaluateBatch(['new-checkout', 'ai-recommendations'], {
    key: userId,
  });

  res.json({
    userId,
    features,
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Example Node.js app running at http://localhost:${port}`);
    console.log(`Try evaluating: http://localhost:${port}/checkout?userId=user_10&country=CA`);
  });
}

export default app;
