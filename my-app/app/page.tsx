'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import './style.css';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { Layout } from 'antd';

// API 基础 URL
const API_BASE = 'http://121.40.80.144:3001/api';

type Department = {
    id: number;
    name: string;
};

type Article = {
    id: number;
    title: string;
    content: string;
};

const HomePage = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [articles, setArticles] = useState<Article[]>([]); // 确保 articles 状态被初始化为空数组
    const [loading, setLoading] = useState(true); // 添加 loading 状态
    const [error, setError] = useState<string | null>(null); // 添加 error 状态
    const router = useRouter();

    // Images for the slider
    const images = ['/hospital-image.png', '/hospital2.jpg', '/whu.jpg'];
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const nextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    useEffect(() => {
        // 检查登录状态
        const checkLoginStatus = () => {
            const token = localStorage.getItem('token');
            const userInfo = localStorage.getItem('userInfo');
            const adminStatus = localStorage.getItem('isAdmin');
            setIsLoggedIn(!!(token && userInfo));
            setIsAdmin(adminStatus === 'true');
        };

        checkLoginStatus();

        // 获取公告数据
        const fetchArticles = async () => {
            console.log('fetchArticles 函数被调用');
            try {
                const token = localStorage.getItem('token'); // 获取 token

                const res = await fetch(`${API_BASE}/articles`, { // 确保 API 路径正确
                    headers: {
                        'Authorization': `Bearer ${token}` // 添加认证头
                    },
                    signal: AbortSignal.timeout(10000) // 10秒超时
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`获取公告数据失败: ${res.status} ${res.statusText}\n${errorText}`);
                }

                const data = await res.json();
                console.log('从后端 API 获取到的文章数据:', data);
                setArticles(data.articles); // 只设置 articles 属性
                console.log('articles 状态被更新:', data.articles);
            } catch (error: any) {
                console.error('获取公告数据失败:', error);
                if (error.name === 'AbortError') {
                    setError('请求公告数据超时，请检查网络连接');
                } else if (error.message.includes('Failed to fetch')) {
                    setError('无法连接到服务器，请检查：\n1. 服务器是否正在运行\n2. 网络连接是否正常\n3. 服务器地址是否正确');
                } else {
                    setError(error.message);
                }
                // 使用模拟数据作为后备
                const mockArticles = [
                    { id: 1, title: '【最新】五一假期门诊安排通知', content: '五一期间门诊正常开放...' },
                    { id: 2, title: '新引进 CT 设备正式投入使用', content: '我院最新引进的256层螺旋CT...' }
                ];
                console.log('使用模拟数据作为后备:', mockArticles);
                setArticles(mockArticles);
                console.log('articles 状态被更新:', mockArticles);
            }
            console.log('fetchArticles 函数调用完成');
        };

        // 获取科室数据
        const fetchDepartments = async () => {
            try {
                const token = localStorage.getItem('token'); // 获取 token

                const res = await fetch(`${API_BASE}/departments`, {
                    headers: {
                        'Authorization': `Bearer ${token}` // 添加认证头
                    },
                    signal: AbortSignal.timeout(10000) // 10秒超时
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`获取科室数据失败: ${res.status} ${res.statusText}\n${errorText}`);
                }

                const data = await res.json();
                setDepartments(data);
            } catch (error: any) {
                console.error('获取科室数据失败:', error);
                if (error.name === 'AbortError') {
                    setError('请求科室数据超时，请检查网络连接');
                } else if (error.message.includes('Failed to fetch')) {
                    setError('无法连接到服务器，请检查：\n1. 服务器是否正在运行\n2. 网络连接是否正常\n3. 服务器地址是否正确');
                } else {
                    setError(error.message);
                }
                // 使用模拟数据作为后备
                const mockDepartments = [
                    { id: 1, name: '内科门诊' },
                    { id: 2, name: '外科门诊' },
                    { id: 3, name: '儿科门诊' },
                    { id: 4, name: '妇产科门诊' },
                    { id: 5, name: '急诊科' }
                ];
                setDepartments(mockDepartments);
            }
        };

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                await Promise.all([
                    fetchDepartments(),
                    fetchArticles()
                ]);
            } catch (error: any) {
                console.error('获取数据失败:', error);
                setError('获取数据失败，请检查网络连接或服务器状态');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const navigateToDepartment = (deptName: string) => {
        if (!isLoggedIn) {
            alert('请先登录后再进行挂号');
            router.push('/login');
            return;
        }
        router.push(`/department?department=${encodeURIComponent(deptName)}`);
    };

    if (loading) {
        return <div className="loading">加载中...</div>; // 添加 loading 提示
    }

    if (error) {
        return <div className="error-message">错误：{error}</div>; // 添加错误提示
    }

   return (
  <div>
    {/* 添加网页标题 */}
    <Head>
      <title>奔向暑假医院预约挂号系统</title>
      <meta name="description" content="医疗预约挂号平台" />
    </Head>
    
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px' }}>
      <h1>奔向暑假医院预约挂号系统</h1>
      <div className="header-buttons" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {isLoggedIn ? (
          isAdmin ? (
            <Link href="/admin" className="admin-btn">管理后台</Link>
          ) : (
            <Link href="/profile" className="login-btn">个人中心</Link>
          )
        ) : (
          <Link href="/login" className="login-btn">用户登录</Link>
        )}
      </div>
    </header>
    
    <div className="hospital-image-slider">
      <button onClick={prevImage} className="slider-button prev">&#10094;</button>
      <img
        src={images[currentImageIndex]}
        alt={`Hospital Image ${currentImageIndex + 1}`}
        className="slider-image"
      />
      <button onClick={nextImage} className="slider-button next">&#10095;</button>
    </div>
    
    <div className="guide-section">
      <Link href="/guide" className="guide-dialog">自助导诊入口 ▶</Link>
    </div>
    
    <div className="main-content">
      <div className="registration-section">
        <h2>门诊挂号</h2>
        <ul>
          {departments.map((dept) => (
            <li key={dept.id} onClick={() => navigateToDepartment(dept.name)}>
              {dept.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="notice-section">
        <h2>医院公告</h2>
        <ul>
          {articles.map((article) => (
            <li key={article.id}>
              <Link href={`/article?id=${article.id}`}>
                {article.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
    
    {/* 添加网页脚注 */}
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>联系我们</h3>
          <p>地址：湖北省武汉市洪山区珞瑜路100号</p>
          <p>电话：0755-88889999</p>
          <p>邮箱：hospital@whu.com</p>
        </div>
        
        <div className="footer-section">
          <h3>服务时间</h3>
          <p>门诊：8:00-18:00（全年无休）</p>
          <p>急诊：24小时开放</p>
          <p>行政：周一至周五 9:00-17:30</p>
        </div>
        
        <div className="footer-section">
          <h3>快速链接</h3>
          <ul>
            <li><Link href="/about">关于我们</Link></li>
            <li><Link href="/guide">就诊指南</Link></li>
            <li><Link href="/privacy">隐私政策</Link></li>
            <li><Link href="/terms">服务条款</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>WHU@ {new Date().getFullYear()} 奔向暑假团队 </p>
      </div>
    </footer>
  </div>
    );
};

export default HomePage;