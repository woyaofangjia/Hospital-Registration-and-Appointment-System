// routes/article.js

const express = require('express');
const router = express.Router();
const articleModel = require('../models/article');
const verifyToken = require('../middleware/auth');

console.log('Article routes are being initialized');

// 获取文章列表
router.get('/', async (req, res) => {
    console.log('GET /api/articles 路由被触发');
    console.log('Request URL:', req.originalUrl);
    console.log('Request method:', req.method);
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        console.log('Fetching articles with page:', page, 'pageSize:', pageSize);
        const result = await articleModel.getAllArticles(page, pageSize);
        console.log('Articles fetched successfully:', result);
        res.json(result);
    } catch (err) {
        console.error('获取文章列表失败:', err);
        res.status(500).json({ message: '获取文章列表失败' });
    }
    console.log('GET /api/articles 路由处理完成');
});

// 获取文章详情
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const articleId = parseInt(id, 10);

    if (isNaN(articleId)) {
        return res.status(400).json({ message: '文章ID不合法' });
    }

    try {
        const article = await articleModel.getArticleById(articleId);

        if (!article) {
            return res.status(404).json({ message: '文章不存在' });
        }

        // 增加浏览量
        await articleModel.incrementPageviews(articleId);

        res.json(article);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '获取文章详情失败' });
    }
});

// 添加文章
router.post('/', verifyToken, async (req, res) => {
    const { title, content, author, attachments } = req.body;

    // 验证必填字段
    if (!title || !content) {
        return res.status(400).json({ message: '标题和内容不能为空' });
    }

    try {
        const articleId = await articleModel.addArticle(title, content, author, attachments);

        if (!articleId) {
            return res.status(500).json({ message: '添加文章失败' });
        }

        res.status(201).json({ message: '添加文章成功', articleId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '添加文章失败' });
    }
});

// 删除文章
router.delete('/:id', verifyToken, async (req, res) => {
    console.log('DELETE /api/articles/:id 路由被触发');
    console.log('Request URL:', req.originalUrl);
    console.log('Request method:', req.method);
    console.log('Request params:', req.params);
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('User:', req.user);
    console.log('Authorization header:', req.headers.authorization);
    
    const { id } = req.params;
    const articleId = parseInt(id, 10);
    console.log('要删除的文章ID:', articleId);

    if (isNaN(articleId)) {
        console.log('文章ID不合法');
        return res.status(400).json({ message: '文章ID不合法' });
    }

    try {
        console.log('开始删除文章...');
        const deleted = await articleModel.deleteArticle(articleId);
        console.log('删除结果:', deleted);

        if (!deleted) {
            console.log('文章不存在');
            return res.status(404).json({ message: '文章不存在' });
        }

        console.log('文章删除成功');
        res.json({ message: '删除文章成功' });
    } catch (err) {
        console.error('删除文章失败:', err);
        res.status(500).json({ message: '删除文章失败' });
    }
});

module.exports = router;