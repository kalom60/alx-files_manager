import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(req, res) {
    if (redisClient.isAlive() && dbClient.isAlive()) {
      res.status(200).json({ redis: true, db: true });
    }
  }

  static async getStats(req, res) {
    const filesNB = await dbClient.nbFiles();
    const usersNB = await dbClient.nbUsers();
    res.status(200).json({ usersNB, filesNB });
  }
}

export default AppController;
