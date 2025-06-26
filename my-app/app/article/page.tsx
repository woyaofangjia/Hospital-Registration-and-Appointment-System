'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import '../style.css';

const API_BASE = 'http://121.40.80.144:3001';

type Article = {
    id: number;
    title: string;
    content: string;
    publish_date: string;
    author?: string;
    pageviews: number;
    attachments?: string[];
};
/*
//接入后端后拓展的文章类型
// type Article = {
  id: number;
  title: string;
  content: string;
  publish_date: string;     // 新增字段
  author?: string;          // 可选字段
  pageviews: number;        // 浏览次数
  attachments?: string[];   // 附件列表
};*/

const ArticlePage = () => {
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const idParam = searchParams.get('id');
    const articleId = idParam !== null ? parseInt(idParam, 10) : null;

    useEffect(() => {
        const fetchArticle = async () => {
             console.log('fetchArticles 函数被调用');
            if (!articleId || isNaN(articleId)) {
                setError('文章ID不合法');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const res = await fetch(`${API_BASE}/api/articles/${articleId}`);
               
                if (!res.ok) {
                    if (res.status === 404) throw new Error('文章不存在');
                    throw new Error(`HTTP错误! 状态码: ${res.status}`);
                }
                
                const data: Article = await res.json();
                  console.log('从后端 API 获取到的文章数据:', data);
                // 数据格式校验
                if (!data.id || !data.title || !data.content) {
                    throw new Error('返回数据格式错误');
                }

                setArticle(data);
                  console.log('articles 状态被更新:', data);
            } catch (err) {
                setError(err instanceof Error ? err.message : '获取文章失败');
                console.error('获取公告数据失败:', error);
            } finally {
                setLoading(false);
            }
            console.log('fetchArticles 函数调用完成');
        };

        fetchArticle();
    }, [articleId]);

    if (loading) return <div className="loading">加载中...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!article) return <div className="error">未找到文章</div>;

    return (
        <div className="article-container">
            <header>
                <h1>医院公告详情</h1>
                <Link href="/" className="return-btn">返回首页</Link>
            </header>
            <div className="article-content">
                <h2>{article.title}</h2>
                <div className="article-meta">
                    {article.author && <span>作者: {article.author}</span>}
                    <span>发布时间: {new Date(article.publish_date).toLocaleDateString()}</span>
                    <span>浏览次数: {article.pageviews}</span>
                </div>
                <div className="article-body">{article.content}</div>
                {article.attachments && article.attachments.length > 0 && (
                    <div className="article-attachments">
                        <h3>附件</h3>
                        <ul>
                            {article.attachments.map((attachment, index) => (
                                <li key={index}>
                                    <a href={attachment} target="_blank" rel="noopener noreferrer">
                                        附件 {index + 1}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

//增加一个边界错误处理模块
export default ArticlePage;