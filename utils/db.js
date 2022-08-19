import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.post = process.env.DB_PORT || '27017';
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(`mongodb://${this.host}:${this.port}`, {
      useUnifiedTopology: true,
    });
    this.client.connect();
    this.db = this.client.db(this.database);
  }

  // check if the connection to MongoDB is a success
  isAlive() {
    return this.client.isConnected();
  }

  // returns the number of documents in the collection users
  async nbUsers() {
    const userNb = await this.db.collection('users').countDocuments();
    return userNb;
  }

  // returns the number of documents in the collection files
  async nbFiles() {
    const filesNb = await this.db.collection('files').countDocuments();
    return filesNb;
  }
}

const dbClient = new DBClient();

export default dbClient;
