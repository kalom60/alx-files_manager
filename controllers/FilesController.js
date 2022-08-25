import { ObjectId } from 'mongodb';
import mime from 'mime-types';
import fs from 'fs';
import Queue from 'bull';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dbClient from '../utils/db';
import FileClient from '../utils/file';

const fileQueue = new Queue('fileQueue', {
  redis: {
    host: '127.0.0.1',
    port: 6379,
  },
});

class FilesController {
  static async postUpload(req, res) {
    const user = await FileClient.checkUser(req);
    if (user === null) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // eslint-disable-next-line object-curly-newline
    const { name, type, parentId, isPublic, data } = req.body;
    const types = ['folder', 'file', 'image'];

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !types.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    if (parentId) {
      const parent = await dbClient.db
        .collection('files')
        .findOne({ _id: ObjectId(parentId) });
      if (!parent) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parent.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const Data = {
      name,
      type,
      parentId: parentId || 0,
      isPublic: isPublic || false,
      userId: user._id.toString(),
    };

    if (type === 'folder') {
      const result = await dbClient.db.collection('files').insertOne(Data);
      Data.id = result.insertedId.toString();
      delete Data._id;
      res.setHeader('Content-Type', 'application/json');
      return res.status(201).json(Data);
    }

    const localDir = process.env.FOLDER_PATH || '/tmp/files_manager';
    const fileName = uuidv4();
    const filePath = path.join(localDir, fileName);

    Data.localPath = filePath;
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const base64Data = Buffer.from(data, 'base64');
    await fs.promises.writeFile(filePath, base64Data, 'utf-8');
    const result = await dbClient.db.collection('files').insertOne(Data);

    Data.id = result.insertedId.toString();

    if (Data.type === 'image') {
      fileQueue.add({ userId: Data.userId, fileId: Data.id });
    }

    delete Data.localPath;
    delete Data._id;

    res.setHeader('Content-Type', 'application/json');
    return res.status(201).json(Data);
  }

  static async getShow(req, res) {
    const user = await FileClient.checkUser(req);
    if (user === null) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const docs = await dbClient.db
      .collection('files')
      .findOne({ _id: ObjectId(id), userId: user._id.toString });

    if (!docs) return res.status(404).json({ error: 'Not found' });

    docs.id = docs._id;
    delete docs._id;
    delete docs.localPath;

    return res.status(200).json(docs);
  }

  static async getIndex(req, res) {
    const user = await FileClient.checkUser(req);
    if (user === null) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId, page } = req.query;

    const pageNo = page || 1;
    const pageSize = 20;
    const skip = (pageNo - 1) * pageSize;

    const query = !parentId
      ? { userId: user._id.toString() }
      : { userId: user._id.toString(), parentId };

    const data = await dbClient.db
      .collection('files')
      .aggregate([{ $match: query }, { $skip: skip }, { $limit: pageSize }])
      .toArray();

    const docs = data.map((doc) => {
      const newData = {
        ...doc,
        id: doc._id,
      };
      delete newData._id;
      delete newData.localPath;
      return newData;
    });

    return res.status(200).json(docs);
  }

  static async putPublish(req, res) {
    const user = await FileClient.checkUser(req);
    if (user === null) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const docs = await dbClient.db
      .collection('files')
      .findOne({ _id: ObjectId(id), userId: user._id.toString });

    if (!docs) return res.status(404).json('Not found');

    if (docs.isPublic === false) {
      await dbClient.db
        .collection('files')
        .updateOne({ _id: ObjectId(id) }, { $set: { isPublic: true } });
      docs.isPublic = true;
    }

    docs.id = docs._id;
    delete docs._id;
    delete docs.localPath;

    return res.status(200).json(docs);
  }

  static async putUnpublish(req, res) {
    const user = await FileClient.checkUser(req);
    if (user === null) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const docs = await dbClient.db
      .collection('files')
      .findOne({ _id: ObjectId(id), userId: user._id.toString });

    if (!docs) return res.status(404).json('Not found');

    if (docs.isPublic === true) {
      await dbClient.db
        .collection('files')
        .updateOne({ _id: ObjectId(id) }, { $set: { isPublic: false } });
      docs.isPublic = false;
    }

    docs.id = docs._id;
    delete docs._id;
    delete docs.localPath;

    return res.status(200).json(docs);
  }

  static async getFile(req, res) {
    const user = await FileClient.checkUser(req);
    const { id } = req.params;
    const { size } = req.query;
    const docs = await dbClient.db.collection('files').findOne({
      _id: ObjectId(id),
    });

    if (!docs) return res.status(404).json({ error: 'Not found' });

    if (['folder', 'file'].includes(docs.type)) {
      if (
        // eslint-disable-next-line operator-linebreak
        docs.isPublic === false &&
        (!user || docs.userId !== user._id.toString())
      ) {
        if (docs.type === 'folder') {
          console.log('if folder');
          return res
            .status(400)
            .json({ error: "A folder doesn't have content" });
        }

        return res.status(404).json({ error: 'Not found' });
      }
    }
    let localDir;
    if (size && docs.type === 'image') localDir = `${docs.localPath}_${size}`;
    else localDir = docs.localPath;

    if (!fs.existsSync(localDir)) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.set('Content-Type', mime.lookup(docs.name));
    return res.status(200).sendFile(localDir);
  }
}

export default FilesController;
