import { preview } from 'astro';

// The API stays in the foreground even when Astro detects an agent environment.
const server = await preview({ server: { host: '127.0.0.1', port: 4322 } });
await server.closed();
