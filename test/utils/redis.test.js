/* eslint-disable no-unused-expressions */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/prefer-expect-assertions */
import { expect } from 'chai';
import redisClient from '../../utils/redis';

describe('redisClient', () => {
  it('redisClient is Alive', () => {
    expect(redisClient.isAlive()).to.equal(true);
  });

  it('set value', async () => {
    await redisClient.set('test', 'redis', 25);
    expect(await redisClient.get('test')).to.equal('redis');
  });

  it('get a value', async () => {
    await redisClient.set('test_test', 'redis_redis', 25);
    expect(await redisClient.get('test')).to.not.equal('redis_redis');
  });

  it('delete a value', async () => {
    await redisClient.del('test_test');
    expect(await redisClient.get('test_test')).to.be.null;
  });
});
