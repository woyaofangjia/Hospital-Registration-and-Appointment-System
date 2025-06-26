// index.js
const app = require('./app'); // 引入 app 实例
const port = 3001;

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening at http://0.0.0.0:${port}`);
});