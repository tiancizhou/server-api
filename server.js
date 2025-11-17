const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 5200;

app.use(express.json());
app.use(express.static('public'));

// API 中转接口 - 获取卡片信息
app.get('/api/card/:cardId', async (req, res) => {
    try {
        const { cardId } = req.params;
        const response = await axios.get(`https://misacard.com/api/card/${cardId}`);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            result: null,
            msg: '获取卡片信息失败',
            error: error.message
        });
    }
});

// API 中转接口 - 激活卡片
app.post('/api/card/activate/:cardId', async (req, res) => {
    try {
        const { cardId } = req.params;
        const response = await axios.post(`https://misacard.com/api/card/activate/${cardId}`);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            result: null,
            msg: '激活卡片失败',
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ 服务已启动在 http://localhost:${PORT}`);
    console.log(`📌 可以开始使用内网穿透进行访问`);
});

