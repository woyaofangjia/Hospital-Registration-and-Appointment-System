// hospital/app/doctor/page.tsx
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import '../../style.css'; 

// 定义排班类型
type Schedule = {
    id: number;
    doctor_id: number;
    appointment_price: number;
    start_time: string;
    end_time: string;
};

// 定义医生类型
type Doctor = {
    id: number;
    name: string;
    title: string;
    specialty: string;
    department_id: number;
    schedules: Schedule[];
};

// 定义科室类型
type Department = {
    id: number;
    name: string;
};

// 修改表单输入类型
type DoctorForm = {
    name: string;
    title: string;
    specialty: string;
    department: string;
};

// 修改排班表单类型
type ScheduleForm = {
    appointment_price: string;
    start_time: string;
    end_time: string;
};

const DoctorDeletePage = () => {
    const [doctorsData, setDoctorsData] = useState<Doctor[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [specialties, setSpecialties] = useState<string[]>([]);
    const [formData, setFormData] = useState<DoctorForm>({
        name: '',
        title: '',
        specialty: '',
        department: ''
    });
    const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({
        appointment_price: '',
        start_time: '',
        end_time: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<Partial<DoctorForm>>({});
    const router = useRouter();
    const params = useSearchParams();
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

    // 从环境变量中获取 API URL
    const apiUrl = 'http://121.40.80.144:3001/api';

    useEffect(() => {
        // 获取科室列表
        const fetchDepartments = async () => {
            try {
                const res = await fetch(`${apiUrl}/departments`);
                if (!res.ok) {
                    throw new Error(`获取科室列表失败: ${res.status} ${res.statusText}`);
                }
                const data = await res.json();
                console.log('获取到的科室数据:', data);
                // 确保科室数据格式正确
                const departmentList = data.map((dept: any) => ({
                    id: dept.id,
                    name: dept.name
                }));
                setDepartments(departmentList);
                setSpecialties(departmentList.map((dept: any) => dept.name));
            } catch (error: any) {
                console.error('获取科室列表失败:', error);
                // 设置默认科室列表
                const defaultDepts = ['内科', '外科', '儿科', '妇科', '骨科', '眼科'].map((name, index) => ({
                    id: index + 1,
                    name: name
                }));
                setDepartments(defaultDepts);
                setSpecialties(defaultDepts.map(dept => dept.name));
            }
        };

        fetchDepartments();
    }, []);

    // 获取医生列表
    useEffect(() => {
        const fetchDoctors = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${apiUrl}/doctors`);
                if (!res.ok) {
                    throw new Error(`获取医生列表失败: ${res.status} ${res.statusText}`);
                }
                const data = await res.json();
                console.log('API返回的医生数据:', data);

                // 获取每个医生的排班信息
                const doctorsWithSchedules = await Promise.all(data.map(async (doctor: Doctor) => {
                    try {
                        console.log(`正在获取医生 ${doctor.id} 的排班信息...`);
                        const scheduleRes = await fetch(`${apiUrl}/doctorSchedules?doctorId=${doctor.id}`);
                        
                        if (!scheduleRes.ok) {
                            console.error(`获取医生 ${doctor.id} 的排班信息失败: ${scheduleRes.status} ${scheduleRes.statusText}`);
                            return {
                                ...doctor,
                                schedules: []
                            };
                        }

                        const schedules = await scheduleRes.json();
                        console.log(`医生 ${doctor.id} 的排班信息:`, schedules);
                        
                        // 确保返回的是数组，并且每个元素都是有效的
                        const schedulesArray = Array.isArray(schedules) ? schedules : [schedules];
                        const validSchedules = schedulesArray.filter(schedule => 
                            schedule !== null && 
                            schedule.id && 
                            schedule.doctor_id && 
                            schedule.appointment_price !== undefined &&
                            schedule.start_time &&
                            schedule.end_time
                        );

                        return {
                            ...doctor,
                            schedules: validSchedules
                        };
                    } catch (error) {
                        console.error(`获取医生 ${doctor.id} 的排班信息失败:`, error);
                        return {
                            ...doctor,
                            schedules: []
                        };
                    }
                }));

                console.log('处理后的医生数据:', doctorsWithSchedules);
                setDoctorsData(doctorsWithSchedules);
            } catch (error: any) {
                console.error('获取医生数据失败:', error);
                setError(error.message);
                setDoctorsData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    // 处理输入变更
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        console.log(`输入变更 - 字段: ${name}, 值: ${value}`);
        setFormData(prev => ({ ...prev, [name]: value }));
        setFormError(prev => ({ ...prev, [name]: '' }));
    };

    // 表单验证
    const validateForm = (data: DoctorForm) => {
        const errors: Partial<DoctorForm> = {};
        let isValid = true;

        if (!data.name.trim()) {
            errors.name = '请输入医生姓名';
            isValid = false;
        }

        if (!data.title.trim()) {
            errors.title = '请输入医生职称';
            isValid = false;
        }

        if (!data.specialty.trim()) {
            errors.specialty = '请选择专长';
            isValid = false;
        }

        if (!data.department) {
            errors.department = '请选择科室';
            isValid = false;
        }

        setFormError(errors);
        return isValid;
    };

    // 修改排班表单变更处理函数
    const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        console.log(`排班表单字段变更 - ${name}:`, value);
        setScheduleForm(prev => {
            const newForm = { ...prev, [name]: value };
            console.log('更新后的表单数据:', newForm);
            return newForm;
        });
    };

    // 处理更新排班信息
    const handleUpdateSchedule = async (doctorId: number) => {
        console.log('开始更新排班信息...');
        console.log('当前表单数据:', scheduleForm);

        if (!scheduleForm.appointment_price || isNaN(Number(scheduleForm.appointment_price))) {
            console.error('无效的费用金额:', scheduleForm.appointment_price);
            alert('请输入有效的费用金额');
            return;
        }

        if (!scheduleForm.start_time || !scheduleForm.end_time) {
            console.error('无效的时间段:', { start: scheduleForm.start_time, end: scheduleForm.end_time });
            alert('请输入有效的时间段');
            return;
        }

        try {
            const doctor = doctorsData.find(d => d.id === doctorId);
            if (!doctor) {
                console.error('未找到医生信息:', doctorId);
                throw new Error('未找到医生信息');
            }

            console.log('找到医生信息:', doctor);

            // 格式化时间为MySQL datetime格式
            const formatDateTime = (dateTimeStr: string) => {
                const date = new Date(dateTimeStr);
                const formatted = date.toISOString().slice(0, 19).replace('T', ' ');
                console.log(`时间格式化: ${dateTimeStr} -> ${formatted}`);
                return formatted;
            };

            const requestData = {
                doctor_id: doctorId,
                appointment_price: Number(scheduleForm.appointment_price),
                start_time: formatDateTime(scheduleForm.start_time),
                end_time: formatDateTime(scheduleForm.end_time)
            };

            console.log('准备发送的排班数据:', requestData);

            let response;
            if (doctor.schedules.length === 0) {
                console.log('创建新的排班信息...');
                response = await fetch(`${apiUrl}/doctorSchedules`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(requestData),
                });
            } else {
                const scheduleId = doctor.schedules[0].id;
                console.log(`更新现有排班信息(ID: ${scheduleId})...`);
                response = await fetch(`${apiUrl}/doctorSchedules/${scheduleId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(requestData),
                });
            }

            console.log('服务器响应状态:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('服务器返回错误:', errorData);
                throw new Error(`更新排班信息失败: ${response.status} ${response.statusText} - ${errorData.message}`);
            }

            const responseData = await response.json();
            console.log('服务器返回的排班数据:', responseData);

            // 直接使用新创建的排班信息更新本地数据
            setDoctorsData(prevDoctors => {
                return prevDoctors.map(doctor => {
                    if (doctor.id === doctorId) {
                        // 创建新的排班对象
                        const newSchedule = {
                            id: responseData.scheduleId,
                            doctor_id: doctorId,
                            appointment_price: Number(scheduleForm.appointment_price),
                            start_time: scheduleForm.start_time,
                            end_time: scheduleForm.end_time
                        };

                        // 更新医生的排班列表
                        const updatedSchedules = [...doctor.schedules, newSchedule];
                        console.log(`更新医生 ${doctorId} 的排班信息:`, updatedSchedules);
                        
                        return {
                            ...doctor,
                            schedules: updatedSchedules
                        };
                    }
                    return doctor;
                });
            });

            setEditingDoctor(null);
            setScheduleForm({
                appointment_price: '',
                start_time: '',
                end_time: ''
            });
            alert('排班信息更新成功！');
        } catch (error: any) {
            console.error('更新排班信息失败:', error);
            alert('更新排班信息失败: ' + error.message);
        }
    };

    // 修改点击"修改排班"按钮的处理函数
    const handleEditScheduleClick = (doctor: Doctor) => {
        console.log('点击修改排班按钮');
        console.log('当前医生信息:', doctor);
        
        setEditingDoctor(doctor);
        const currentSchedule = doctor.schedules[0];
        
        if (currentSchedule) {
            console.log('当前排班信息:', currentSchedule);
            // 将MySQL datetime格式转换为HTML datetime-local格式
            const formatDateTimeForInput = (mysqlDateTime: string) => {
                const formatted = mysqlDateTime.slice(0, 16); // 只保留到分钟
                console.log(`格式化日期时间: ${mysqlDateTime} -> ${formatted}`);
                return formatted;
            };
            
            const formData = {
                appointment_price: String(currentSchedule.appointment_price),
                start_time: formatDateTimeForInput(currentSchedule.start_time),
                end_time: formatDateTimeForInput(currentSchedule.end_time)
            };
            
            console.log('设置表单数据:', formData);
            setScheduleForm(formData);
        } else {
            console.log('无现有排班信息，清空表单');
            setScheduleForm({
                appointment_price: '',
                start_time: '',
                end_time: ''
            });
        }
    };

    // 处理删除医生
    const handleDeleteDoctor = async (doctorId: number) => {
        if (!confirm('确定要删除该医生信息吗？')) {
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/doctors/${doctorId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                throw new Error(`删除失败: ${res.status} ${res.statusText}`);
            }

            setDoctorsData(prev => prev.filter(doctor => doctor.id !== doctorId));
            alert('医生信息已成功删除');
        } catch (error: any) {
            alert('删除医生信息失败: ' + error.message);
        }
    };

    // 处理添加医生
    const handleAddDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm(formData)) {
            return;
        }

        try {
            console.log('当前表单数据:', formData);

            // 1. 首先添加医生信息
            const doctorRequestData = {
                name: formData.name,
                title: formData.title,
                specialty: formData.specialty,
                department: formData.department
            };

            console.log('发送的医生数据:', doctorRequestData);

            const doctorRes = await fetch(`${apiUrl}/doctors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(doctorRequestData),
            });

            if (!doctorRes.ok) {
                const errorData = await doctorRes.json();
                throw new Error(`添加医生失败: ${doctorRes.status} ${doctorRes.statusText} - ${errorData.message}`);
            }

            const doctorData = await doctorRes.json();
            console.log('返回的医生数据:', doctorData);

            // 2. 创建医生的排班信息
            const scheduleRequestData = {
                doctor_id: doctorData.doctorId,
                start_time: new Date().toISOString().split('T')[0] + ' 08:00:00',
                end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 16:00:00'
            };

            console.log('发送的排班数据:', scheduleRequestData);

            const scheduleRes = await fetch(`${apiUrl}/doctorSchedules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(scheduleRequestData),
            });

            if (!scheduleRes.ok) {
                const errorData = await scheduleRes.json();
                throw new Error(`创建排班失败: ${scheduleRes.status} ${scheduleRes.statusText} - ${errorData.message}`);
            }

            const scheduleData = await scheduleRes.json();
            console.log('返回的排班数据:', scheduleData);

            // 3. 获取最新的排班信息
            const latestScheduleRes = await fetch(`${apiUrl}/doctorSchedules/list?doctorId=${doctorData.doctorId}`);
            let schedules: Schedule[] = [];
            if (latestScheduleRes.ok) {
                const latestSchedules = await latestScheduleRes.json();
                schedules = Array.isArray(latestSchedules) ? latestSchedules : [latestSchedules];
                console.log('最新的排班信息:', schedules);
            }

            // 4. 构建完整的医生信息对象
            const processedNewDoctor = {
                id: doctorData.doctorId,
                name: formData.name,
                title: formData.title,
                specialty: formData.specialty,
                department_id: doctorData.department_id,
                schedules: schedules
            };

            setDoctorsData(prev => [...prev, processedNewDoctor]);
            setFormData({ name: '', title: '', specialty: '', department: '' });
            alert(`医生信息添加成功！医生ID: ${doctorData.doctorId}`);

        } catch (error: any) {
            console.error('添加医生失败:', error);
            alert('医生信息添加失败: ' + error.message);
        }
    };

    // 添加时间格式化函数
    const formatTimeRange = (startTime: string, endTime: string) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        return `${start.toLocaleDateString('zh-CN')} ~ ${end.toLocaleDateString('zh-CN')}`;
    };

    if (loading) {
        return <div className="loading">加载中...</div>;
    }

    if (error) {
        return <div className="error">错误: {error}</div>;
    }

    return (
        <div className="department-container">
            <header>
                <h1 id="departmentTitle">医生列表</h1>
                <div className="header-buttons">
                    <Link href="/admin" className="return-btn">返回管理页</Link>
                </div>
            </header>
            
            <div className="doctor-list">
                {doctorsData.map((doctor) => (
                    <div key={doctor.id} className="doctor-card">
                        <h3>{doctor.name}</h3>
                        <p className="doctor-info">职称: {doctor.title}</p>
                        <p className="doctor-info">专长: {doctor.specialty}</p>
                        
                        {/* 排班信息显示 */}
                        <div className="schedule-info">
                            <h4 className="text-lg font-bold mb-2 text-black">排班信息：</h4>
                            {doctor.schedules && doctor.schedules.length > 0 ? (
                                doctor.schedules.map((schedule) => (
                                    <div key={schedule.id} className="schedule-item mb-2 p-2 bg-gray-50 rounded">
                                        <p className="text-black">时间段: {formatTimeRange(schedule.start_time, schedule.end_time)}</p>
                                        <p className="text-black">挂号费: ¥{schedule.appointment_price}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">暂无排班信息</p>
                            )}
                        </div>

                        {editingDoctor?.id === doctor.id ? (
                            <div className="schedule-edit-form my-4 p-4 bg-gray-100 rounded">
                                <h4 className="text-lg font-bold mb-2 text-black">修改排班信息</h4>
                                <div className="flex flex-col gap-2">
                                    <div className="text-black">
                                        <label className="block mb-1">挂号费用：</label>
                                        <input
                                            type="number"
                                            name="appointment_price"
                                            value={scheduleForm.appointment_price}
                                            onChange={handleScheduleChange}
                                            placeholder="请输入挂号费用"
                                            className="w-full px-2 py-1 border rounded text-black placeholder-gray-500"
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                    <div className="text-black">
                                        <label className="block mb-1">开始时间：</label>
                                        <input
                                            type="datetime-local"
                                            name="start_time"
                                            value={scheduleForm.start_time}
                                            onChange={handleScheduleChange}
                                            className="w-full px-2 py-1 border rounded text-black"
                                            required
                                        />
                                    </div>
                                    <div className="text-black">
                                        <label className="block mb-1">结束时间：</label>
                                        <input
                                            type="datetime-local"
                                            name="end_time"
                                            value={scheduleForm.end_time}
                                            onChange={handleScheduleChange}
                                            className="w-full px-2 py-1 border rounded text-black"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <button 
                                            onClick={() => handleUpdateSchedule(doctor.id)}
                                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            保存
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setEditingDoctor(null);
                                                setScheduleForm({
                                                    appointment_price: '',
                                                    start_time: '',
                                                    end_time: ''
                                                });
                                            }}
                                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            取消
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={() => handleEditScheduleClick(doctor)}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2"
                            >
                                修改排班
                            </button>
                        )}
                        
                        <button 
                            className="delete-btn bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => handleDeleteDoctor(doctor.id)}
                        >
                            删除信息
                        </button>
                    </div>
                ))}
            </div>
            
            <div className="doctor-list">
                <div className="doctor-card">
                    <h3>添加新医生</h3>
                    <form onSubmit={handleAddDoctor}>
                        <div>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="请输入医生姓名"
                                className={`input-field ${formError.name ? 'border-red-500' : ''}`}
                            />
                            {formError.name && <span className="text-red-500 text-sm">{formError.name}</span>}
                        </div>
                        
                        <div>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="请输入医生职称"
                                className={`input-field ${formError.title ? 'border-red-500' : ''}`}
                            />
                            {formError.title && <span className="text-red-500 text-sm">{formError.title}</span>}
                        </div>
                        
                        <div>
                            <select
                                name="specialty"
                                value={formData.specialty}
                                onChange={handleInputChange}
                                className={`input-field ${formError.specialty ? 'border-red-500' : ''}`}
                            >
                                <option value="">请选择专长</option>
                                {specialties.map((specialty) => (
                                    <option key={specialty} value={specialty}>
                                        {specialty}
                                    </option>
                                ))}
                            </select>
                            {formError.specialty && <span className="text-red-500 text-sm">{formError.specialty}</span>}
                        </div>

                        <div>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleInputChange}
                                className={`input-field ${formError.department ? 'border-red-500' : ''}`}
                            >
                                <option value="">请选择科室</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.name}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                            {formError.department && <span className="text-red-500 text-sm">{formError.department}</span>}
                        </div>
                        
                        <button 
                            type="submit" 
                            className="add-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            添加
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DoctorDeletePage;