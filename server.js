const express = require('express');
const axios = require('axios');
const path = require('path');
const cardManager = require('./cardManager');

const app = express();
const PORT = 5200;

// 管理后台密码（从环境变量获取，默认为 admin123）
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'qq5201314';

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
        
        // 激活成功后，标记为已使用
        if (response.data && response.data.result) {
            cardManager.markCardAsUsed(cardId);
        }
        
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            result: null,
            msg: '激活卡片失败',
            error: error.message
        });
    }
});

// API 中转接口 - 通过卡号查询卡片信息和交易记录
app.get('/api/card/info/:cardNumber', async (req, res) => {
    try {
        const { cardNumber } = req.params;
        const response = await axios.get(`https://misacard.com/api/m/get_card_info/${cardNumber}`);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            result: null,
            error: error.response?.data?.error || error.message,
            msg: '查询卡片信息失败'
        });
    }
});

// ==================== 管理后台 API ====================

// 简单的密码验证中间件
function authMiddleware(req, res, next) {
    const password = req.headers['x-admin-password'] || req.body.password || req.query.password;
    
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: '密码错误' });
    }
    
    next();
}

// 管理后台页面
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 使用说明页面
app.get('/guide', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', '使用说明.html'));
});

// 获取统计信息
app.get('/api/admin/stats', authMiddleware, (req, res) => {
    const stats = cardManager.getStats();
    res.json({ success: true, stats });
});

// 获取卡密列表
app.get('/api/admin/cards', authMiddleware, (req, res) => {
    const filter = req.query.filter || 'all'; // all, available, sold, used
    const cards = cardManager.getAllCards(filter);
    res.json({ success: true, cards, count: cards.length });
});

// 批量导入卡密
app.post('/api/admin/cards/import', authMiddleware, (req, res) => {
    const { cards } = req.body;
    
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
        return res.status(400).json({ success: false, message: '请提供有效的卡密数组' });
    }
    
    const result = cardManager.importCards(cards);
    res.json(result);
});

// 获取下一个可用卡密（用于发货）
app.post('/api/admin/cards/get-next', authMiddleware, (req, res) => {
    const result = cardManager.getNextAvailableCard();
    res.json(result);
});

// 标记卡密为已售出
app.post('/api/admin/cards/mark-sold/:cardId', authMiddleware, (req, res) => {
    const { cardId } = req.params;
    const { buyer } = req.body;
    
    const result = cardManager.markCardAsSold(cardId, buyer);
    res.json(result);
});

// 标记卡密为已使用（通常由激活接口自动调用）
app.post('/api/admin/cards/mark-used/:cardId', authMiddleware, (req, res) => {
    const { cardId } = req.params;
    
    const result = cardManager.markCardAsUsed(cardId);
    res.json(result);
});

// 删除单个卡密
app.delete('/api/admin/cards/:cardId', authMiddleware, (req, res) => {
    const { cardId } = req.params;
    
    const result = cardManager.deleteCard(cardId);
    res.json(result);
});

// 批量删除卡密
app.post('/api/admin/cards/batch-delete', authMiddleware, (req, res) => {
    const { cardIds } = req.body;
    
    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
        return res.status(400).json({ success: false, message: '请提供有效的卡密ID数组' });
    }
    
    const result = cardManager.deleteCards(cardIds);
    res.json(result);
});

// 清理已使用的卡密
app.post('/api/admin/cards/cleanup', authMiddleware, (req, res) => {
    const result = cardManager.cleanupUsedCards();
    res.json(result);
});

// 更新卡密备注
app.put('/api/admin/cards/:cardId/note', authMiddleware, (req, res) => {
    const { cardId } = req.params;
    const { note } = req.body;
    
    const result = cardManager.updateCardNote(cardId, note);
    res.json(result);
});

app.listen(PORT, () => {
    console.log(`✅ 服务已启动在 http://localhost:${PORT}`);
    console.log(`📌 可以开始使用内网穿透进行访问`);
});

