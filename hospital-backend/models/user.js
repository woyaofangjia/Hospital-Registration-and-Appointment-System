// models/user.js

const mysql = require('mysql2');
const dbConfig = require('../config/database');

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
pool.getConnection((err, connection) => {
  if (err) {
    console.error('数据库连接失败：', err);
    return;
  }
  console.log('数据库连接成功');
  connection.release(); // 释放连接
});

// 执行查询
function queryDatabase(sql, values) {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results);
    });
  });
}

// 创建用户表 (如果不存在)
async function createTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  try {
    await queryDatabase(sql);
    console.log('用户表创建成功');
  } catch (err) {
    console.error('创建用户表失败：', err);
  }
}

createTable(); // 在模块加载时创建表

// 查询用户
async function getUserByUsername(username) {
  const sql = 'SELECT * FROM users WHERE username = ?';
  try {
    const [rows] = await pool.promise().query(sql, [username]);
    if (rows.length > 0) {
      return rows[0];
    } else {
      return null; // 用户不存在
    }
  } catch (err) {
    console.error('查询用户失败：', err);
    return null; // 查询失败
  }
}

// 创建用户
async function createUser(username, password, email) {
  const sql = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
  try {
    const [result] = await pool.promise().query(sql, [username, password, email]);
    return result.insertId; // 返回插入的 ID
  } catch (err) {
    console.error('创建用户失败：', err);
    return null; // 创建用户失败
  }
}

module.exports = {
  getUserByUsername,
  createUser
};