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

const user = {
  email: 'test@test.com',
  password: 'password',
};

// const connect = () => {
//   const basic = Buffer.from(`${user.email}:${user.password}`).toString(
//     'base64'
//   );
//   const auth = `Basic ${basic}`;

//   request.get(
//     `${url}/connect`,
//     {
//       headers: {
//         Authorization: auth,
//       },
//     },
//     (error, response, body) => {
//       const tokenId = JSON.parse(body).token;
//       return tokenId;
//     }
//   );
// };

describe('POST: /users', () => {
  before((done) => {
    Promise.all([
      dbClient.db.collection('files').deleteMany({}),
      dbClient.db.collection('users').deleteMany({}),
    ])
      .then(() => done())
      .catch((err) => done(err));
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
  //   after((done) => {
  //     request.get(`${url}/disconnect`, { headers: { token: connect() } });
  //     done();
  //   });

  it('without a token', (done) => {
    request.get(`${url}/users/me`, (err, res, data) => {
      expect(res.statusCode).to.equal(401);
      expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  //   it('with a token', (done) => {
  //     request.get(
  //       `${url}/users/me`,
  //       {
  //         headers: {
  //           'X-Token': 'connect()',
  //         },
  //       },
  //       (err, res, data) => {
  //         expect(res.statusCode).to.equal(200);
  //         expect(data.email).to.equal(user.email);
  //         expect(data.id.length).to.be.greaterThan(0);
  //         done();
  //       }
  //     );
  //   });
});
