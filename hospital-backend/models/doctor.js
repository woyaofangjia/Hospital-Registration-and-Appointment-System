// models/doctor.js

const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');
const doctorScheduleModel = require('./doctorSchedule'); // 引入 doctorScheduleModel

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 创建医生表 (如果不存在)
async function createTable() {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS doctors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                title VARCHAR(255),
                specialty VARCHAR(255),
                department_id INT,
                FOREIGN KEY (department_id) REFERENCES departments(id)
            )
        `;
        await pool.query(sql);
        console.log('医生表创建成功');
    } catch (err) {
        console.error('创建医生表失败：', err);
        throw err; // 抛出错误
    }
}

// 获取医生列表
async function getDoctors(departmentName) {
    let sql = `
        SELECT
            d.*,
            GROUP_CONCAT(
                CONCAT_WS(
                    '|',
                    ds.id,
                    ds.start_time,
                    ds.end_time,
                    ds.appointment_price
                )
                ORDER BY ds.start_time
                SEPARATOR ';'
            ) AS schedules
        FROM
            doctors d
        LEFT JOIN
            doctor_schedules ds ON d.id = ds.doctor_id
        LEFT JOIN
            departments dp ON d.department_id = dp.id
        WHERE 1=1
    `;
    const values = [];

    if (departmentName) {
        sql += ' AND dp.name = ?';
        values.push(departmentName);
    }

    sql += `
        GROUP BY
            d.id
    `;

    try {
        const [rows] = await pool.query(sql, values);

        // 处理 schedules 字符串
        const doctors = rows.map(doctor => {
            if (doctor.schedules) {
                doctor.schedules = doctor.schedules.split(';').map(schedule => {
                    const [id, start_time, end_time, appointment_price] = schedule.split('|');
                    return {
                        id: parseInt(id),
                        start_time,
                        end_time,
                        appointment_price: parseFloat(appointment_price)
                    };
                });
            } else {
                doctor.schedules = [];
            }
            return doctor;
        });

        return doctors;
    } catch (err) {
        console.error('获取医生列表失败：', err);
        throw err; // 抛出错误
    }
}

// 根据科室 ID 获取医生列表
async function getDoctorsByDepartmentId(departmentId) {
    try {
        const sql = `
            SELECT *
            FROM doctors
            WHERE department_id = ?
        `;
        console.log('正在执行 SQL 语句:', sql, [departmentId]);
        const [rows] = await pool.query(sql, [departmentId]); // 使用连接池
        console.log('成功获取科室下的医生列表:', rows);
        return rows;
    } catch (err) {
        console.error('根据科室 ID 获取医生列表失败：', err);
        throw err; // 抛出错误
    }
}

// 添加医生
async function addDoctor(name, title, specialty, departmentId) {
    let connection;
    try {
        connection = await pool.getConnection(); 
        console.log('成功获取数据库连接');
        const sql = `
            INSERT INTO doctors (name, title, specialty, department_id)
            VALUES (?, ?, ?, ?)
        `;
        console.log('正在执行 SQL 语句:', sql, [name, title, specialty, departmentId]);
        const [result] = await connection.query(sql, [name, title, specialty, departmentId]); // 使用连接池
        console.log('成功添加医生:', result);
        return result.insertId;
    } catch (err) {
        console.error('添加医生失败：', err);
        throw err; // 抛出错误
    } finally {
        if (connection) {
            connection.release(); // 释放连接回连接池
            console.log('成功释放数据库连接');
        }
    }
}

// 删除医生
async function deleteDoctor(id) {
    let connection;
    try {
        connection = await pool.getConnection(); // 从连接池获取连接
        console.log('成功获取数据库连接');

        await connection.beginTransaction(); // 开启事务

        // 1. 获取医生的所有排班信息
        const schedules = await doctorScheduleModel.getDoctorSchedules(id);
        console.log(`医生 ${id} 的排班信息:`, schedules);

        // 2. 循环删除医生的排班信息
        for (const schedule of schedules) {
            console.log(`正在删除排班信息: ${schedule.id}`);
            await doctorScheduleModel.deleteDoctorSchedule(schedule.id);
        }

        // 3. 删除医生信息
        const deleteDoctorSql = `
            DELETE FROM doctors
            WHERE id = ?
        `;
        console.log('正在执行 SQL 语句:', deleteDoctorSql, [id]);
        const [result] = await connection.query(deleteDoctorSql, [id]);
        const affectedRows = result.affectedRows > 0;
        console.log('删除医生结果:', result);

        await connection.commit(); // 提交事务
        console.log('事务提交成功');

        return affectedRows;
    } catch (err) {
        if (connection) {
            await connection.rollback(); // 回滚事务
            console.log('事务回滚成功');
        }
        console.error('删除医生失败：', err);
        throw err; // 抛出错误
    } finally {
        if (connection) {
            connection.release(); // 释放连接回连接池
            console.log('成功释放数据库连接');
        }
    }
}

// 根据医生 ID 获取科室信息
async function getDepartmentByDoctorId(doctorId) {
    try {
        const sql = `
            SELECT specialty
            FROM doctors
            WHERE id = ?
        `;
        console.log('正在执行 SQL 语句:', sql, [doctorId]);
        const [rows] = await pool.query(sql, [doctorId]); // 使用连接池

        if (rows.length === 0) {
            console.log(`未找到医生 ID 为 ${doctorId} 的医生`);
            return null; // 或者抛出一个错误，取决于你的需求
        }

        const department = rows[0].specialty;
        console.log(`成功获取医生 ID 为 ${doctorId} 的科室信息:`, department);
        return department;
    } catch (err) {
        console.error('根据医生 ID 获取科室信息失败：', err);
        throw err; // 抛出错误
    }
}


// 导出函数
module.exports = {
    createTable,
    getDoctors,
    getDoctorsByDepartmentId,
    addDoctor,
    deleteDoctor,
    getDepartmentByDoctorId
};

// 在应用启动时创建医生表
createTable();