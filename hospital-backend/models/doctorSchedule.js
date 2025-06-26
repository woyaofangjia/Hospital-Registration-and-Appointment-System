// models/doctorSchedule.js
const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');
const moment = require('moment'); // 引入 moment

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 创建医生排班表 (如果不存在)
async function createTable() {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS doctor_schedules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                doctor_id INT,
                start_time DATETIME,
                end_time DATETIME,
                appointment_price DECIMAL(10, 2),
                FOREIGN KEY (doctor_id) REFERENCES doctors(id)
            )
        `;
        await pool.query(sql);
        console.log('医生排班表创建成功');
    } catch (err) {
        console.error('创建医生排班表失败：', err);
        throw err; // 抛出错误
    }
}

// 获取医生排班列表
async function getDoctorSchedules(doctorId) {
    const sql = `
        SELECT *
        FROM doctor_schedules
        WHERE doctor_id = ?
    `;
    const values = [doctorId];

    try {
        const [rows] = await pool.query(sql, values);
        return rows;
    } catch (err) {
        console.error('获取医生排班列表失败：', err);
        throw err; // 抛出错误
    }
}

// 添加医生排班
async function addDoctorSchedule(doctorId, startTime, endTime, appointmentPrice) {
    let connection;
    try {
        connection = await pool.getConnection(); // 获取连接
        await connection.beginTransaction(); // 开启事务

        const sql = `
            INSERT INTO doctor_schedules (doctor_id, start_time, end_time, appointment_price)
            VALUES (?, ?, ?, ?)
        `;
        const values = [doctorId, startTime, endTime, appointmentPrice];

        console.log('执行 SQL 语句:', sql, values); // 添加日志

        const [result] = await connection.query(sql, values);
        const scheduleId = result.insertId;

        console.log('成功添加医生排班信息，scheduleId:', scheduleId); // 添加日志

        await connection.commit(); // 提交事务
        return scheduleId;
    } catch (err) {
        if (connection) {
            await connection.rollback(); // 回滚事务
        }
        console.error('添加医生排班失败：', err);
        throw err;
    } finally {
        if (connection) {
            connection.release(); // 释放连接
        }
    }
}

// 根据 ID 获取医生排班信息
async function getDoctorScheduleById(id) {
    const sql = `
        SELECT *
        FROM doctor_schedules
        WHERE id = ?
    `;
    const values = [id];

    try {
        const [rows] = await pool.query(sql, values);
        return rows[0];
    } catch (err) {
        console.error('获取医生排班信息失败：', err);
        throw err; // 抛出错误
    }
}

// 删除医生排班信息
async function deleteDoctorSchedule(id) {
    try {
        const sql = `
            DELETE FROM doctor_schedules
            WHERE id = ?
        `;
        console.log('正在执行 SQL 语句:', sql, [id]);
        const [result] = await pool.query(sql, [id]); // 使用连接池
        console.log('成功删除医生排班信息:', result);
        return result.affectedRows > 0;
    } catch (err) {
        console.error('删除医生排班信息失败：', err);
        throw err; // 抛出错误
    }
}

// 修改医生排班信息
async function updateDoctorSchedule(id, startTime, endTime, appointmentPrice) {
    let connection;
    try {
        connection = await pool.getConnection(); // 获取连接
        await connection.beginTransaction(); // 开启事务

        const sql = `
            UPDATE doctor_schedules
            SET start_time = ?, end_time = ?, appointment_price = ?
            WHERE id = ?
        `;
        const values = [startTime, endTime, appointmentPrice, id];

        console.log('执行 SQL 语句:', sql, values); // 添加日志

        const [result] = await connection.query(sql, values);

        console.log('成功修改医生排班信息，affectedRows:', result.affectedRows); // 添加日志

        await connection.commit(); // 提交事务
        return result.affectedRows > 0;
    } catch (err) {
        if (connection) {
            await connection.rollback(); // 回滚事务
        }
        console.error('修改医生排班信息失败：', err);
        throw err; // 抛出错误
    } finally {
        if (connection) {
            connection.release(); // 释放连接
        }
    }
}

// 导出函数
module.exports = {
    createTable,
    getDoctorSchedules,
    addDoctorSchedule,
    getDoctorScheduleById,
    deleteDoctorSchedule,
    updateDoctorSchedule
};

// 在应用启动时创建医生排班表
createTable();