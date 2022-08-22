import { ObjectId } from 'mongodb';
import redisClient from './redis';
import dbClient from './db';

class FileClient {
  static async checkUser(req) {
    const token = req.header('X-Token') || null;
    if (token !== null) {
      const key = `auth_${token}`;
      const user = await redisClient.get(key);
      const result = await dbClient.db.collection('users').findOne({
        _id: ObjectId(user),
      });
      if (result) {
        return result;
      }
      return null;
    }
    return token;
  }
}

export default FileClient;
