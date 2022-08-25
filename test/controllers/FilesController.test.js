/* eslint-disable comma-dangle */
/* eslint-disable no-undef */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/no-test-callback */
/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable jest/lowercase-name */
import request from 'request';
import { expect } from 'chai';
import fs from 'fs';
import dbClient from '../../utils/db';

const url = 'http://0.0.0.0:5000';
const fsPromises = fs.promises;
let token;
let parent;
let someTxtId;
let readTxtId;

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
  Promise.all([dbClient.db.collection('files').deleteMany({})]);
}

describe('POST: /files', () => {
  before(async (done) => {
    if (fs.existsSync('/tmp/files_manager')) {
      fsPromises.rmdir('/tmp/files_manager', { recursive: true }, (err) => {
        if (err) {
          done(err);
        }
      });
    }
    delMongo();
    connect();
    done();
  });

  it('without a token', (done) => {
    request.post(`${url}/files`, (err, res, data) => {
      expect(res.statusCode).to.equal(401);
      expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('with wrong token', (done) => {
    const option = {
      method: 'POST',
      url: `${url}/files`,
      headers: {
        'X-Token': 'sdjfhfr8fhrejfira',
      },
    };
    request(option, (err, res, data) => {
      expect(res.statusCode).to.equal(401);
      expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('with a token without a name', (done) => {
    const option = {
      method: 'POST',
      url: `${url}/files`,
      headers: {
        'X-Token': token,
      },
      form: {
        type: 'folder',
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(400);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Missing name' });
      done();
    });
  });

  it('with a token without a type', (done) => {
    const option = {
      method: 'POST',
      url: `${url}/files`,
      headers: {
        'X-Token': token,
      },
      form: {
        name: 'images',
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(400);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Missing type' });
      done();
    });
  });

  it('with a token with a type d/t than folder, file, image', (done) => {
    const option = {
      method: 'POST',
      url: `${url}/files`,
      headers: {
        'X-Token': token,
      },
      form: {
        name: 'images',
        type: 'video',
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(400);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Missing type' });
      done();
    });
  });

  it('with a token for folder', (done) => {
    const option = {
      method: 'POST',
      url: `${url}/files`,
      headers: {
        'X-Token': token,
      },
      form: {
        name: 'images',
        type: 'folder',
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      parent = JSON.parse(body).id;
      expect(res.statusCode).to.equal(201);
      expect(JSON.parse(body).name).to.equal('images');
      done();
    });
  });

  it('with a token for file without a data', (done) => {
    const option = {
      method: 'POST',
      url: `${url}/files`,
      headers: {
        'X-Token': token,
      },
      form: {
        name: 'images',
        type: 'file',
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(400);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Missing data' });
      done();
    });
  });

  it('with a token for file without parentId', (done) => {
    const option = {
      method: 'POST',
      url: `${url}/files`,
      headers: {
        'X-Token': token,
      },
      form: {
        name: 'read.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      readTxtId = JSON.parse(body).id;
      expect(res.statusCode).to.equal(201);
      expect(JSON.parse(body).name).to.equal('read.txt');
      done();
    });
  });

  it('with a token for file with parentId', (done) => {
    const option = {
      method: 'POST',
      url: `${url}/files`,
      headers: {
        'X-Token': token,
      },
      form: {
        name: 'some.txt',
        type: 'file',
        data: 'd2l0aCBwYXJlbnRJZA==',
        parentId: parent,
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      someTxtId = JSON.parse(body).id;
      expect(res.statusCode).to.equal(201);
      expect(JSON.parse(body).name).to.equal('some.txt');
      done();
    });
  });

  it('with a token for file with parentId but parent not folder', (done) => {
    const option = {
      method: 'POST',
      url: `${url}/files`,
      headers: {
        'X-Token': token,
      },
      form: {
        name: 'none.txt',
        type: 'file',
        data: 'd2l0aCBwYXJlbnRJZA==',
        parentId: someTxtId,
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(400);
      expect(JSON.parse(body)).to.deep.equal({
        error: 'Parent is not a folder',
      });
      done();
    });
  });

  it('with a token for file with wrong parentId', (done) => {
    const option = {
      method: 'POST',
      url: `${url}/files`,
      headers: {
        'X-Token': token,
      },
      form: {
        name: 'miss.txt',
        type: 'file',
        data: 'd2l0aCBwYXJlbnRJZA==',
        parentId: '6306c0e720d23b7f89f0c333',
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(400);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Parent not found' });
      done();
    });
  });
});

describe('GET: /files/:id', () => {
  it('without a token', (done) => {
    request.get(`${url}/files/${someTxtId}`, (err, res, data) => {
      expect(res.statusCode).to.equal(401);
      expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('with wrong token', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/files/${someTxtId}`,
      headers: {
        'X-Token': 'sdjfhfr8fhrejfira',
      },
    };
    request(option, (err, res, data) => {
      expect(res.statusCode).to.equal(401);
      expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('with a token', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/files/${someTxtId}`,
      headers: {
        'X-Token': token,
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(200);
      expect(JSON.parse(body).docs.id).to.equal(someTxtId);
      done();
    });
  });

  it('with a token but wrong id', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/files/dsafd8afd89f`,
      headers: {
        'X-Token': token,
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(404);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Not found' });
      done();
    });
  });
});

describe('GET: /files', () => {
  it('without a token', (done) => {
    request.get(`${url}/files`, (err, res, data) => {
      expect(res.statusCode).to.equal(401);
      expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('with wrong token', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/files`,
      headers: {
        'X-Token': 'sdjfhfr8fhrejfira',
      },
    };
    request(option, (err, res, data) => {
      expect(res.statusCode).to.equal(401);
      expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('with a token but no parentId', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/files`,
      headers: {
        'X-Token': token,
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(200);
      expect(JSON.parse(body).docs.length).to.be.equal(3);
      done();
    });
  });

  it('with a token and page query but no parentId', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/files?page=${2}`,
      headers: {
        'X-Token': token,
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(200);
      expect(body.length).to.be.greaterThan(1);
      done();
    });
  });

  it('with a token and parentId', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/files?parentId=${someTxtId}`,
      headers: {
        'X-Token': token,
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(200);
      expect(JSON.parse(body).docs.length).to.equal(0);
      done();
    });
  });
});

describe('PUT: /files/:id/publish', () => {
  it('without a token', (done) => {
    request.put(`${url}/files/${someTxtId}/publish`, (err, res, data) => {
      expect(res.statusCode).to.equal(401);
      expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('with wrong token', (done) => {
    const option = {
      method: 'PUT',
      url: `${url}/files/${someTxtId}/publish`,
      headers: {
        'X-Token': 'sdjfhfr8fhrejfira',
      },
    };
    request(option, (err, res, data) => {
      expect(res.statusCode).to.equal(401);
      expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('with a token and id', (done) => {
    const option = {
      method: 'PUT',
      url: `${url}/files/${someTxtId}/publish`,
      headers: {
        'X-Token': token,
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(200);
      expect(JSON.parse(body).docs.isPublic).to.equal(true);
      done();
    });
  });

  it('with a token but wrong id', (done) => {
    const option = {
      method: 'PUT',
      url: `${url}/files/6306bc55f3e09073ffb09333/publish`,
      headers: {
        'X-Token': token,
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(404);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Not found' });
      done();
    });
  });
});

describe('PUT: /files/:id/unpublish', () => {
  it('without a token', (done) => {
    request.put(`${url}/files/${someTxtId}/unpublish`, (err, res, data) => {
      expect(res.statusCode).to.equal(401);
      expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('with wrong token', (done) => {
    const option = {
      method: 'PUT',
      url: `${url}/files/${someTxtId}/unpublish`,
      headers: {
        'X-Token': 'sdjfhfr8fhrejfira',
      },
    };
    request(option, (err, res, data) => {
      expect(res.statusCode).to.equal(401);
      expect(JSON.parse(data)).to.deep.equal({ error: 'Unauthorized' });
      done();
    });
  });

  it('with a token but wrong id', (done) => {
    const option = {
      method: 'PUT',
      url: `${url}/files/6306bc55f3e09073ffb09333/unpublish`,
      headers: {
        'X-Token': token,
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(404);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Not found' });
      done();
    });
  });

  it('with a token and id', (done) => {
    const option = {
      method: 'PUT',
      url: `${url}/files/${someTxtId}/unpublish`,
      headers: {
        'X-Token': token,
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(200);
      expect(JSON.parse(body).docs.isPublic).to.equal(false);
      done();
    });
  });
});

describe('GET: /files/:id/data', () => {
  it('without a token for file', (done) => {
    request.get(`${url}/files/${someTxtId}/data`, (err, res, data) => {
      expect(res.statusCode).to.equal(404);
      expect(JSON.parse(data)).to.deep.equal({ error: 'Not found' });
      done();
    });
  });

  it('without a token for folder', (done) => {
    request.get(`${url}/files/${parent}/data`, (err, res, data) => {
      expect(res.statusCode).to.equal(400);
      expect(JSON.parse(data)).to.deep.equal({
        error: "A folder doesn't have content",
      });
      done();
    });
  });

  it('with wrong token file', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/files/${someTxtId}/data`,
      headers: {
        'X-Token': 'sdjfhfr8fhrejfira',
      },
    };
    request(option, (err, res, data) => {
      expect(res.statusCode).to.equal(404);
      expect(JSON.parse(data)).to.deep.equal({ error: 'Not found' });
      done();
    });
  });

  it('with wrong token folder', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/files/${parent}/data`,
      headers: {
        'X-Token': 'sdjfhfr8fhrejfira',
      },
    };
    request(option, (err, res, data) => {
      expect(res.statusCode).to.equal(400);
      expect(JSON.parse(data)).to.deep.equal({
        error: "A folder doesn't have content",
      });
      done();
    });
  });

  it('with a token but wrong id', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/files/6306bc55f3e09073ffb09333/data`,
      headers: {
        'X-Token': token,
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(404);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Not found' });
      done();
    });
  });

  it('without a token and id and type file and not public', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/files/${readTxtId}/data`,
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(404);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Not found' });
      done();
    });
  });

  it('without a token and id and type folder and not public', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/files/${parent}/data`,
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(400);
      expect(JSON.parse(body)).to.deep.equal({
        error: "A folder doesn't have content",
      });
      done();
    });
  });

  it('with a token and id and type file', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/files/${readTxtId}/data`,
      headers: {
        'X-Token': token,
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(200);
      expect(res.headers['content-type']).to.contain('text/plain');
      expect(JSON.parse(JSON.stringify(body))).to.deep.equal(
        'Hello Webstack!\n'
      );
      done();
    });
  });

  it('with a token and id and type folder', (done) => {
    const option = {
      method: 'GET',
      url: `${url}/files/${parent}/data`,
      headers: {
        'X-Token': token,
      },
    };
    request(option, (err, res, body) => {
      if (err) {
        done(err);
      }
      expect(res.statusCode).to.equal(404);
      expect(JSON.parse(body)).to.deep.equal({ error: 'Not found' });
      done();
    });
  });
});
