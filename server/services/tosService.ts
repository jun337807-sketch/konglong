import { TosClient } from '@volcengine/tos-sdk';

let client: TosClient | null = null;
const BUCKET = 'konglong';

export function getTosClient() {
  if (!client) {
    client = new TosClient({
      accessKeyId: process.env.TOS_ACCESS_KEY_ID || 'AKLTYWU3MDg1NDA1MmYzNGQ4NWEzZmQ2NTI3Yjc3NmIyY2M',
      accessKeySecret: process.env.TOS_ACCESS_KEY_SECRET || 'WWpJeFltWm1aVEJoTkdNMk5HWmlNR0pqWkRZeFl6WXlNelZoTmpoaFl6UQ==',
      region: 'cn-beijing',
      endpoint: 'tos-cn-beijing.volces.com',
    });
  }
  return client;
}

export function getBucketName() {
  return BUCKET;
}
