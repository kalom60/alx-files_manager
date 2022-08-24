/* eslint-disable no-undef */
/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable jest/valid-expect */
import { expect } from 'chai';
import dbClient from '../../utils/db';

describe('dbClient', () => {
  before((done) => {
    Promise.all([
      dbClient.db.collection('files').deleteMany({}),
      dbClient.db.collection('users').deleteMany({}),
    ])
      .then(() => done())
      .catch((err) => done(err));
  });

  it('dbClient is Alive', () => {
    expect(dbClient.isAlive()).to.equal(true);
  });

  it('returns number of users', async () => {
    expect(await dbClient.nbUsers()).to.equal(0);
  });

  it('returns number of files', async () => {
    expect(await dbClient.nbFiles()).to.equal(0);
  });
});
