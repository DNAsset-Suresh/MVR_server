import { app } from './app.js';

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`[InspireUp Server] running on http://localhost:${PORT}`);
  console.log(`[InspireUp Server] Health check: http://localhost:${PORT}/api/health`);
  console.log(`[InspireUp Server] Assistant Health: http://localhost:${PORT}/api/assistant/health`);
});

export default server;
