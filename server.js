import express from 'express';
import router from './routes';

const port = process.env.PORT || 5000;

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(router);

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
