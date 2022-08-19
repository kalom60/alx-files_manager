import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const headerAuth = req.header('Authorization') || null;
    if (headerAuth === null) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const loginInfo = Buffer.from(headerAuth.split(' ')[1], 'base64').toString(
      // eslint-disable-next-line comma-dangle
      'utf8'
    );
    const [email, password] = loginInfo.split(':');
    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.db.collection('users').findOne({
      email,
      password: sha1(password),
    });

    if (user) {
      const uuid = uuidv4();
      const key = `auth_${uuid}`;
      await redisClient.set(key, user._id.toString(), 86400);
      return res.status(200).json({ token: uuid });
    }

    return res.status(401).json({ error: 'Unauthorized' });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token') || null;
    if (token === null) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const user = await redisClient.get(key);
    if (user) {
      await redisClient.del(key);
      return res.status(204).send();
    }

    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export default AuthController;
