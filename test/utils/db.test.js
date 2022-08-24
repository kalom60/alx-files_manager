/* eslint-disable no-undef */
/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable jest/valid-expect */
import { expect } from 'chai';
import dbClinet from '../../utils/db';

describe('dbClient', () => {
  before((done) => {
    Promise.all([
      dbClinet.db.collection('files').deleteMany({}),
      dbClinet.db.collection('users').deleteMany({}),
    ])
      .then(() => done())
      .catch((err) => done(err));
  });

  it('dbClient is Alive', () => {
    expect(dbClinet.isAlive()).to.equal(true);
  });

  it('returns number of users', async () => {
    expect(await dbClinet.nbUsers()).to.equal(0);
  });

  it('returns number of files', async () => {
    expect(await dbClinet.nbFiles()).to.equal(0);
  });
});
