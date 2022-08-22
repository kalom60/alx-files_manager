import { ObjectId } from 'mongodb';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dbClient from '../utils/db';
import FileClient from '../utils/file';

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
    delete Data.localPath;
    delete Data._id;
    res.setHeader('Content-Type', 'application/json');
    return res.status(201).json(Data);
  }
}

export default FilesController;
