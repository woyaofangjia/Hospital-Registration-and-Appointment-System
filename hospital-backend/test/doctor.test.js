//doctor.test.js
const request = require('supertest');
const { app } = require('../app'); // 引入 Express 应用
const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

describe('GET /api/doctors', () => {
  let connection;

  // 在每个测试用例之前，清空数据库并添加测试数据
  beforeEach(async () => {
    try {
      // 创建数据库连接
      connection = await mysql.createConnection(dbConfig);
      console.log('数据库连接成功！');

      // 清空 Doctor 和 Department 表
      await connection.execute('DELETE FROM doctors');
      await connection.execute('DELETE FROM departments');

      // 创建测试数据
      const [departmentResult] = await connection.execute('INSERT INTO departments (name) VALUES (?)', ['心内科']);
      const departmentId = departmentResult.insertId;

      await connection.execute('INSERT INTO doctors (name, title, specialty, department_id) VALUES (?, ?, ?, ?)', ['张三', '主任医师', '心内科', departmentId]);
      await connection.execute('INSERT INTO doctors (name, title, specialty, department_id) VALUES (?, ?, ?, ?)', ['李四', '副主任医师', '心内科', departmentId]);
    } catch (error) {
      console.error('Error during beforeEach:', error);
      throw error;
    }
  });
  
  // 在所有测试用例完成后，关闭数据库连接
  afterAll(async () => {
    if (connection) {
      await connection.close();
      console.log('数据库连接已关闭！');
    }
  });

  it('should return a 200 status code', async () => {
    const response = await request(app)
      .get('/api/doctors')
      .query({ department: '心内科' }); // 使用 query 方法传递参数
    expect(response.status).toBe(200);
  });

  it('should return a JSON array', async () => {
    const response = await request(app)
      .get('/api/doctors')
      .query({ department: '心内科' });
    expect(response.type).toBe('application/json');
  });

  it('should return an array of doctors', async () => {
    const response = await request(app)
      .get('/api/doctors')
      .query({ department: '心内科' });
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should return an array of doctors with the correct properties', async () => {
    const response = await request(app)
      .get('/api/doctors')
      .query({ department: '心内科' });
    response.body.forEach(doctor => {
      expect(doctor).toHaveProperty('id');
      expect(doctor).toHaveProperty('name');
      expect(doctor).toHaveProperty('title');
      expect(doctor).toHaveProperty('specialty');
    });
  });

  it('should return an empty array if the department is not found', async () => {
    const response = await request(app)
      .get('/api/doctors')
      .query({ department: '其他科室' });
    expect(response.body).toEqual([]);
  });
});