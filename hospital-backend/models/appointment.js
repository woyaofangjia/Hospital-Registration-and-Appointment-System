const moment = require('moment');
const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 创建挂号表 (如果不存在)
async function createTable() {
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id INT,
        user_id INT,
        appointment_time DATETIME,
        doctor_schedule_id INT,
        order_id VARCHAR(255) NOT NULL COMMENT '订单ID',
        doctor_name VARCHAR(255) NOT NULL COMMENT '医生姓名',
        doctor_title VARCHAR(255) NOT NULL COMMENT '医生职称',
        appointment_price DECIMAL(10, 2) NOT NULL COMMENT '挂号价格',
        status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT '订单状态',
        payment_method VARCHAR(50) COMMENT '支付方式',
        FOREIGN KEY (doctor_id) REFERENCES doctors(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (doctor_schedule_id) REFERENCES doctor_schedules(id)
      )
    `;
    await pool.query(sql);
    console.log('挂号表创建成功');
  } catch (err) {
    console.error('创建挂号表失败：', err);
    throw err;
  }
}

// 根据用户 ID 获取挂号列表
async function getAppointmentsByUserId(userId) {
  const sql = `
    SELECT a.*, ds.appointment_price, d.name AS doctor_name
    FROM appointments a
    LEFT JOIN doctor_schedules ds ON a.doctor_schedule_id = ds.id
    LEFT JOIN doctors d ON a.doctor_id = d.id
    WHERE a.user_id = ?
  `;
  const values = [userId];

  try {
    const [rows] = await pool.query(sql, values);
    return rows;
  } catch (err) {
    console.error('获取挂号列表失败：', err);
    throw err;
  }
}

// 添加挂号
async function addAppointment(scheduleId, userId, order) {
  const { orderId, doctorName, doctorTitle, appointmentTime, amount, status, paymentMethod } = order;

  // 移除星期几信息
  const appointmentTimeWithoutDay = appointmentTime.replace(/（[^）]*）/, '');

  // 使用 moment.js 格式化日期
  const formattedAppointmentTime = moment(appointmentTimeWithoutDay, 'YYYY/MM/DD HH:mm').format('YYYY-MM-DD HH:mm:ss');

  const sql = `
    INSERT INTO appointments (
      doctor_id,
      user_id,
      appointment_time,
      doctor_schedule_id,
      order_id,
      doctor_name,
      doctor_title,
      appointment_price,
      status,
      payment_method
    ) VALUES (
      (SELECT doctor_id FROM doctor_schedules WHERE id = ?),
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?
    )
  `;
  const values = [
    scheduleId,
    userId,
    formattedAppointmentTime,
    scheduleId,
    orderId,
    doctorName,
    doctorTitle,
    amount,
    status,
    paymentMethod,
  ];

  try {
    const [result] = await pool.query(sql, values);
    return result.insertId;
  } catch (err) {
    console.error('添加挂号失败：', err);
    throw err;
  }
}

module.exports = {
  createTable,
  getAppointmentsByUserId,
  addAppointment,
};

// 在应用启动时创建挂号表
createTable();