'use client';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import '../../style.css';

type Department = {
    id: number;
    name: string;
};

const DepartmentsPage = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [newDepartment, setNewDepartment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // 从环境变量获取API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://121.40.80.144:3001/api';

    // 加载科室数据
    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const res = await fetch(`${apiUrl}/departments`);
            if (!res.ok) {
                throw new Error(`获取科室列表失败: ${res.status} ${res.statusText}`);
            }
            const data = await res.json();
            setDepartments(data);
        } catch (err: any) {
            setError(err.message);
            console.error('获取科室列表失败:', err);
        } finally {
            setLoading(false);
        }
    };

    // 处理删除科室
    const handleDeleteDepartment = async (id: number) => {
        if (!confirm('确定要删除该科室吗？删除后相关医生信息可能受影响。')) {
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/departments/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                throw new Error(`删除科室失败: ${res.status} ${res.statusText}`);
            }

            setDepartments(prev => prev.filter(dept => dept.id !== id));
            alert('科室删除成功');
        } catch (err: any) {
            alert(`删除科室失败: ${err.message}`);
        }
    };

    // 表单验证
    const validateForm = () => {
        if (!newDepartment.trim()) {
            setFormError('请输入科室名称');
            return false;
        }

        if (departments.some(dept => dept.name === newDepartment.trim())) {
            setFormError('该科室名称已存在');
            return false;
        }

        setFormError(null);
        return true;
    };

    // 处理添加科室
    const handleAddDepartment = async () => {
        if (!validateForm()) return;

        try {
            const res = await fetch(`${apiUrl}/departments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newDepartment.trim(),
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(`添加科室失败: ${res.status} ${res.statusText} - ${errorData.message}`);
            }

            const newDept: Department = await res.json();
            setDepartments(prev => [...prev, newDept]);
            setNewDepartment('');
            alert('科室添加成功');
        } catch (err: any) {
            alert(`添加科室失败: ${err.message}`);
        }
    };

    // 处理回车键提交
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleAddDepartment();
        }
    };

    return (
        <div className="departments-container">
            <header>
                <h1>科室信息管理</h1>
                <div className="header-buttons">
                    <Link href="/admin" className="return-btn">返回管理页</Link>
                </div>
            </header>

            {loading && (
                <div className="loading">加载中...</div>
            )}

            {error && (
                <div className="error">错误: {error}</div>
            )}

            <div className="doctor-list">
                {departments.map((dept) => (
                    <div key={dept.id} className="doctor-card">
                        <h3>{dept.name}</h3>
                        <button 
                            className="delete-btn bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => handleDeleteDepartment(dept.id)}
                        >
                            删除信息 
                        </button>
                    </div>
                ))}
            </div>

            <div className="doctor-list">
                <div className="doctor-card">
                    <h3>添加新科室</h3>
                    <div className="input-container">
                        <input
                            type="text"
                            placeholder="请输入科室名称"
                            value={newDepartment}
                            onChange={(e) => {
                                setNewDepartment(e.target.value);
                                setFormError(null); // 输入时清除错误
                            }}
                            onKeyDown={handleKeyDown}
                            className={`input-field ${formError ? 'border-red-500' : ''}`}
                        />
                        {formError && (
                            <span className="error-message text-red-500">{formError}</span>
                        )}
                    </div>
                    <button 
                        onClick={handleAddDepartment} 
                        className="add-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        disabled={!newDepartment.trim()}
                    >
                        添加
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DepartmentsPage;