//models/article.js
const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 创建文章表 (如果不存在)
async function createTable() {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS articles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                author VARCHAR(255),
                pageviews INT DEFAULT 0,
                attachments JSON
            )
        `;
        await pool.query(sql);
        console.log('文章表创建成功');
    } catch (err) {
        console.error('创建文章表失败：', err);
        throw err;
    }
}

// 获取所有文章
async function getAllArticles(page = 1, pageSize = 10) {
    try {
        // 获取总记录数
        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM articles');
        const total = countResult[0].total;

        // 计算偏移量
        const offset = (page - 1) * pageSize;

        // 获取分页数据
        const sql = `
            SELECT *
            FROM articles
            ORDER BY publish_date DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await pool.query(sql, [pageSize, offset]);

        return {
            articles: rows,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        };
    } catch (err) {
        console.error('获取文章列表失败：', err);
        throw err;
    }
}

// 获取文章详情
async function getArticleById(articleId) {
    if (!articleId || isNaN(articleId)) {
        throw new Error('文章ID不合法');
    }

    const sql = `
        SELECT *
        FROM articles
        WHERE id = ?
    `;
    const values = [articleId];

    try {
        const [rows] = await pool.query(sql, values);
        return rows[0] || null;
    } catch (err) {
        console.error('获取文章详情失败：', err);
        throw err;
    }
}

// 添加文章
async function addArticle(title, content, author = null, attachments = null) {
    const sql = `
        INSERT INTO articles (title, content, author, attachments)
        VALUES (?, ?, ?, ?)
    `;
    const values = [title, content, author, attachments ? JSON.stringify(attachments) : null];

    try {
        const [result] = await pool.query(sql, values);
        return result.insertId;
    } catch (err) {
        console.error('添加文章失败：', err);
        throw err;
    }
}

// 更新文章浏览量
async function incrementPageviews(articleId) {
    if (!articleId || isNaN(articleId)) {
        throw new Error('文章ID不合法');
    }

    const sql = `
        UPDATE articles
        SET pageviews = pageviews + 1
        WHERE id = ?
    `;
    const values = [articleId];

    try {
        await pool.query(sql, values);
    } catch (err) {
        console.error('更新文章浏览量失败：', err);
        throw err;
    }
}

// 删除文章
async function deleteArticle(articleId) {
    console.log('开始执行 deleteArticle 函数');
    console.log('要删除的文章ID:', articleId);

    if (!articleId || isNaN(articleId)) {
        console.log('文章ID不合法');
        throw new Error('文章ID不合法');
    }

    const sql = `
        DELETE FROM articles
        WHERE id = ?
    `;
    const values = [articleId];
    console.log('SQL查询:', sql);
    console.log('查询参数:', values);

    try {
        console.log('执行数据库查询...');
        const [result] = await pool.query(sql, values);
        console.log('查询结果:', result);
        console.log('受影响的行数:', result.affectedRows);
        return result.affectedRows > 0;
    } catch (err) {
        console.error('删除文章失败：', err);
        throw err;
    }
}

module.exports = {
    createTable,
    getAllArticles,
    getArticleById,
    addArticle,
    incrementPageviews,
    deleteArticle
};

// 在应用启动时创建文章表
createTable(); 
