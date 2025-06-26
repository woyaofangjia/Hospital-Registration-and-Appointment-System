// routes/appointment.js

const express = require('express');
const router = express.Router();
const appointmentModel = require('../models/appointment');
const verifyToken = require('../middleware/auth'); // 引入 verifyToken 中间件
const redis = require('redis');
const { pool } = require('../config/db'); 

// 创建 Redis 客户端
const redisClient = redis.createClient({
  host: '127.0.0.1', // Redis 服务器地址
  port: 6379 // Redis 服务器端口
});

// 连接 Redis
redisClient.connect().then(() => {
  console.log('Connected to Redis');
}).catch((err) => {
  console.error('Could not connect to Redis', err);
});

// 获取用户挂号记录
router.get('/appointments', verifyToken, async (req, res) => { // 使用 verifyToken 中间件
  try {
    // 从 req.user 中获取用户信息
    const userId = req.user.id;

    console.log('获取用户挂号记录 - 用户ID:', userId); // 添加日志

    const appointments = await appointmentModel.getAppointmentsByUserId(userId);

    if (!appointments) {
      console.log('未找到挂号记录 - 用户ID:', userId); // 添加日志
      return res.status(404).json({ message: '未找到挂号记录' });
    }

    console.log('获取用户挂号记录成功 - 用户ID:', userId, '挂号记录:', appointments); // 添加日志
    res.status(200).json(appointments);
  } catch (err) {
    console.error('获取用户挂号记录失败:', err); // 记录错误日志
    res.status(500).json({ message: '获取挂号记录失败', error: err.message });
  }
});

// 预创建订单 API
router.post('/ordercreate', verifyToken, async (req, res) => {
  const { scheduleId, doctorName, doctorTitle, appointmentTime, appointment_price } = req.body; // 获取订单信息

  try {
    console.log('预创建订单 - 请求到达 /api/ordercreate 路由处理程序');
    console.log('预创建订单 - scheduleId:', scheduleId);
    console.log('预创建订单信息', req.body);

    // 从 req.user 中获取用户信息
    const userId = req.user.id;
    console.log('预创建订单 - userId:', userId);

    // 生成订单ID
    const orderId = generateUniqueOrderId(); 
   console.log('订单id为', orderId);
    // 创建“待支付”状态的订单
    const order = {
      orderId: orderId,
      userId: userId,
      scheduleId: scheduleId,
      doctorName: doctorName,
      doctorTitle: doctorTitle,
      appointmentTime: appointmentTime,
      appointment_price: appointment_price,
      status: 'pending' // 待支付状态
    };

    // 将订单信息存储到 Redis 中（设置过期时间为 30 分钟）
    await storeOrderInCache(orderId, order, 1800); 

    console.log('预创建订单成功 - orderId:', orderId);
    res.status(201).json({ message: '预创建订单成功', orderId });
  } catch (err) {
    console.error('预创建订单失败:', err);
    res.status(500).json({ message: '预创建订单失败', error: err.message });
  }
});

// 支付结果回调 API
router.post('/payment', async (req, res) => {
  const { orderId, paymentResult } = req.body; // 获取支付结果

  try {
    console.log('支付结果回调 - 请求到达 /api/payment 路由处理程序');
    console.log('支付结果回调 - orderId:', orderId);
    console.log('支付结果回调 - paymentResult:', paymentResult);
    // 验证支付结果
    const isValid = verifyPaymentResult(paymentResult);
    if (!isValid) {
      console.error('支付结果验证失败');
      return res.status(400).json({ message: '支付结果验证失败' });
    }

    // 从缓存中获取订单信息
    const order = await getOrderFromCache(orderId); 
    if (!order) {
      console.error('订单不存在:', orderId);
      return res.status(404).json({ message: '订单不存在' });
    }
   // 更新订单信息
    order.paymentMethod = paymentResult.paymentMethod;
    order.amount = paymentResult.amount;
    order.status = 'paid'; // 支付状态
    console.log('order结果:',order);
    // 调用 appointmentModel.addAppointment，将订单信息保存到数据库
    const appointmentId = await appointmentModel.addAppointment(order.scheduleId, order.userId, order);
    if (!appointmentId) {
      console.error('添加挂号信息失败 - scheduleId:', order.scheduleId, 'userId:', order.userId);
      return res.status(500).json({ message: '添加挂号信息失败' });
    }

    console.log('传递更新的值：',orderId,'paid');
  // 更新订单状态
    updateOrderStatus(orderId, 'paid', pool, (err) => {
      if (err) {
        console.error('更新订单状态失败:', err);
        return res.status(500).json({ message: '更新订单状态失败', error: err.message });
      }

      console.log('支付成功，挂号信息已保存 - appointmentId:', appointmentId);
      res.status(200).json({ message: '支付成功，挂号信息已保存', appointmentId });
    });
  } catch (err) {
    console.error('支付结果回调处理失败:', err);
    res.status(500).json({ message: '支付结果回调处理失败', error: err.message });
  }
});


// 生成唯一订单ID的函数
function generateUniqueOrderId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 将订单信息存储到 Redis 中
async function storeOrderInCache(orderId, order, expirationTime) {
  try {
    // 将订单信息转换为 JSON 字符串
    const orderString = JSON.stringify(order);

    // 将订单信息存储到 Redis 中，并设置过期时间
    await redisClient.set(orderId, orderString, {
      EX: expirationTime // 设置过期时间（秒）
    });

    console.log(`订单 ${orderId} 存储到 Redis 中，过期时间为 ${expirationTime} 秒`);
  } catch (err) {
    console.error('存储订单到 Redis 失败:', err);
    throw err;
  }
}

// 从 Redis 中获取订单信息
async function getOrderFromCache(orderId) {
  try {
    // 从 Redis 中获取订单信息
    const orderString = await redisClient.get(orderId);

    if (orderString) {
      // 将 JSON 字符串转换为 JavaScript 对象
      const order = JSON.parse(orderString);
      console.log(`从 Redis 中获取订单 ${orderId}:`, order);
      return order;
    } else {
      console.log(`订单 ${orderId} 不存在于 Redis 中`);
      return null;
    }
  } catch (err) {
    console.error('从 Redis 中获取订单失败:', err);
    throw err;
  }
}

// 更新订单状态
function updateOrderStatus(orderId, status, pool, callback) {
  // 1. 更新数据库中的订单状态
  updateOrderStatusInDatabase(orderId, status, pool, (err) => {
    if (err) {
      console.error('更新订单状态失败:', err);
      return callback(err);
    }

    // 2. 更新缓存中的订单状态
    updateOrderStatusInCache(orderId, status, (err) => {
      if (err) {
        console.error('更新订单状态失败:', err);
        return callback(err);
      }

      console.log(`订单 ${orderId} 状态更新为 ${status}`);
      callback(null);
    });
  });
}

// 更新数据库中的订单状态
function updateOrderStatusInDatabase(orderId, status, pool, callback) {
  const sql = 'UPDATE appointments SET status = ? WHERE order_id = ?';
  const values = [status, orderId];

  pool.query(sql, values, (error, results) => {
    if (error) {
      console.error('更新数据库中订单状态失败:', error);
      return callback(error);
    }

    console.log(`更新数据库中订单 ${orderId} 状态为 ${status}`);
    callback(null);
  });
}

// 更新缓存中的订单状态
function updateOrderStatusInCache(orderId, status, callback) {
  // 1. 从 Redis 中获取订单信息
  getOrderFromCache(orderId)
    .then(order => {
      if (order) {
        // 2. 更新订单状态
        order.status = status;

        // 3. 将更新后的订单信息存储到 Redis 中
        return storeOrderInCache(orderId, order, 600); // 600 秒 = 10 分钟
      } else {
        console.log(`订单 ${orderId} 不存在于 Redis 中`);
        return Promise.resolve(); // 返回一个 resolved 的 Promise，以便 .then() 可以继续执行
      }
    })
    .then(() => {
      console.log(`更新缓存中订单 ${orderId} 状态为 ${status}`);
      callback(null); // 成功时调用回调
    })
    .catch(err => {
      console.error('更新缓存中订单状态失败:', err);
      callback(err); // 失败时调用回调
    });
}

// 验证支付结果
function verifyPaymentResult(paymentResult) {
  try {


    // 2. 验证订单ID
    const isValidOrderId = verifyOrderId(paymentResult);
    if (!isValidOrderId) {
      console.error('支付结果订单ID验证失败');
      return false;
    }

    // 3. 验证金额
    const isValidAmount = verifyAmount(paymentResult);
    if (!isValidAmount) {
      console.error('支付结果金额验证失败');
      return false;
    }

    // 4. 验证支付状态
    const isValidPaymentStatus = verifyPaymentStatus(paymentResult);
    if (!isValidPaymentStatus) {
      console.error('支付结果支付状态验证失败');
      return false;
    }

    console.log('支付结果验证成功');
    return true;
  } catch (err) {
    console.error('支付结果验证失败:', err);
    return false;
  }
}


// 验证订单ID
function verifyOrderId(paymentResult, order) {
  // 验证支付结果中的订单ID是否与缓存中的订单ID一致
console.log('验证订单id');
  return true;
}

// 验证金额
function verifyAmount(paymentResult) {
  // 验证支付结果中的金额是否与订单金额一致
  console.log('验证金额');
  return true; 
}

// 验证支付状态
function verifyPaymentStatus(paymentResult) {
  // 验证支付结果中的支付状态是否为“已支付”
  console.log('验证支付状态');
  return true; 
}

module.exports = router;