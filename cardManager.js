const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'cards.json');
const DATA_DIR = path.join(__dirname, 'data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据文件
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ cards: [] }, null, 2));
}

// 读取数据
function loadData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取数据文件失败:', error);
        return { cards: [] };
    }
}

// 保存数据
function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('保存数据文件失败:', error);
        return false;
    }
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 智能解析卡密（支持多种格式）
function parseCardId(line) {
    line = line.trim();
    if (!line) return null;

    // 格式1: "卡密: mio-xxx 额度: 0 有效期: 1小时"
    const format1 = /卡密:\s*(mio-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
    const match1 = line.match(format1);
    if (match1) {
        return match1[1].trim();
    }

    // 格式2: 纯卡密（mio-xxx）
    const format2 = /^(mio-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
    const match2 = line.match(format2);
    if (match2) {
        return match2[1].trim();
    }

    return null;
}

// 批量导入卡密
function importCards(cardIds) {
    const data = loadData();
    const timestamp = new Date().toISOString();
    let addedCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    cardIds.forEach(line => {
        // 智能解析卡密
        const cardId = parseCardId(line);
        
        if (!cardId) {
            invalidCount++;
            return;
        }

        // 检查是否已存在
        const exists = data.cards.some(card => card.cardId === cardId);
        if (!exists) {
            data.cards.push({
                id: generateId(),
                cardId: cardId,
                status: 'available', // available, sold, used, expired
                createdAt: timestamp,
                soldAt: null,
                usedAt: null,
                buyer: null,
                note: null
            });
            addedCount++;
        } else {
            duplicateCount++;
        }
    });

    saveData(data);
    return { success: true, addedCount, duplicateCount, invalidCount, total: data.cards.length };
}

// 获取所有卡密
function getAllCards(filter = 'all') {
    const data = loadData();
    if (filter === 'all') {
        return data.cards;
    }
    return data.cards.filter(card => card.status === filter);
}

// 获取统计信息
function getStats() {
    const data = loadData();
    const stats = {
        total: data.cards.length,
        available: 0,
        sold: 0,
        used: 0,
        expired: 0
    };

    data.cards.forEach(card => {
        if (stats.hasOwnProperty(card.status)) {
            stats[card.status]++;
        }
    });

    return stats;
}

// 获取下一个可用卡密（用于发货）
function getNextAvailableCard() {
    const data = loadData();
    const availableCard = data.cards.find(card => card.status === 'available');
    
    if (!availableCard) {
        return { success: false, message: '没有可用的卡密了！请先导入卡密。' };
    }

    return { success: true, card: availableCard };
}

// 标记卡密为已售出
function markCardAsSold(cardId, buyerInfo = null) {
    const data = loadData();
    const card = data.cards.find(c => c.id === cardId || c.cardId === cardId);
    
    if (!card) {
        return { success: false, message: '卡密不存在' };
    }

    if (card.status !== 'available') {
        return { success: false, message: `该卡密状态为：${card.status}，不能售出` };
    }

    card.status = 'sold';
    card.soldAt = new Date().toISOString();
    if (buyerInfo) {
        card.buyer = buyerInfo;
    }

    saveData(data);
    return { success: true, message: '标记成功', card };
}

// 标记卡密为已使用
function markCardAsUsed(cardIdValue) {
    const data = loadData();
    const card = data.cards.find(c => c.cardId === cardIdValue);
    
    if (!card) {
        return { success: false, message: '卡密不存在' };
    }

    if (card.status === 'used') {
        return { success: true, message: '该卡密已经被标记为已使用', card };
    }

    card.status = 'used';
    card.usedAt = new Date().toISOString();

    saveData(data);
    return { success: true, message: '标记成功', card };
}

// 删除卡密
function deleteCard(cardId) {
    const data = loadData();
    const index = data.cards.findIndex(c => c.id === cardId);
    
    if (index === -1) {
        return { success: false, message: '卡密不存在' };
    }

    data.cards.splice(index, 1);
    saveData(data);
    return { success: true, message: '删除成功' };
}

// 批量删除卡密
function deleteCards(cardIds) {
    const data = loadData();
    let deletedCount = 0;
    const notFound = [];

    cardIds.forEach(cardId => {
        const index = data.cards.findIndex(c => c.id === cardId);
        if (index !== -1) {
            data.cards.splice(index, 1);
            deletedCount++;
        } else {
            notFound.push(cardId);
        }
    });

    saveData(data);
    return { 
        success: true, 
        deletedCount, 
        notFoundCount: notFound.length,
        remaining: data.cards.length,
        message: `成功删除 ${deletedCount} 个卡密${notFound.length > 0 ? `，${notFound.length} 个未找到` : ''}`
    };
}

// 批量删除已使用的卡密
function cleanupUsedCards() {
    const data = loadData();
    const beforeCount = data.cards.length;
    data.cards = data.cards.filter(card => card.status !== 'used');
    const deletedCount = beforeCount - data.cards.length;
    
    saveData(data);
    return { success: true, deletedCount, remaining: data.cards.length };
}

// 更新卡密备注
function updateCardNote(cardId, note) {
    const data = loadData();
    const card = data.cards.find(c => c.id === cardId);
    
    if (!card) {
        return { success: false, message: '卡密不存在' };
    }

    card.note = note;
    saveData(data);
    return { success: true, message: '备注更新成功', card };
}

module.exports = {
    importCards,
    getAllCards,
    getStats,
    getNextAvailableCard,
    markCardAsSold,
    markCardAsUsed,
    deleteCard,
    deleteCards,
    cleanupUsedCards,
    updateCardNote
};

