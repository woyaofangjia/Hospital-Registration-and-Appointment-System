// pages/department/adminis.js

'use client';

import '../../style.css';

import React, { useState, useEffect } from 'react';

const API_BASE = 'http://121.40.80.144:3001/api'; // Use public server address

interface Department {
    id: number;
    name: string;
}

const AdminPage = () => {
    const [name, setName] = useState('');
    const [title, setTitle] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [department, setDepartment] = useState('');
    const [departments, setDepartments] = useState<Department[]>([]);
    const [newDepartment, setNewDepartment] = useState(''); // 新科室名称

    useEffect(() => {
        // 获取科室列表
        const fetchDepartments = async () => {
            try {
                const res = await fetch(`${API_BASE}/departments`); // Use constant
                if (!res.ok) {
                    throw new Error(`Failed to fetch departments: ${res.status} ${res.statusText}`);
                }
                const data = await res.json();
                setDepartments(data);
            } catch (error: any) {
                console.error('Failed to fetch departments:', error);
                alert('Failed to fetch departments: ' + error.message);
            }
        };

        fetchDepartments();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/doctors`, { // Use constant
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    title,
                    specialty,
                    department,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(`Failed to add doctor: ${res.status} ${res.statusText} - ${errorData.message}`);
            }

            const responseData = await res.json();
            alert(`医生信息添加成功！医生ID: ${responseData.doctorId}`);

        } catch (error: any) {
            alert('医生信息添加失败: ' + error.message);
        }
    };

    const handleAddDepartment = async () => {
        try {
            const res = await fetch(`${API_BASE}/departments`, { // Use constant
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newDepartment,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(`Failed to add department: ${res.status} ${res.statusText} - ${errorData.message}`);
            }

            const responseData = await res.json();
            alert(`科室添加成功！科室ID: ${responseData.departmentId}`);
            setNewDepartment(''); // 清空输入框
            // 重新获取科室列表
            const fetchDepartments = async () => {
                try {
                    const res = await fetch(`${API_BASE}/departments`); // Use constant
                    if (!res.ok) {
                        throw new Error(`Failed to fetch departments: ${res.status} ${res.statusText}`);
                    }
                    const data = await res.json();
                    setDepartments(data);
                } catch (error: any) {
                    console.error('Failed to fetch departments:', error);
                    alert('Failed to fetch departments: ' + error.message);
                }
            };

            fetchDepartments();

        } catch (error: any) {
            alert('科室添加失败: ' + error.message);
        }
    };

    return (
        <div className="department-container">
            <header>
                <h1 id="departmentTitle">管理医生信息</h1>
            </header>
            <div className="admin-form">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">姓名：</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="title">职称：</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="specialty">专长：</label>
                        <input
                            type="text"
                            id="specialty"
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="department">科室：</label>
                        <select
                            id="department"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                        >
                            <option value="">请选择科室</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.name}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="submit-btn">添加医生</button>
                </form>
                {/* 添加科室 */}
                <div className="add-department">
                    <label htmlFor="newDepartment">添加新科室：</label>
                    <input
                        type="text"
                        id="newDepartment"
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                    />
                    <button onClick={handleAddDepartment} className="add-department-btn">添加科室</button>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;