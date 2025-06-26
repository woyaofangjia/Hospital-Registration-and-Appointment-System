// hospital/app/admin/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 定义医生类型
type Doctor = {
    id: number;
    name: string;
    title: string;
    specialty: string;
};

// 定义文章（公告）类型
type Article = {
    id: number;
    title: string;
    content: string;
};

const AdminPage = () => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const router = useRouter();

    useEffect(() => {
        // 模拟获取医生数据
        const mockDoctors: Doctor[] = [
            { id: 1, name: '王强', title: '主任医师', specialty: '高血压门诊' },
            { id: 2, name: '李明', title: '副主任医师', specialty: '消化内科' },
            { id: 3, name: '张华', title: '主治医师', specialty: '呼吸内科' }
        ];
        setDoctors(mockDoctors);

        // 模拟获取公告数据
        const mockArticles: Article[] = [
            { id: 1, title: '【最新】五一假期门诊安排通知', content: '五一期间门诊正常开放...' },
            { id: 2, title: '新引进 CT 设备正式投入使用', content: '我院最新引进的256层螺旋CT...' }
        ];
        setArticles(mockArticles);
    }, []);

    const handleLogout = () => {
        // 清除认证状态
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('isAdmin');
        // 返回首页
        router.push('/');
    };

    return (
        <div className="admin-container">
            <header>
                <h1>管理员页面</h1>
                <div className="header-buttons">
                    <Link href="/" className="return-btn">返回首页</Link>
                    <button 
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        onClick={handleLogout}
                    >
                        退出登录
                    </button>
                </div>
            </header>
            <div className="main-content">
                <div className="registration-section">
                    <h2>管理挂号信息</h2>
                    <ul>
                        <li>
                            <Link href="/admin/doctors" className="btn">管理医生信息</Link>
                        </li>
                        <li>
                            <Link href="/admin/departments" className="btn">管理科室信息</Link>
                        </li>
                    </ul>
                </div>
                <div className="notice-section">
                    <h2>管理公告</h2>
                    <ul>
                        <li>
                            <Link href="/admin/articles/add" className="btn">添加公告</Link>
                        </li>
                        <li>
                            <Link href="/admin/articles/delete" className="btn">删除公告</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;