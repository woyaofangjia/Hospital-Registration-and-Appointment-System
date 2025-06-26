const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const userModel = require('../models/user');
const config = require('../config.json'); // 引入配置文件
const verifyToken = require('../middleware/auth'); // 引入中间件

// 注册
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  // 验证用户名和密码格式
  if (!username || !password || username.length < 4 || username.length > 16 || password.length < 8) {
    return res.status(400).json({ message: '用户名或密码格式错误' });
  }

  try {
    // 检查用户名是否已存在
    const existingUser = await userModel.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 创建新用户
    const userId = await userModel.createUser(username, password, email);
    if (!userId) {
      return res.status(500).json({ message: '注册失败' });
    }

    // 返回成功响应
    res.status(201).json({ message: '注册成功', userId: userId });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ message: '注册失败' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await userModel.getUserByUsername(username);

    if (!user) {
      return res.status(401).json({ message: '用户名不存在' });
    }

    // 验证密码
    if (user.password !== password) {
      return res.status(401).json({ message: '密码错误' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    // 从配置文件获取密钥
    const secretKey = config.jwtSecretKey;

    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token: token
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '登录失败' });
  }
});

// 认证状态检查
router.get('/check', verifyToken, (req, res) => {
  // 如果 verifyToken 中间件验证成功，则 req.user 中包含用户信息
  res.json({ message: '已认证', user: req.user });
});

module.exports = router;