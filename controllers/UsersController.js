import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const userExist = await dbClient.db
      .collection('users')
      .find({ email })
      .toArray();

    if (userExist.length === 0) {
      const newUser = await dbClient.db
        .collection('users')
        .insertOne({ email, password: sha1(password) });
      return res
        .status(201)
        .json({ id: newUser.ops[0]._id, email: newUser.ops[0].email });
    }
    return res.status(400).json({ error: 'Already exist' });
  }

  static async getMe(req, res) {
    const token = req.header('X-Token') || null;
    if (token === null) {
      res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const user = await redisClient.get(key);
    const result = await dbClient.db.collection('users').findOne({
      _id: ObjectId(user),
    });
    if (result) {
      return res.status(200).json({ id: user, email: result.email });
    }

    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export default UsersController;
