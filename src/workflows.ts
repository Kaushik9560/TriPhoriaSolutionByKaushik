import { ApplicationFailure, log, proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';
import { bestOffers } from './hotels';

const { fetchHotels } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 seconds',
  retry: { maximumAttempts: 2, initialInterval: '1 second' }
});

export async function hotelWorkflow(city: string) {
  const results = await Promise.allSettled([fetchHotels('A', city), fetchHotels('B', city)]);
  const offers = results.flatMap(result => {
    if (result.status === 'fulfilled') return result.value;
    log.warn('A supplier is unavailable', { error: String(result.reason) });
    return [];
  });
  if (results.every(result => result.status === 'rejected')) {
    throw ApplicationFailure.nonRetryable('Both suppliers are unavailable');
  }
  return bestOffers(offers);
}
