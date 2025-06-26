// models/department.js

const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');
const doctorModel = require('./doctor'); // 引入 doctorModel
// 创建连接池
const pool = mysql.createPool(dbConfig);

// 创建科室表 (如果不存在)
async function createTable() {
    let connection;
    try {
        connection = await pool.getConnection(); // 从连接池获取连接
        console.log('成功获取数据库连接');
        const sql = `
            CREATE TABLE IF NOT EXISTS departments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE
            )
        `;
          console.log('正在执行 SQL 语句:', sql);
        await connection.execute(sql);
        console.log('科室表创建成功');
    } catch (err) {
        console.error('创建科室表失败：', err);
        throw err; // 抛出错误
    } finally {
        if (connection) {
            connection.release(); // 释放连接回连接池
            console.log('成功释放数据库连接');
        }
    }
}

// 获取科室列表
async function getDepartments() {
    try {
        console.log('正在执行 SQL 语句: SELECT * FROM departments');
        const [rows] = await pool.query('SELECT * FROM departments'); // 使用连接池
        console.log('成功获取科室列表:', rows);
        return rows;
    } catch (err) {
        console.error('获取科室列表失败：', err);
        throw err; // 抛出错误
    }
}

// 根据科室名称获取科室信息
async function getDepartmentByName(name) {
    try {
        const [rows] = await pool.query('SELECT * FROM departments WHERE name = ?', [name]); // 使用连接池
        if (rows.length > 0) {
            return rows[0];
        } else {
            return null; // 没有找到科室时返回 null
        }
    } catch (err) {
        console.error('根据科室名称获取科室信息失败：', err);
        throw err; // 抛出错误
    }
}

// 添加科室
async function addDepartment(name) {
    try {
        console.log(`正在执行 SQL 语句: INSERT INTO departments (name) VALUES (${name})`);
        const [result] = await pool.query(`
            INSERT INTO departments (name)
            VALUES (?)
        `, [name]); // 使用连接池
        console.log('成功添加科室:', result);
        return result.insertId;
    } catch (err) {
        console.error('添加科室失败：', err);
        throw err; // 抛出错误
    }
}

// 删除科室
async function deleteDepartment(id) {
    let connection;
    try {
        connection = await pool.getConnection(); // 从连接池获取连接
        console.log('成功获取数据库连接');

        await connection.beginTransaction(); // 开启事务

        // 1. 获取科室下的所有医生
        const doctors = await doctorModel.getDoctorsByDepartmentId(id);
        console.log('科室下的医生:', doctors);

        // 2. 循环删除科室下的所有医生
        for (const doctor of doctors) {
            console.log(`正在删除医生: ${doctor.id}`);
            await doctorModel.deleteDoctor(doctor.id);
        }

        // 3. 删除科室
        const deleteDepartmentSql = `
            DELETE FROM departments
            WHERE id = ?
        `;
        console.log('正在执行 SQL 语句:', deleteDepartmentSql, [id]);
        const [result] = await connection.query(deleteDepartmentSql, [id]);
        const affectedRows = result.affectedRows > 0;
        console.log('删除科室结果:', result);

        await connection.commit(); // 提交事务
        console.log('事务提交成功');

        return affectedRows;
    } catch (err) {
        if (connection) {
            await connection.rollback(); // 回滚事务
            console.log('事务回滚成功');
        }
        console.error('删除科室失败：', err);
        throw err; // 抛出错误
    } finally {
        if (connection) {
            connection.release(); // 释放连接回连接池
            console.log('成功释放数据库连接');
        }
    }
}

// 导出函数
module.exports = {
    createTable,
    getDepartments,
    addDepartment,
    getDepartmentByName,
    deleteDepartment
};

// 在应用启动时创建科室表
createTable();