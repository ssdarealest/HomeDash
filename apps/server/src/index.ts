import { createApp } from './app';

const app = createApp();
const port = parseInt(process.env.PORT || '3000', 10);

console.log(`[Family OS] Backend API server running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
