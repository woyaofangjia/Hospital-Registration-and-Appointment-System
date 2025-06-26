// app.js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctor');
const departmentRoutes = require('./routes/department');
const appointmentRoutes = require('./routes/appointment');
const doctorScheduleRoutes = require('./routes/doctorSchedule');
const articleRoutes = require('./routes/article');
const verifyToken = require('./middleware/auth');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());

app.use(express.json());

// 配置 body-parser 中间件
app.use(bodyParser.json()); // 解析 application/json 类型的请求体
app.use(bodyParser.urlencoded({ extended: true })); // 解析 application/x-www-form-urlencoded 类型的请求体


app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api', appointmentRoutes); // 修改为挂载到 /api 路径下
app.use('/api/doctorSchedules', doctorScheduleRoutes);
app.use('/api/articles', articleRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Hospital API!');
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app; // 导出 app 实例