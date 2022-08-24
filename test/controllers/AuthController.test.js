/* eslint-disable jest/valid-expect */
/* eslint-disable comma-dangle */
/* eslint-disable jest/no-test-callback */
/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable jest/lowercase-name */
import { expect } from 'chai';
import request from 'request';

const url = 'http://0.0.0.0:5000';
let tokenId;

const user = {
  email: 'test@test.com',
  password: 'password',
};

describe('GET: /connect', () => {
  it('without authorization in the header', (done) => {
    request.get(`${url}/connect`, (err, res, data) => {
      expect(res.statusCode).to.equal(401);
      expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('wrong email', (done) => {
    const basic = Buffer.from(`user:${user.password}`).toString('base64');
    const auth = `Basic ${basic}`;
    request.get(
      `${url}/connect`,
      { header: { Authorization: auth } },
      (err, res, data) => {
        expect(res.statusCode).to.equal(401);
        expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
        done();
      }
    );
  });

  it('wrong password', (done) => {
    const basic = Buffer.from(`${user.email}:something`).toString('base64');
    const auth = `Basic ${basic}`;
    request.get(
      `${url}/connect`,
      { header: { Authorization: auth } },
      (err, res, data) => {
        expect(res.statusCode).to.equal(401);
        expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
        done();
      }
    );
  });

  it('wrong email and password', (done) => {
    const basic = Buffer.from('user:something').toString('base64');
    const auth = `Basic ${basic}`;
    request.get(
      `${url}/connect`,
      { header: { Authorization: auth } },
      (err, res, data) => {
        expect(res.statusCode).to.equal(401);
        expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
        done();
      }
    );
  });

  it('with Authorization', (done) => {
    const basic = Buffer.from(`${user.email}:${user.password}`).toString(
      'base64'
    );
    const auth = `Basic ${basic}`;
    const option = {
      method: 'GET',
      url: `${url}/connect`,
      headers: {
        Authorization: auth,
      },
    };
    request(option, (err, res, data) => {
      expect(res.statusCode).to.equal(200);
      tokenId = JSON.parse(data).token;
      expect(JSON.parse(data).token.length).to.be.greaterThan(0);
      done();
    });
  });
});

describe('GET: /disconnect', () => {
  it('without token in the header', (done) => {
    request.get(`${url}/disconnect`, (err, res, data) => {
      expect(res.statusCode).to.equal(401);
      expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('wrong token', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/disconnect`,
      headers: {
        'X-Token': 'erueiqr394893rheowfewew',
      },
    };
    request(option, (err, res, data) => {
      expect(res.statusCode).to.equal(401);
      expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('with token', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/disconnect`,
      headers: {
        'X-Token': tokenId,
      },
    };
    request(option, (err, res, data) => {
      expect(res.statusCode).to.equal(204);
      expect(data).to.equal('');
      done();
    });
  });
});
