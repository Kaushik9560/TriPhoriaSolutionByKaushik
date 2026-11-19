import { randomUUID } from 'node:crypto';
import { Client, Connection } from '@temporalio/client';
import { createApp } from './app';
import { createStore } from './store';
import type { hotelWorkflow } from './workflows';

async function main() {
  const connection = await Connection.connect({ address: process.env.TEMPORAL_ADDRESS || 'localhost:7233' });
  const client = new Client({ connection });
  const store = createStore();
  await store.redis.connect();
  const app = createApp(async (city, min, max) => {
    const hotels = await client.workflow.execute<typeof hotelWorkflow>('hotelWorkflow', {
      taskQueue: 'hotel-offers',
      workflowId: `hotels-${randomUUID()}`,
      workflowExecutionTimeout: '20 seconds',
      args: [city]
    });
    return store.saveAndFilter(city, hotels, min, max);
  });
  const server = app.listen(Number(process.env.PORT || 3000), () => console.log('API ready'));
  const shutdown = () => server.close(async () => {
    await store.redis.quit();
    await connection.close();
  });
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

main().catch(error => { console.error(error); process.exit(1); });
