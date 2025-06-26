const request = require('supertest');
const express = require('express'); // 导入 express
const app = require('../index.js'); // 导入 app (Express 实例)
const pool = require('../config/db');

describe('Auth API Endpoints', () => {
  let server;
  let expressApp; // 用于测试的 Express 实例

  beforeAll(async () => {
    expressApp = express(); // 创建 Express 实例
    expressApp.use(express.json()); // 解析 JSON 请求体
    expressApp.use('/api/auth', require('../routes/auth')); // 挂载路由

    // 启动服务器
    await new Promise(resolve => {
      server = expressApp.listen(3001, () => { // 使用不同的端口，避免冲突
        console.log('Test server started on port 3001');
        resolve();
      });
    });

    // 连接到测试数据库
    // await pool.getConnection(); // 获取数据库连接 (getConnection 方法在 pool 上不需要直接调用)
    // 清空用户表（可选，但建议在测试前清理）
    await pool.query('DELETE FROM users');
  });

  afterAll(async () => {
    // 关闭数据库连接
    await pool.end();
    // 关闭服务器
    await new Promise(resolve => {
      server.close(resolve);
    });
  });

  it('should register a new user', async () => {
    const newUser = {
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
    };

    const response = await request(expressApp) // 使用 expressApp
      .post('/api/auth/register')
      .send(newUser);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('注册成功');
    expect(response.body.userId).toBeDefined();

    const [user] = await pool.query('SELECT * FROM users WHERE username = ?', [newUser.username]);
    expect(user.length).toBe(1);
    expect(user[0].username).toBe(newUser.username);
  });

  it('should not register with existing username', async () => {
    const newUser = {
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
    };

    const response = await request(expressApp) // 使用 expressApp
      .post('/api/auth/register')
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('用户名已存在');
  });

  it('should not register with invalid username or password format', async () => {
    const newUser = {
      username: 'te', // 用户名太短 (2 个字符)
      password: 'pass', // 密码太短 (4 个字符)
      email: 'test@example.com',
    };

    const response = await request(expressApp)
      .post('/api/auth/register')
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('用户名或密码格式错误');
  });

  it('should login with correct username and password', async () => {
    const userCredentials = {
      username: 'testuser',
      password: 'password123',
    };

    const response = await request(expressApp) // 使用 expressApp
      .post('/api/auth/login')
      .send(userCredentials);

    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.id).toBeDefined();
    expect(response.body.user.username).toBe('testuser');
    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.token).toBeDefined();
  });

  it('should not login with incorrect username or password', async () => {
    const invalidCredentials = {
      username: 'testuser',
      password: 'wrongpassword',
    };

    const response = await request(expressApp) // 使用 expressApp
      .post('/api/auth/login')
      .send(invalidCredentials);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('密码错误');
  });

  it('should not login with non-existing username', async () => {
    const invalidCredentials = {
      username: 'nonexistinguser',
      password: 'password123',
    };

    const response = await request(expressApp) // 使用 expressApp
      .post('/api/auth/login')
      .send(invalidCredentials);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('用户名不存在');
  });

  it('should check authentication status with valid token', async () => {
    const newUser = {
      username: 'testuser_check',
      password: 'password123',
      email: 'test_check@example.com',
    };

    await request(expressApp) // 使用 expressApp
      .post('/api/auth/register')
      .send(newUser);

    const loginResponse = await request(expressApp) // 使用 expressApp
      .post('/api/auth/login')
      .send({ username: newUser.username, password: newUser.password });

    const token = loginResponse.body.token;

    const checkResponse = await request(expressApp) // 使用 expressApp
      .get('/api/auth/check')
      .set('Authorization', token);

    expect(checkResponse.status).toBe(200);
    expect(checkResponse.body.message).toBe('已认证');
  });

  it('should not check authentication status without token', async () => {
    const checkResponse = await request(expressApp) // 使用 expressApp
      .get('/api/auth/check');

    expect(checkResponse.status).toBe(401);
    expect(checkResponse.body.message).toBe('未认证');
  });
});