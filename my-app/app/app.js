const express = require('express');
const cors = require('cors');
const app = express();
const port = 3456; // 修改为不太常用的端口

// 配置 CORS 中间件
app.use(cors({
    origin: ['http://localhost:3000', 'http://121.40.80.144:3000'], // 允许的前端域名
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
    credentials: true // 允许携带凭证
}));

app.use(express.json());

// 添加错误处理中间件
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 使用路由
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/articles', articleRoutes);
app.get('/', (req, res) => {
    res.send('Welcome to the Hospital API!');
});

// 添加健康检查端点
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening at http://0.0.0.0:${port}`);
}); 