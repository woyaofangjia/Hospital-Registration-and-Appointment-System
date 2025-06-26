/*
'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import '../../../style.css';

// 定义文章（公告）类型
type Article = {
    id: number;
    title: string;
    content: string;
};

const DeleteArticle = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 从环境变量获取API URL，或使用远程服务器地址作为默认值
    //const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://121.40.80.144:3001/api';
    //const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiUrl = `${baseUrl}/api`;  // 确保包含 /api 路径
    console.log('当前使用的API URL:', apiUrl); // 添加调试日志

    useEffect(() => {
        const fetchArticles = async () => {
            console.log('fetchArticles 函数被调用');
            try {
                const token = localStorage.getItem('token'); // 获取 token

                const res = await fetch(`${apiUrl}/articles`, { // 确保 API 路径正确
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

        fetchArticles();
    }, [apiUrl]);

    const handleDeleteArticle = async (id: number) => {
    if (!confirm('确定要删除该公告吗？')) {
        return;
    }

    try {
        const token = localStorage.getItem('token'); // 获取token
        
        const res = await fetch(`${apiUrl}/articles/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}` // 添加认证头
            },
            signal: AbortSignal.timeout(10000) // 添加超时设置
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`删除公告失败: ${res.status} ${res.statusText}\n${errorText}`);
        }

        setArticles(prev => prev.filter(article => article.id !== id));
        alert('公告删除成功');
    } catch (err: any) {
        console.error('删除公告失败:', err);
        alert(`删除公告失败: ${err.message}`);
    }
};

    return (
        <div className="admin-container">
            <header>
                <h1>删除公告</h1>
                <div className="header-buttons">
                    <Link href="/admin" className="return-btn">返回管理页</Link>
                </div>
            </header>
            {loading && <div className="loading"></div>}
            {error && <div className="error">{error}</div>}
            <div className="doctor-list">
                {articles.map((article) => (
                    <div key={article.id} className="doctor-card">
                        <h3>{article.title}</h3>
                        <button
                            className="delete-btn bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => handleDeleteArticle(article.id)}
                        >
                            删除
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeleteArticle;
*/

'use client';
import React, { useEffect, useState,useMemo,useCallback } from 'react';
import Link from 'next/link';
import '../../../style.css';

// 定义文章（公告）类型
type Article = {
    id: number;
    title: string;
    content: string;
};

const DeleteArticle = () => {
    console.log('DeleteArticle component rendering');
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 使用 useMemo 缓存 API URL
    const baseUrl = useMemo(() => 
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', 
        []
    );
    const apiUrl = useMemo(() => `${baseUrl}/api`, [baseUrl]);
    
    console.log('当前使用的API URL:', apiUrl);

    // 使用 useCallback 缓存 fetchArticles 函数
    const fetchArticles = useCallback(async () => {
        console.log('fetchArticles 函数被调用');
        setLoading(true);
        console.log('设置 loading 状态为 true');
        
        try {
            const token = localStorage.getItem('token');
            console.log('从 localStorage 获取到的 token:', token ? '存在' : '不存在');

            console.log('开始发送请求到:', `${apiUrl}/articles`);
            const res = await fetch(`${apiUrl}/articles`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                signal: AbortSignal.timeout(10000)
            });
            console.log('收到响应:', res.status, res.statusText);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('API 响应错误:', res.status, res.statusText, errorText);
                throw new Error(`获取公告数据失败: ${res.status} ${res.statusText}\n${errorText}`);
            }

            const data = await res.json();
            console.log('从后端 API 获取到的原始数据:', data);
            console.log('articles 数组长度:', data.articles?.length || 0);
            setArticles(data.articles || []);
            console.log('articles 状态更新完成，当前文章数:', data.articles?.length || 0);
        } catch (error: any) {
            console.error('获取公告数据失败，详细错误:', error);
            console.error('错误类型:', error.name);
            console.error('错误消息:', error.message);
            console.error('错误堆栈:', error.stack);

            if (error.name === 'AbortError') {
                console.log('请求超时，设置超时错误消息');
                setError('请求公告数据超时，请检查网络连接');
            } else if (error.message.includes('Failed to fetch')) {
                console.log('网络连接错误，设置网络错误消息');
                setError('无法连接到服务器，请检查：\n1. 服务器是否正在运行\n2. 网络连接是否正常\n3. 服务器地址是否正确');
            } else {
                console.log('其他错误，设置通用错误消息');
                setError(error.message);
            }

            // 使用模拟数据作为后备
            const mockArticles = [
                { id: 1, title: '【最新】五一假期门诊安排通知', content: '五一期间门诊正常开放...' },
                { id: 2, title: '新引进 CT 设备正式投入使用', content: '我院最新引进的256层螺旋CT...' }
            ];
            console.log('使用模拟数据作为后备:', mockArticles);
            setArticles(mockArticles);
            console.log('articles 状态被更新为模拟数据');
        } finally {
            setLoading(false);
            console.log('设置 loading 状态为 false');
        }
        console.log('fetchArticles 函数调用完成');
    }, [apiUrl]);

    useEffect(() => {
        console.log('useEffect triggered with apiUrl:', apiUrl);
        fetchArticles();
    }, [fetchArticles]);

    const handleDeleteArticle = async (id: number) => {
        console.log('开始删除文章，ID:', id);
        if (!confirm('确定要删除该公告吗？')) {
            console.log('用户取消删除操作');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            console.log('Token:', token);
            console.log('删除操作使用的 token:', token ? '存在' : '不存在');
            
            console.log('发送删除请求到:', `${apiUrl}/articles/${id}`);
            const res = await fetch(`${apiUrl}/articles/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: AbortSignal.timeout(10000)
            });
            console.log('删除请求响应状态:', res.status, res.statusText);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('删除请求失败:', res.status, res.statusText, errorText);
                throw new Error(`删除公告失败: ${res.status} ${res.statusText}\n${errorText}`);
            }

            console.log('删除成功，更新本地状态');
            setArticles(prev => {
                const newArticles = prev.filter(article => article.id !== id);
                console.log('更新后的文章数量:', newArticles.length);
                return newArticles;
            });
            alert('公告删除成功');
        } catch (err: any) {
            console.error('删除公告失败，详细错误:', err);
            console.error('错误类型:', err.name);
            console.error('错误消息:', err.message);
            console.error('错误堆栈:', err.stack);
            
            // 更友好的错误提示
            let errorMessage = '删除失败，请稍后重试';
            if (err.message.includes('404')) {
                errorMessage = '要删除的文章不存在或已被删除';
            } else if (err.message.includes('401')) {
                errorMessage = '登录已过期，请重新登录';
            } else if (err.message.includes('403')) {
                errorMessage = '没有权限删除该文章';
            }
            alert(errorMessage);
        }
    };

    // 使用 useMemo 缓存渲染状态日志
    const renderState = useMemo(() => ({
        loading,
        error,
        articlesCount: articles.length
    }), [loading, error, articles.length]);

    console.log('组件渲染状态:', renderState);

    return (
        <div className="admin-container">
            <header>
                <h1>删除公告</h1>
                <div className="header-buttons">
                    <Link href="/admin" className="return-btn">返回管理页</Link>
                </div>
            </header>
            {loading && <div className="loading"></div>}
            {error && <div className="error">{error}</div>}
            <div className="doctor-list">
                {articles.map((article) => (
                    <div key={article.id} className="doctor-card">
                        <h3>{article.title}</h3>
                        <button
                            className="delete-btn bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => handleDeleteArticle(article.id)}
                        >
                            删除
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeleteArticle;