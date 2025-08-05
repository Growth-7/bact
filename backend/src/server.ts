import express from 'express';

const app = express();
const port = process.env.PORT || 3333;

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
