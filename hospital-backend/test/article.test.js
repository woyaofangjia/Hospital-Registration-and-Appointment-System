const request = require('supertest');
const express = require('express');
const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');
const articleRoutes = require('../routes/article');

describe('Article API', () => {
    let connection;
    let testArticleId;
    let app;
    let server;

    // 在所有测试之前设置服务器
    beforeAll(async () => {
        app = express();
        app.use(express.json());
        app.use('/api/articles', articleRoutes);
        server = app.listen(3002); // 使用不同的测试端口
    });

    // 在所有测试之后关闭服务器
    afterAll(async () => {
        await new Promise((resolve) => {
            server.close(resolve);
        });
    });

    // 在每个测试用例之前，清空数据库并添加测试数据
    beforeEach(async () => {
        try {
            connection = await mysql.createConnection(dbConfig);
            console.log('数据库连接成功！');

            // 清空文章表
            await connection.execute('DELETE FROM articles');

            // 创建测试数据并保存ID
            const [result] = await connection.execute(
                'INSERT INTO articles (title, content, author, pageviews) VALUES (?, ?, ?, ?)',
                ['测试文章1', '这是测试文章1的内容', '测试作者', 0]
            );
            testArticleId = result.insertId;

            // 添加更多测试文章
            await connection.execute(
                'INSERT INTO articles (title, content, author, pageviews) VALUES (?, ?, ?, ?)',
                ['测试文章2', '这是测试文章2的内容', '测试作者', 0]
            );
            await connection.execute(
                'INSERT INTO articles (title, content, author, pageviews) VALUES (?, ?, ?, ?)',
                ['测试文章3', '这是测试文章3的内容', '测试作者', 0]
            );
        } catch (error) {
            console.error('Error during beforeEach:', error);
            throw error;
        }
    });

    // 在每个测试用例之后，关闭数据库连接
    afterEach(async () => {
        if (connection) {
            await connection.close();
            console.log('数据库连接已关闭！');
        }
    });

    describe('GET /api/articles', () => {
        it('should return paginated articles', async () => {
            const response = await request(app).get('/api/articles');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('articles');
            expect(response.body).toHaveProperty('pagination');
            expect(Array.isArray(response.body.articles)).toBe(true);
            expect(response.body.pagination).toHaveProperty('total');
            expect(response.body.pagination).toHaveProperty('page');
            expect(response.body.pagination).toHaveProperty('pageSize');
            expect(response.body.pagination).toHaveProperty('totalPages');
        });

        it('should return correct number of articles per page', async () => {
            const response = await request(app).get('/api/articles?page=1&pageSize=2');
            expect(response.status).toBe(200);
            expect(response.body.articles.length).toBeLessThanOrEqual(2);
        });

        it('should return articles in descending order by publish_date', async () => {
            const response = await request(app).get('/api/articles');
            const articles = response.body.articles;
            if (articles.length > 1) {
                const firstDate = new Date(articles[0].publish_date);
                const secondDate = new Date(articles[1].publish_date);
                expect(firstDate >= secondDate).toBe(true);
            }
        });
    });

    describe('GET /api/articles/:id', () => {
        it('should return 200 status code for valid article ID', async () => {
            const response = await request(app).get(`/api/articles/${testArticleId}`);
            expect(response.status).toBe(200);
        });

        it('should return article with correct properties', async () => {
            const response = await request(app).get(`/api/articles/${testArticleId}`);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('title');
            expect(response.body).toHaveProperty('content');
            expect(response.body).toHaveProperty('author');
            expect(response.body).toHaveProperty('pageviews');
        });

        it('should return 404 for non-existent article', async () => {
            const response = await request(app).get('/api/articles/999');
            expect(response.status).toBe(404);
        });

        it('should return 400 for invalid article ID', async () => {
            const response = await request(app).get('/api/articles/invalid');
            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/articles', () => {
        it('should create new article with valid data', async () => {
            const newArticle = {
                title: '新文章',
                content: '新文章内容',
                author: '新作者'
            };

            const response = await request(app)
                .post('/api/articles')
                .send(newArticle);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('articleId');
        });

        it('should return 400 when required fields are missing', async () => {
            const invalidArticle = {
                title: '缺少内容的文章'
            };

            const response = await request(app)
                .post('/api/articles')
                .send(invalidArticle);

            expect(response.status).toBe(400);
        });
    });
}); 