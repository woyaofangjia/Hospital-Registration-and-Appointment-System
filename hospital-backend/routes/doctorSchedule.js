// routes/doctorSchedule.js

const express = require('express');
const router = express.Router();
const doctorScheduleModel = require('../models/doctorSchedule');
const moment = require('moment'); // 引入 moment
const { body, validationResult } = require('express-validator');

// 获取医生排班列表
router.get('/', async (req, res) => {
    try {
        const doctorId = req.query.doctorId; // 从查询参数中获取医生 ID
        const doctorSchedules = await doctorScheduleModel.getDoctorSchedules(doctorId);
        res.json(doctorSchedules);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '获取医生排班列表失败', error: err.message });
    }
});

// 添加医生排班
router.post('/', [
    body('doctorId').notEmpty().isInt().withMessage('医生ID不能为空'),
    body('startTime').trim().notEmpty().isISO8601().withMessage('开始时间不能为空且必须是ISO8601格式'),
    body('endTime').trim().notEmpty().isISO8601().withMessage('结束时间不能为空且必须是ISO8601格式'),
    body('appointmentPrice').trim().notEmpty().isDecimal().withMessage('预约价格不能为空且必须是十进制数'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('请求参数错误:', errors.array()); // 添加日志
        return res.status(400).json({ message: '请求参数错误', errors: errors.array() });
    }

    const { doctorId, startTime, endTime, appointmentPrice } = req.body;

    console.log('接收到的请求参数:', req.body); // 添加日志

    try {
        // 格式化日期时间为 MySQL datetime 格式
        const formattedStartTime = moment(startTime).format('YYYY-MM-DD HH:MM:SS');
        const formattedEndTime = moment(endTime).format('YYYY-MM-DD HH:MM:SS');

        const scheduleId = await doctorScheduleModel.addDoctorSchedule(doctorId, formattedStartTime, formattedEndTime, appointmentPrice);

        if (!scheduleId) {
            console.log('添加医生排班失败'); // 添加日志
            return res.status(500).json({ message: '添加医生排班失败' });
        }

        console.log('添加医生排班成功，scheduleId:', scheduleId); // 添加日志

        res.status(201).json({ message: '添加医生排班成功', scheduleId });
    } catch (err) {
        console.error('添加医生排班失败:', err);
        res.status(500).json({ message: '添加医生排班失败', error: err.message });
    }
});

// 根据 ID 获取医生排班信息
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const doctorSchedule = await doctorScheduleModel.getDoctorScheduleById(id);

        if (!doctorSchedule) {
            return res.status(404).json({ message: '医生排班信息不存在' });
        }

        res.json(doctorSchedule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '获取医生排班信息失败', error: err.message });
    }
});

// 修改医生排班信息
router.put('/:id', [
    body('startTime').trim().notEmpty().isISO8601().withMessage('开始时间不能为空且必须是ISO8601格式'),
    body('endTime').trim().notEmpty().isISO8601().withMessage('结束时间不能为空且必须是ISO8601格式'),
    body('appointmentPrice').trim().notEmpty().isDecimal().withMessage('预约价格不能为空且必须是十进制数'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('请求参数错误:', errors.array()); // 添加日志
        return res.status(400).json({ message: '请求参数错误', errors: errors.array() });
    }

    const { id } = req.params;
    const { startTime, endTime, appointmentPrice } = req.body;

    console.log('接收到的请求参数:', req.body); // 添加日志

    try {
        // 格式化日期时间为 MySQL datetime 格式
        const formattedStartTime = moment(startTime).format('YYYY-MM-DD HH:MM:SS');
        const formattedEndTime = moment(endTime).format('YYYY-MM-DD HH:MM:SS');

        const result = await doctorScheduleModel.updateDoctorSchedule(id, formattedStartTime, formattedEndTime, appointmentPrice);

        if (!result) {
            console.log('排班信息不存在'); // 添加日志
            return res.status(404).json({ message: '排班信息不存在' });
        }

        console.log('排班信息修改成功'); // 添加日志

        res.json({ message: '排班信息修改成功' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '修改排班信息失败', error: err.message });
    }
});

// 删除医生排班信息
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await doctorScheduleModel.deleteDoctorSchedule(id);

        if (!result) {
            return res.status(404).json({ message: '排班信息不存在' });
        }

        res.json({ message: '排班信息删除成功' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '删除排班信息失败', error: err.message });
    }
});

module.exports = router;