/* eslint-disable comma-dangle */
/* eslint-disable jest/no-test-callback */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable no-undef */
/* eslint-disable jest/lowercase-name */
import { expect } from 'chai';
import request from 'request';
import dbClient from '../../utils/db';

const url = 'http://0.0.0.0:5000';
let token;

const user = {
  email: 'test@test.com',
  password: 'password',
};

function connect() {
  const basic = Buffer.from(`${user.email}:${user.password}`).toString(
    'base64'
  );
  const auth = `Basic ${basic}`;
  const options = {
    method: 'GET',
    url: `${url}/connect`,
    headers: {
      Authorization: auth,
    },
  };
  request(options, (err, res, data) => {
    token = JSON.parse(data).token;
    console.log(token);
  });
}

function delMongo() {
  Promise.all([
    dbClient.db.collection('files').deleteMany({}),
    dbClient.db.collection('users').deleteMany({}),
  ]);
}

describe('POST: /users', () => {
  before(async (done) => {
    delMongo();
    done();
  });

  after(async (done) => {
    connect();
    done();
  });

  it('without an email', (done) => {
    request.post(
      `${url}/users`,
      { json: { password: 'password' } },
      (err, res, data) => {
        expect(res.statusCode).to.equal(400);
        expect(JSON.parse(JSON.stringify(data))).to.deep.equal({
          error: 'Missing email',
        });
        done();
      }
    );
  });

  it('without a password', (done) => {
    request.post(
      `${url}/users`,
      { json: { email: 'test@test.com' } },
      (err, res, data) => {
        expect(res.statusCode).to.equal(400);
        expect(JSON.parse(JSON.stringify(data))).to.deep.equal({
          error: 'Missing password',
        });
        done();
      }
    );
  });

  it('create a user', (done) => {
    request.post(`${url}/users`, { json: user }, (err, res, data) => {
      expect(res.statusCode).to.equal(201);
      expect(data.email).to.equal(user.email);
      expect(data.id.length).to.be.greaterThan(0);
      done();
    });
  });

  it('when a user exists', (done) => {
    request.post(`${url}/users`, { json: user }, (err, res, data) => {
      expect(res.statusCode).to.equal(400);
      expect(JSON.parse(JSON.stringify(data))).to.deep.equal({
        error: 'Already exist',
      });
      done();
    });
  });
});

describe('GET: /users/me', () => {
  // before(async (done) => {
  //   connect();
  //   done();
  // });

  it('without a token', (done) => {
    request.get(`${url}/users/me`, (err, res, body) => {
      expect(res.statusCode).to.equal(401);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('with a token', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/users/me`,
      headers: {
        'X-Token': token,
      },
    };
    request(option, (err, res, body) => {
      expect(res.statusCode).to.equal(200);
      expect(JSON.parse(body).email).to.equal(user.email);
      done();
    });
  });
});
