import express from 'express';
console.log('Express imported');
const app = express();
console.log('App created');
const PORT = 3005;
app.listen(PORT, () => {
  console.log('Server listening on ' + PORT);
  process.exit(0);
});
