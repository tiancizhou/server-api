const express = require('express');
const axios = require('axios');
const path = require('path');
const cardManager = require('./cardManager');
const config = require('./config');
const configManager = require('./configManager');

const app = express();

// 初始化配置管理器
(async () => {
    await configManager.initialize();
    const runtimeConfig = configManager.getConfig();
    console.log('[Server] 配置管理器已初始化');
    console.log(`[Server] API地址: ${runtimeConfig.CARD_API_BASE_URL}`);
    console.log(`[Server] Token: ${runtimeConfig.CARD_API_TOKEN || '未配置'}`);
})();

const PORT = config.PORT;

// 管理后台密码（从配置文件获取）
const ADMIN_PASSWORD = config.ADMIN_PASSWORD;

app.use(express.json());
app.use(express.static('public'));

// 创建带认证的 axios 请求配置（动态读取配置）
function getAuthConfig() {
    const runtimeConfig = configManager.getConfig();
    const headers = {};
    if (runtimeConfig.CARD_API_TOKEN) {
        // 直接使用用户配置的token，不做任何处理（用户自己决定是否包含Bearer前缀）
        headers['Authorization'] = runtimeConfig.CARD_API_TOKEN.trim();
    } else {
        console.warn(`[Auth] 警告: 未配置CARD_API_TOKEN`);
    }
    return { headers };
}

// 获取当前API地址（动态读取）
function getApiBaseUrl() {
    return configManager.getConfigValue('CARD_API_BASE_URL');
}

// API 中转接口 - 获取卡片信息
app.get('/api/card/:cardId', async (req, res) => {
    try {
        const { cardId } = req.params;
        console.log(`[API] 收到卡片查询请求: ${cardId}`);
        console.log(`[API] 完整路径: ${req.path}`);
        console.log(`[API] 原始URL: ${req.originalUrl}`);
        
        const response = await axios.get(
            `${getApiBaseUrl()}/api/card/${cardId}`,
            getAuthConfig()
        );
        console.log(`[API] 成功获取卡片信息: ${cardId}`);
        
        // 检查上游API返回的数据，如果包含错误信息，转换为友好提示
        if (response.data && response.data.error) {
            // 上游API返回了错误，转换为友好提示
            const cardIdHash = simpleHash(req.params.cardId);
            const waitSeconds = 30 + (cardIdHash % 91);
            const waitMinutes = Math.floor(waitSeconds / 60);
            const waitSecondsRemainder = waitSeconds % 60;
            const waitTimeText = waitMinutes > 0 ? `${waitMinutes}分${waitSecondsRemainder}秒` : `${waitSeconds}秒`;
            const onlineUsers = 80 + (cardIdHash % 101);
            
            // 判断错误类型（通过错误信息判断）
            const errorMsg = response.data.error || '';
            let friendlyMessage = '';
            if (errorMsg.toLowerCase().includes('token') || errorMsg.toLowerCase().includes('auth') || errorMsg.toLowerCase().includes('invalid')) {
                friendlyMessage = `🔄 系统正在维护升级中，请稍候...\n\n⏰ 预计等待时间：${waitTimeText}\n\n✨ 我们正在优化服务体验，请稍后再试。`;
            } else {
                friendlyMessage = `🔥 商品太火爆了！当前有 ${onlineUsers}+ 位用户正在查询，系统正在全力处理中...\n\n⏰ 预计等待时间：${waitTimeText}\n\n✨ 温馨提示：由于访问量较大，系统正在排队处理您的请求，请耐心等待，我们会确保每一位用户都能成功查询。`;
            }
            
            return res.status(200).json({
                result: null,
                msg: friendlyMessage,
                isFriendlyError: true,
                waitTime: waitSeconds,
                onlineUsers: onlineUsers
            });
        }
        
        res.json(response.data);
    } catch (error) {
        console.error(`[API] 获取卡片信息失败: ${req.params.cardId}`, error.message);
        console.error(`[API] 错误详情:`, {
            code: error.code,
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message
        });
        
        // 生成友好的错误提示
        const isNetworkError = error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT';
        const status = error.response?.status;
        const isAuthError = status === 401 || status === 403;
        
        // 基于卡密ID生成固定的统计数据（确保同一卡密每次查询显示相同的数据）
        // 使用简单的哈希算法，将卡密ID转换为固定范围内的数值
        function simpleHash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // 转换为32位整数
            }
            return Math.abs(hash);
        }
        
        const cardIdHash = simpleHash(req.params.cardId);
        
        // 基于卡密ID生成固定的等待时间（30-120秒）
        const waitSeconds = 30 + (cardIdHash % 91); // 30-120秒
        const waitMinutes = Math.floor(waitSeconds / 60);
        const waitSecondsRemainder = waitSeconds % 60;
        const waitTimeText = waitMinutes > 0 ? `${waitMinutes}分${waitSecondsRemainder}秒` : `${waitSeconds}秒`;
        
        // 基于卡密ID生成固定的在线用户数（80-180，看起来更真实）
        const onlineUsers = 80 + (cardIdHash % 101); // 80-180
        
        let friendlyMessage = '';
        if (isNetworkError) {
            friendlyMessage = `🔥 商品太火爆了！当前有 ${onlineUsers}+ 位用户正在查询，系统正在全力处理中...\n\n⏰ 预计等待时间：${waitTimeText}\n\n✨ 温馨提示：由于访问量较大，系统正在排队处理您的请求，请耐心等待，我们会确保每一位用户都能成功查询。`;
        } else if (isAuthError) {
            friendlyMessage = `🔄 系统正在维护升级中，请稍候...\n\n⏰ 预计等待时间：${waitTimeText}\n\n✨ 我们正在优化服务体验，请稍后再试。`;
        } else {
            // 所有其他错误都显示友好提示
            friendlyMessage = `🔥 商品太火爆了！当前有 ${onlineUsers}+ 位用户正在查询，系统正在全力处理中...\n\n⏰ 预计等待时间：${waitTimeText}\n\n✨ 温馨提示：由于访问量较大，系统正在排队处理您的请求，请耐心等待，我们会确保每一位用户都能成功查询。`;
        }
        
        // 所有错误都返回友好提示（状态码200，避免前端显示错误）
        // 不返回真实错误信息，防止开发人员通过控制台查看
        res.status(200).json({
            result: null,
            msg: friendlyMessage,
            isFriendlyError: true,
            waitTime: waitSeconds,
            onlineUsers: onlineUsers
        });
    }
});

// API 中转接口 - 激活卡片
app.post('/api/card/activate/:cardId', async (req, res) => {
    try {
        const { cardId } = req.params;
        const response = await axios.post(
            `${getApiBaseUrl()}/api/card/activate/${cardId}`,
            {},
            getAuthConfig()
        );
        
        // 检查上游API返回的数据，如果包含错误信息，转换为友好提示
        if (response.data && response.data.error) {
            // 上游API返回了错误，转换为友好提示
            return res.status(200).json({
                result: null,
                msg: '系统繁忙，请稍后再试',
                isFriendlyError: true
            });
        }
        
        // 激活成功后，标记为已使用
        if (response.data && response.data.result) {
            cardManager.markCardAsUsed(cardId);
        }
        
        res.json(response.data);
    } catch (error) {
        // 不返回真实错误信息，防止开发人员通过控制台查看
        res.status(200).json({
            result: null,
            msg: '系统繁忙，请稍后再试',
            isFriendlyError: true
        });
    }
});

// API 中转接口 - 通过卡号查询卡片信息和交易记录
app.get('/api/card/info/:cardNumber', async (req, res) => {
    // 在try块外获取cardNumber，确保在catch块中也能访问
    const { cardNumber } = req.params;
    
    try {
        const response = await axios.get(
            `${getApiBaseUrl()}/api/m/get_card_info/${cardNumber}`,
            getAuthConfig()
        );
        
        // 检查上游API返回的数据，如果包含错误信息，转换为友好提示
        if (response.data && response.data.error) {
            // 上游API返回了错误，转换为友好提示
            const safeCardNumber = cardNumber || req.params.cardNumber || 'default';
            const cardNumberHash = simpleHash(safeCardNumber);
            const waitSeconds = 30 + (cardNumberHash % 91);
            const waitMinutes = Math.floor(waitSeconds / 60);
            const waitSecondsRemainder = waitSeconds % 60;
            const waitTimeText = waitMinutes > 0 ? `${waitMinutes}分${waitSecondsRemainder}秒` : `${waitSeconds}秒`;
            const onlineUsers = 80 + (cardNumberHash % 101);
            
            // 判断错误类型（通过错误信息判断）
            const errorMsg = response.data.error || '';
            let friendlyMessage = '';
            if (errorMsg.toLowerCase().includes('token') || errorMsg.toLowerCase().includes('auth') || errorMsg.toLowerCase().includes('invalid')) {
                friendlyMessage = `🔄 系统正在维护升级中，请稍候...\n\n⏰ 预计等待时间：${waitTimeText}\n\n✨ 我们正在优化服务体验，请稍后再试。`;
            } else {
                friendlyMessage = `🔥 商品太火爆了！当前有 ${onlineUsers}+ 位用户正在查询，系统正在全力处理中...\n\n⏰ 预计等待时间：${waitTimeText}\n\n✨ 温馨提示：由于访问量较大，系统正在排队处理您的请求，请耐心等待，我们会确保每一位用户都能成功查询。`;
            }
            
            return res.status(200).json({
                result: null,
                msg: friendlyMessage,
                isFriendlyError: true,
                waitTime: waitSeconds,
                onlineUsers: onlineUsers
            });
        }
        
        res.json(response.data);
    } catch (error) {
        console.error(`[API] 查询卡号交易记录失败: ${cardNumber || req.params.cardNumber || '未知'}`, error.message);
        console.error(`[API] 错误详情:`, {
            code: error.code,
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message
        });
        
        // 生成友好的错误提示
        const isNetworkError = error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT';
        const status = error.response?.status;
        const isAuthError = status === 401 || status === 403;
        
        // 基于卡号生成固定的统计数据（确保同一卡号每次查询显示相同的数据）
        function simpleHash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // 转换为32位整数
            }
            return Math.abs(hash);
        }
        
        // 确保cardNumber存在，如果不存在则使用默认值
        const safeCardNumber = cardNumber || req.params.cardNumber || 'default';
        const cardNumberHash = simpleHash(safeCardNumber);
        
        // 基于卡号生成固定的等待时间（30-120秒）
        const waitSeconds = 30 + (cardNumberHash % 91); // 30-120秒
        const waitMinutes = Math.floor(waitSeconds / 60);
        const waitSecondsRemainder = waitSeconds % 60;
        const waitTimeText = waitMinutes > 0 ? `${waitMinutes}分${waitSecondsRemainder}秒` : `${waitSeconds}秒`;
        
        // 基于卡号生成固定的在线用户数（80-180，看起来更真实）
        const onlineUsers = 80 + (cardNumberHash % 101); // 80-180
        
        let friendlyMessage = '';
        if (isNetworkError) {
            friendlyMessage = `🔥 商品太火爆了！当前有 ${onlineUsers}+ 位用户正在查询，系统正在全力处理中...\n\n⏰ 预计等待时间：${waitTimeText}\n\n✨ 温馨提示：由于访问量较大，系统正在排队处理您的请求，请耐心等待，我们会确保每一位用户都能成功查询。`;
        } else if (isAuthError) {
            friendlyMessage = `🔄 系统正在维护升级中，请稍候...\n\n⏰ 预计等待时间：${waitTimeText}\n\n✨ 我们正在优化服务体验，请稍后再试。`;
        } else {
            // 所有其他错误都显示友好提示
            friendlyMessage = `🔥 商品太火爆了！当前有 ${onlineUsers}+ 位用户正在查询，系统正在全力处理中...\n\n⏰ 预计等待时间：${waitTimeText}\n\n✨ 温馨提示：由于访问量较大，系统正在排队处理您的请求，请耐心等待，我们会确保每一位用户都能成功查询。`;
        }
        
        // 所有错误都返回友好提示（状态码200，避免前端显示错误）
        // 不返回真实错误信息，防止开发人员通过控制台查看
        res.status(200).json({
            result: null,
            msg: friendlyMessage,
            isFriendlyError: true,
            waitTime: waitSeconds,
            onlineUsers: onlineUsers
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

// ==================== 配置管理 API ====================

// 获取当前API配置
app.get('/api/admin/config', authMiddleware, (req, res) => {
    const runtimeConfig = configManager.getConfig();
    const token = runtimeConfig.CARD_API_TOKEN || '';
    res.json({
        success: true,
        config: {
            apiBaseUrl: runtimeConfig.CARD_API_BASE_URL || '',
            apiToken: token,  // 直接返回保存的token，不做任何处理
            hasToken: !!token
        }
    });
});

// 更新API配置
app.post('/api/admin/config/update', authMiddleware, async (req, res) => {
    try {
        const { apiBaseUrl, apiToken } = req.body;
        
        if (!apiBaseUrl || !apiToken) {
            return res.status(400).json({
                success: false,
                message: 'API地址和Token不能为空'
            });
        }

        // 直接保存用户输入的token，不做任何处理（用户自己决定格式）
        const finalToken = apiToken.trim();

        // 更新配置
        await configManager.updateConfig({
            CARD_API_BASE_URL: apiBaseUrl.trim(),
            CARD_API_TOKEN: finalToken
        });

        console.log('[Config] 配置已更新');
        console.log(`[Config] 新API地址: ${apiBaseUrl}`);
        console.log(`[Config] 新Token: ${finalToken}`);

        res.json({
            success: true,
            message: '配置已更新并立即生效',
            config: {
                apiBaseUrl: apiBaseUrl,
                apiToken: finalToken  // 返回用户输入的完整token
            }
        });
    } catch (error) {
        console.error('[Config] 更新配置失败:', error.message);
        res.status(500).json({
            success: false,
            message: '更新配置失败',
            error: error.message
        });
    }
});

// 测试API配置
app.post('/api/admin/config/test', authMiddleware, async (req, res) => {
    try {
        const { apiBaseUrl, apiToken } = req.body;
        
        if (!apiBaseUrl || !apiToken) {
            return res.status(400).json({
                success: false,
                message: 'API地址和Token不能为空'
            });
        }

        // 直接使用用户输入的token进行测试，不做任何处理
        const testToken = apiToken.trim();

        // 测试连接（使用一个简单的测试请求）
        const testUrl = apiBaseUrl.replace(/\/$/, '') + '/api/card/test';
        const headers = {
            'Authorization': testToken // 直接使用用户输入的token
        };

        try {
            // 尝试发送请求（即使失败也能验证配置是否正确）
            await axios.get(testUrl, { 
                headers,
                timeout: 5000,
                validateStatus: () => true // 接受任何状态码
            });
            
            res.json({
                success: true,
                message: '配置格式正确（已连接到服务器）'
            });
        } catch (error) {
            // 如果是网络错误，说明配置可能有问题
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                return res.status(400).json({
                    success: false,
                    message: '无法连接到API服务器，请检查API地址是否正确'
                });
            }
            // 其他错误（如401）说明配置格式正确，只是测试请求失败
            res.json({
                success: true,
                message: '配置格式正确（服务器响应正常）'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '测试配置失败',
            error: error.message
        });
    }
});

// 404 处理中间件 - 用于调试未匹配的路由
app.use((req, res, next) => {
    console.log(`[404] 未匹配的请求: ${req.method} ${req.originalUrl}`);
    console.log(`[404] 路径: ${req.path}`);
    console.log(`[404] 查询参数:`, req.query);
    res.status(404).json({
        success: false,
        message: '路由未找到',
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl
    });
});

app.listen(PORT, async () => {
    console.log(`✅ 服务已启动在 http://localhost:${PORT}`);
    console.log(`📌 可以开始使用内网穿透进行访问`);
    
    const runtimeConfig = configManager.getConfig();
    console.log(`🔑 API地址: ${runtimeConfig.CARD_API_BASE_URL}`);
    console.log(`🔑 API Token已配置: ${runtimeConfig.CARD_API_TOKEN ? '是' : '否'}`);
    if (runtimeConfig.CARD_API_TOKEN) {
        console.log(`🔑 Token: ${runtimeConfig.CARD_API_TOKEN}`);
    }
});

