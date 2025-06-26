// db.js
const mysql = require('mysql2/promise');
const database = require('../config/database'); // 引入 database.js

const pool = mysql.createPool(database); // 使用 database.js 中的配置

module.exports = pool;