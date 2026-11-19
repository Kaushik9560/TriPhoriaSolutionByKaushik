import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';

async function main() {
  const connection = await NativeConnection.connect({ address: process.env.TEMPORAL_ADDRESS || 'localhost:7233' });
  try {
    const worker = await Worker.create({
      connection,
      taskQueue: 'hotel-offers',
      workflowsPath: require.resolve('./workflows'),
      activities
    });
    await worker.run();
  } finally {
    await connection.close();
  }
}

main().catch(error => { console.error(error); process.exit(1); });
