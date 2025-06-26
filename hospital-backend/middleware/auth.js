// middleware/auth.js

const jwt = require('jsonwebtoken');
const config = require('../config'); // 引入配置文件

/**
 * 验证 JWT Token 的中间件
 *
 * @param {object} req - Express 请求对象
 * @param {object} res - Express 响应对象
 * @param {function} next - Express next 函数
 */
const verifyToken = (req, res, next) => {
  // 1. 从请求头中获取 Authorization
  const authHeader = req.headers.authorization;

  // 2. 检查 Authorization 是否存在
  if (!authHeader) {
    console.warn("Authorization header 缺失");
    return res.status(401).json({ message: 'Unauthorized: Authorization header missing' });
  }

  // 3. 验证 Authorization 格式是否为 "Bearer <token>"
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0].toLowerCase() !== 'bearer') {
    console.warn("Authorization header 格式错误");
    return res.status(401).json({ message: 'Unauthorized: Invalid authorization header format' });
  }

  // 4. 提取 Token
  const token = tokenParts[1];

  // 5. 从配置文件中获取 JWT 密钥
  const secretKey = config.jwtSecretKey;

  // 6. 检查 JWT 密钥是否存在
  if (!secretKey) {
    console.error("JWT 密钥未定义");
    return res.status(500).json({ message: '服务器错误: JWT secret key not defined' });
  }

  // 7. 验证 Token
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      // 7.1 Token 验证失败
      console.error("Token 验证失败:", err);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: '请重新登录: Token 已过期' });
      } else {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }
    }

    // 7.2 Token 验证成功
    req.user = user; // 将用户信息添加到 req 对象中
    console.log('req.user:', req.user); // 添加这行代码，方便调试
    next(); // 调用 next()，将控制权交给下一个中间件或路由处理函数
  });
};

module.exports = verifyToken;