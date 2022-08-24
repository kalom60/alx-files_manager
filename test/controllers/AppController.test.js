/* eslint-disable jest/no-test-callback */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable jest/lowercase-name */
/* eslint-disable no-undef */
import request from 'request';
import { expect } from 'chai';
import dbClient from '../../utils/db';

describe('appController', () => {
  before((done) => {
    Promise.all([
      dbClient.db.collection('files').deleteMany({}),
      dbClient.db.collection('users').deleteMany({}),
    ])
      .then(() => done())
      .catch((err) => done(err));
  });

  const url = 'http://0.0.0.0:5000';

  it('GET: /status', (done) => {
    request.get(`${url}/status`, (err, res, data) => {
      expect(res.statusCode).to.equal(200);
      expect(JSON.parse(data)).to.deep.equal({ redis: true, db: true });
      done();
    });
  });

  it('GET: /stats', (done) => {
    request.get(`${url}/stats`, (err, res, data) => {
      expect(res.statusCode).to.equal(200);
      expect(JSON.parse(data)).to.deep.equal({ usersNB: 0, filesNB: 0 });
      done();
    });
  });
});
