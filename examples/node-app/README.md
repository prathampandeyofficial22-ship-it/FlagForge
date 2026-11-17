# FlagForge Node.js Example Application

This application demonstrates how an external Node.js backend microservice integrates with the **FlagForge Feature Flag & Release Management Platform** using the `@flagforge/node-sdk`.

---

## 1. Installation & Setup

Install the SDK in your application:

```bash
npm install @flagforge/node-sdk
```

---

## 2. Quick Start Code Example

```typescript
import { FlagForgeClient } from '@flagforge/node-sdk';

// Initialize the client
const flagforge = new FlagForgeClient({
  apiKey: 'ff_server_production_xxxxxxxxxxxxxxxx',
  baseUrl: 'https://api.flagforge.io/api/v1', // or http://localhost:4000/api/v1
  enableLocalCache: true,
  cacheTtlMs: 60000, // 60 seconds local in-memory cache
  timeoutMs: 3000,   // 3 second network timeout fallback
  offlineFallback: {
    'new-checkout': false,
  },
});

// Evaluate a boolean flag
const isEnabled = await flagforge.isEnabled('new-checkout', {
  key: 'user_12345',
  attributes: {
    country: 'CA',
    plan: 'enterprise',
    email: 'alice@acme.com',
  },
});

if (isEnabled) {
  // Execute feature code
} else {
  // Execute fallback code
}
```

---

## 3. Running the Example App Locally

```bash
# In the FlagForge repository root:
npm install
npm run build:sdk

# Start the example application:
npm run dev --workspace=flagforge-example-node-app
```

Then query the endpoints:
- `http://localhost:3001/checkout?userId=user_10&country=CA`
- `http://localhost:3001/evaluate-feature?flag=new-checkout&userId=user_42`
- `http://localhost:3001/user-features?userId=user_99`
