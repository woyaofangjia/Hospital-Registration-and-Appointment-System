//routes/doctor.js
const express = require('express');
const router = express.Router();
const doctorModel = require('../models/doctor');
const departmentModel = require('../models/department');
const doctorScheduleModel = require('../models/doctorSchedule'); // 引入 doctorScheduleModel

// 获取医生列表
router.get('/', async (req, res) => {
    const { department } = req.query;

    try {
        const doctors = await doctorModel.getDoctors(department);

        if (!doctors) {
            return res.status(500).json({ message: '获取医生列表失败' });
        }

        res.json(doctors);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '获取医生列表失败' });
    }
});

// 定义路由，根据医生 ID 获取科室信息
router.get('/department', async (req, res) => {
    try {
        const doctorId = req.query.doctorId; // 从查询参数中获取 doctorId

        if (!doctorId) {
            return res.status(400).json({ message: '缺少 doctorId 参数' });
        }

        const department = await doctorModel.getDepartmentByDoctorId(doctorId);

        if (!department) {
            return res.status(404).json({ message: '医生不存在' });
        }

        res.json({ department });
    } catch (err) {
        console.error('获取科室信息失败：', err);
        res.status(500).json({ message: '获取科室信息失败' });
    }
});

// 添加医生功能
router.post('/', async (req, res) => {
    const { name, title, specialty, department } = req.body;

    try {
        // 验证科室是否存在
        const departmentObj = await departmentModel.getDepartmentByName(department);

        if (!departmentObj) {
            return res.status(400).json({ message: '科室不存在' });
        }

        const departmentId = departmentObj.id;

        // 添加医生
        const doctorId = await doctorModel.addDoctor(name, title, specialty, departmentId);

        if (!doctorId) {
            return res.status(500).json({ message: '添加医生失败' });
        }

        res.status(201).json({ message: '添加医生成功', doctorId }); // 修改状态码为 201
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '添加医生失败' });
    }
});


// 删除医生功能
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await doctorModel.deleteDoctor(id);

        if (!result) {
            return res.status(404).json({ message: '医生不存在' });
        }

        res.json({ message: '医生删除成功' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '删除医生失败', error: err.message });
    }
});

module.exports = router;