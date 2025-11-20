const express = require('express');
const axios = require('axios');
const path = require('path');
const cardManager = require('./cardManager');
const config = require('./config');
const configManager = require('./configManager');
const captureApiRequest = require('./capture-api');

const app = express();

// 自动更新配置的锁（防止并发触发）
let autoUpdateLock = false;
let lastAutoUpdateTime = 0;

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

// 简单的哈希函数（用于生成固定的随机数）
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
}

// 检测是否需要自动更新配置
function shouldAutoUpdate(error) {
    // 检查是否是网络错误
    const isNetworkError = error.code === 'ECONNREFUSED' || 
                          error.code === 'ENOTFOUND' || 
                          error.code === 'ETIMEDOUT' ||
                          error.code === 'ECONNRESET' ||
                          error.code === 'ERR_BAD_REQUEST';
    
    // 检查HTTP状态码
    const status = error.response?.status;
    // 401/403: 认证错误
    // 404: API地址或路径错误（应该触发自动抓包）
    // 500/502/503/504: 服务器错误（可能是临时的，但也可能是API地址错误）
    const isHttpError = status === 401 || 
                       status === 403 || 
                       status === 404 || 
                       status === 500 || 
                       status === 502 || 
                       status === 503 || 
                       status === 504;
    
    // 检查响应数据中是否包含invalid token
    const responseData = error.response?.data;
    const hasInvalidToken = responseData && (
        (typeof responseData === 'string' && responseData.toLowerCase().includes('invalid token')) ||
        (typeof responseData === 'object' && (
            responseData.error?.toLowerCase().includes('invalid token') ||
            responseData.error?.toLowerCase().includes('invalid_token') ||
            responseData.message?.toLowerCase().includes('invalid token')
        ))
    );
    
    return isNetworkError || isHttpError || hasInvalidToken;
}

// 自动抓包并更新配置
async function autoUpdateConfig() {
    // 检查是否启用自动抓包
    const autoCaptureEnabled = configManager.getConfigValue('AUTO_CAPTURE_ENABLED');
    if (!autoCaptureEnabled) {
        console.log('[AutoUpdate] 自动抓包已禁用，跳过本次触发');
        return false;
    }
    
    // 检查锁和冷却时间
    const now = Date.now();
    if (autoUpdateLock) {
        console.log('[AutoUpdate] 自动更新正在进行中，跳过本次触发');
        return false;
    }
    
    const cooldown = configManager.getConfigValue('AUTO_CAPTURE_COOLDOWN') || 60000;
    if (now - lastAutoUpdateTime < cooldown) {
        console.log(`[AutoUpdate] 距离上次自动更新不足${cooldown/1000}秒，跳过本次触发`);
        return false;
    }
    
    // 设置锁
    autoUpdateLock = true;
    lastAutoUpdateTime = now;
    
    try {
        console.log('[AutoUpdate] 开始自动抓包并更新配置...');
        
        // 执行抓包
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('抓包超时（超过60秒）')), 60000);
        });
        
        const capturePromise = captureApiRequest();
        const result = await Promise.race([capturePromise, timeoutPromise]);
        
        if (result.success && result.apiBaseUrl && result.apiToken) {
            // 更新配置
            await configManager.updateConfig({
                CARD_API_BASE_URL: result.apiBaseUrl.trim(),
                CARD_API_TOKEN: result.apiToken.trim()
            });
            
            console.log('[AutoUpdate] ✅ 配置已自动更新');
            console.log(`[AutoUpdate] 新API地址: ${result.apiBaseUrl}`);
            console.log(`[AutoUpdate] 新Token: ${result.apiToken.substring(0, 20)}...`);
            
            return true;
        } else {
            console.log(`[AutoUpdate] ❌ 抓包失败: ${result.message}`);
            return false;
        }
    } catch (error) {
        console.error('[AutoUpdate] ❌ 自动更新失败:', error.message);
        return false;
    } finally {
        // 释放锁
        autoUpdateLock = false;
    }
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
            // 检查是否是invalid token错误，如果是则自动更新配置
            const errorMsg = (response.data.error || '').toLowerCase();
            if (errorMsg.includes('invalid token') || errorMsg.includes('invalid_token') || errorMsg.includes('token')) {
                console.log('[API] 检测到Token错误，尝试自动更新配置...');
                // 异步执行自动更新（不阻塞响应）
                autoUpdateConfig().catch(err => {
                    console.error('[API] 自动更新配置失败:', err.message);
                });
            }
            
            // 上游API返回了错误，转换为友好提示
            const cardIdHash = simpleHash(req.params.cardId);
            const waitSeconds = 30 + (cardIdHash % 91);
            const waitMinutes = Math.floor(waitSeconds / 60);
            const waitSecondsRemainder = waitSeconds % 60;
            const waitTimeText = waitMinutes > 0 ? `${waitMinutes}分${waitSecondsRemainder}秒` : `${waitSeconds}秒`;
            const onlineUsers = 80 + (cardIdHash % 101);
            
            // 判断错误类型（通过错误信息判断）
            let friendlyMessage = '';
            if (errorMsg.includes('token') || errorMsg.includes('auth') || errorMsg.includes('invalid')) {
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
        
        // 检查是否需要自动更新配置
        if (shouldAutoUpdate(error)) {
            console.log('[API] 检测到需要自动更新的错误，触发自动更新...');
            // 异步执行自动更新（不阻塞响应）
            autoUpdateConfig().catch(err => {
                console.error('[API] 自动更新配置失败:', err.message);
            });
        }
        
        // 生成友好的错误提示
        const isNetworkError = error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT';
        const status = error.response?.status;
        const isAuthError = status === 401 || status === 403;
        
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
            // 检查是否是invalid token错误
            const errorMsg = (response.data.error || '').toLowerCase();
            if (errorMsg.includes('invalid token') || errorMsg.includes('invalid_token') || errorMsg.includes('token')) {
                console.log('[API] 检测到Token错误，尝试自动更新配置...');
                autoUpdateConfig().catch(err => {
                    console.error('[API] 自动更新配置失败:', err.message);
                });
            }
            
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
        // 检查是否需要自动更新配置
        if (shouldAutoUpdate(error)) {
            console.log('[API] 检测到需要自动更新的错误，触发自动更新...');
            autoUpdateConfig().catch(err => {
                console.error('[API] 自动更新配置失败:', err.message);
            });
        }
        
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
            // 检查是否是invalid token错误
            const errorMsg = (response.data.error || '').toLowerCase();
            if (errorMsg.includes('invalid token') || errorMsg.includes('invalid_token') || errorMsg.includes('token')) {
                console.log('[API] 检测到Token错误，尝试自动更新配置...');
                autoUpdateConfig().catch(err => {
                    console.error('[API] 自动更新配置失败:', err.message);
                });
            }
            
            // 上游API返回了错误，转换为友好提示
            const safeCardNumber = cardNumber || req.params.cardNumber || 'default';
            const cardNumberHash = simpleHash(safeCardNumber);
            const waitSeconds = 30 + (cardNumberHash % 91);
            const waitMinutes = Math.floor(waitSeconds / 60);
            const waitSecondsRemainder = waitSeconds % 60;
            const waitTimeText = waitMinutes > 0 ? `${waitMinutes}分${waitSecondsRemainder}秒` : `${waitSeconds}秒`;
            const onlineUsers = 80 + (cardNumberHash % 101);
            
            // 判断错误类型（通过错误信息判断）
            let friendlyMessage = '';
            if (errorMsg.includes('token') || errorMsg.includes('auth') || errorMsg.includes('invalid')) {
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
        
        // 检查是否需要自动更新配置
        if (shouldAutoUpdate(error)) {
            console.log('[API] 检测到需要自动更新的错误，触发自动更新...');
            autoUpdateConfig().catch(err => {
                console.error('[API] 自动更新配置失败:', err.message);
            });
        }
        
        // 生成友好的错误提示
        const isNetworkError = error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT';
        const status = error.response?.status;
        const isAuthError = status === 401 || status === 403;
        
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
            hasToken: !!token,
            autoCaptureEnabled: runtimeConfig.AUTO_CAPTURE_ENABLED !== false, // 默认true
            autoCaptureCooldown: runtimeConfig.AUTO_CAPTURE_COOLDOWN || 60000 // 默认60秒
        }
    });
});

// 更新API配置
app.post('/api/admin/config/update', authMiddleware, async (req, res) => {
    try {
        const { apiBaseUrl, apiToken, autoCaptureEnabled, autoCaptureCooldown } = req.body;
        
        if (!apiBaseUrl || !apiToken) {
            return res.status(400).json({
                success: false,
                message: 'API地址和Token不能为空'
            });
        }

        // 直接保存用户输入的token，不做任何处理（用户自己决定格式）
        const finalToken = apiToken.trim();

        // 构建更新对象
        const updates = {
            CARD_API_BASE_URL: apiBaseUrl.trim(),
            CARD_API_TOKEN: finalToken
        };
        
        // 如果提供了自动抓包配置，也一起更新
        if (autoCaptureEnabled !== undefined) {
            updates.AUTO_CAPTURE_ENABLED = autoCaptureEnabled === true || autoCaptureEnabled === 'true';
        }
        
        if (autoCaptureCooldown !== undefined) {
            const cooldown = parseInt(autoCaptureCooldown);
            if (!isNaN(cooldown) && cooldown > 0) {
                updates.AUTO_CAPTURE_COOLDOWN = cooldown;
            }
        }

        // 更新配置
        await configManager.updateConfig(updates);

        console.log('[Config] 配置已更新');
        console.log(`[Config] 新API地址: ${apiBaseUrl}`);
        console.log(`[Config] 新Token: ${finalToken.substring(0, 20)}...`);
        if (autoCaptureEnabled !== undefined) {
            console.log(`[Config] 自动抓包: ${updates.AUTO_CAPTURE_ENABLED ? '启用' : '禁用'}`);
        }
        if (autoCaptureCooldown !== undefined) {
            console.log(`[Config] 抓包间隔: ${updates.AUTO_CAPTURE_COOLDOWN / 1000}秒`);
        }

        res.json({
            success: true,
            message: '配置已更新并立即生效',
            config: {
                apiBaseUrl: apiBaseUrl,
                apiToken: finalToken,  // 返回用户输入的完整token
                autoCaptureEnabled: updates.AUTO_CAPTURE_ENABLED !== undefined ? updates.AUTO_CAPTURE_ENABLED : configManager.getConfigValue('AUTO_CAPTURE_ENABLED'),
                autoCaptureCooldown: updates.AUTO_CAPTURE_COOLDOWN || configManager.getConfigValue('AUTO_CAPTURE_COOLDOWN')
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

// 自动抓包API配置
app.post('/api/admin/capture', authMiddleware, async (req, res) => {
    try {
        console.log('[Capture] 开始执行自动抓包...');
        
        // 执行抓包（设置超时时间，避免请求挂起）
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('抓包超时（超过60秒）')), 60000);
        });
        
        const capturePromise = captureApiRequest();
        
        const result = await Promise.race([capturePromise, timeoutPromise]);
        
        if (result.success) {
            console.log('[Capture] 抓包成功');
            console.log(`[Capture] API地址: ${result.apiBaseUrl}`);
            console.log(`[Capture] Token: ${result.apiToken}`);
            
            res.json({
                success: true,
                message: '抓包成功',
                data: {
                    apiBaseUrl: result.apiBaseUrl,
                    apiToken: result.apiToken
                }
            });
        } else {
            console.log(`[Capture] 抓包失败: ${result.message}`);
            res.status(400).json({
                success: false,
                message: result.message || '抓包失败'
            });
        }
    } catch (error) {
        console.error('[Capture] 抓包错误:', error.message);
        res.status(500).json({
            success: false,
            message: '抓包失败: ' + error.message
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

