/*'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import '../../../style.css';

// 定义文章（公告）类型
type Article = {
    id: number;
    title: string;
    content: string;
};

const AddArticle = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState<string | null>(null);

    // 从环境变量获取API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://121.40.80.144:3001/api';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) {
            setError('标题和内容不能为空');
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/articles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    content,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(`添加公告失败: ${res.status} ${res.statusText} - ${errorData.message}`);
            }

            alert('公告添加成功');
            setTitle('');
            setContent('');
            setError(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="admin-container">
            <header>
                <h1>添加公告</h1>
                <div className="header-buttons">
                    <Link href="/admin" className="return-btn">返回管理页</Link>
                </div>
            </header>
            <div className="admin-form">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <h3><label htmlFor="title">标题：</label></h3>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="form-group">
                       <h3><label htmlFor="content">内容：</label></h3>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    {error && <div className="error">{error}</div>}
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
                    >
                        添加
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddArticle;*/

'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import '../../../style.css';

// 定义文章（公告）类型
type Article = {
    id: number;
    title: string;
    content: string;
};

const AddArticle = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // 从环境变量获取API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://121.40.80.144:3001';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) {
            setError('标题和内容不能为空');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('未登录，请先登录');
            }

            const res = await fetch(`${apiUrl}/api/articles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    content,
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                let errorMessage;
                try {
                    // 尝试解析错误响应为 JSON
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message;
                } catch {
                    // 如果不是 JSON，直接使用错误文本
                    errorMessage = errorText;
                }
                throw new Error(`添加公告失败: ${res.status} ${res.statusText} - ${errorMessage}`);
            }

            const data = await res.json();
            alert('公告添加成功');
            setTitle('');
            setContent('');
            setError(null);
        } catch (err: any) {
            console.error('添加公告失败:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-container">
            <header>
                <h1>添加公告</h1>
                <div className="header-buttons">
                    <Link href="/admin" className="return-btn">返回管理页</Link>
                </div>
            </header>
            <div className="admin-form">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <h3><label htmlFor="title">标题：</label></h3>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="form-group">
                       <h3><label htmlFor="content">内容：</label></h3>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            rows={10}
                            required
                        />
                    </div>
                    {error && <div className="error">{error}</div>}
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
                        disabled={loading}
                    >
                        {loading ? '添加中...' : '添加'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddArticle;