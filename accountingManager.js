const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'accounting.json');
const DATA_DIR = path.join(__dirname, 'data');

// 内存缓存（减少文件IO）
let dataCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 缓存5秒，平衡性能和一致性

// 数据限制（防止数据过大）
const MAX_RECORDS_PER_TYPE = 10000; // 每种类型最多10000条记录

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据文件
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
        purchases: [],
        sales: [],
        otherExpenses: []
    }, null, 2));
}

// 读取数据（带缓存）
function loadData() {
    const now = Date.now();
    
    // 如果缓存有效，直接返回
    if (dataCache && (now - cacheTimestamp) < CACHE_TTL) {
        return dataCache;
    }
    
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(data);
        
        // 更新缓存
        dataCache = parsed;
        cacheTimestamp = now;
        
        return parsed;
    } catch (error) {
        console.error('读取账务数据文件失败:', error);
        const defaultData = {
            purchases: [],
            sales: [],
            otherExpenses: []
        };
        dataCache = defaultData;
        cacheTimestamp = now;
        return defaultData;
    }
}

// 保存数据（异步写入，不阻塞）
function saveData(data) {
    try {
        // 更新缓存
        dataCache = data;
        cacheTimestamp = Date.now();
        
        // 异步写入文件（不阻塞响应）
        fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('保存账务数据文件失败:', err);
            }
        });
        
        return true;
    } catch (error) {
        console.error('保存账务数据文件失败:', error);
        return false;
    }
}

// 清理旧数据（保留最近N条）
function cleanupOldData(data, type, keepCount = 5000) {
    if (!data[type] || data[type].length <= keepCount) {
        return data;
    }
    
    // 按创建时间排序，保留最新的
    data[type].sort((a, b) => {
        const timeA = new Date(a.createdAt || a.date).getTime();
        const timeB = new Date(b.createdAt || b.date).getTime();
        return timeB - timeA; // 降序
    });
    
    // 只保留最新的N条
    data[type] = data[type].slice(0, keepCount);
    
    console.log(`[Accounting] 已清理 ${type}，保留最新 ${keepCount} 条记录`);
    return data;
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 添加进货记录
function addPurchase(date, amount, cardCount, channelFee = 0, note = '') {
    const data = loadData();
    
    // 检查数据限制
    if (data.purchases.length >= MAX_RECORDS_PER_TYPE) {
        // 自动清理旧数据
        cleanupOldData(data, 'purchases', MAX_RECORDS_PER_TYPE - 100);
    }
    
    const purchase = {
        id: generateId(),
        date: date,
        amount: parseFloat(amount),
        cardCount: parseInt(cardCount),
        channelFee: parseFloat(channelFee) || 0,
        note: note,
        createdAt: new Date().toISOString()
    };
    data.purchases.push(purchase);
    saveData(data);
    return { success: true, purchase };
}

// 添加销售记录
function addSale(date, amount, cardCount = 0, note = '') {
    const data = loadData();
    
    // 检查数据限制
    if (data.sales.length >= MAX_RECORDS_PER_TYPE) {
        // 自动清理旧数据
        cleanupOldData(data, 'sales', MAX_RECORDS_PER_TYPE - 100);
    }
    
    const sale = {
        id: generateId(),
        date: date,
        amount: parseFloat(amount),
        cardCount: parseInt(cardCount) || 0,
        note: note,
        createdAt: new Date().toISOString()
    };
    data.sales.push(sale);
    saveData(data);
    return { success: true, sale };
}

// 添加其他费用
function addOtherExpense(date, amount, description = '') {
    const data = loadData();
    
    // 检查数据限制
    if (data.otherExpenses.length >= MAX_RECORDS_PER_TYPE) {
        // 自动清理旧数据
        cleanupOldData(data, 'otherExpenses', MAX_RECORDS_PER_TYPE - 100);
    }
    
    const expense = {
        id: generateId(),
        date: date,
        amount: parseFloat(amount),
        description: description,
        createdAt: new Date().toISOString()
    };
    data.otherExpenses.push(expense);
    saveData(data);
    return { success: true, expense };
}

// 删除进货记录
function deletePurchase(id) {
    const data = loadData();
    const index = data.purchases.findIndex(p => p.id === id);
    if (index === -1) {
        return { success: false, message: '进货记录不存在' };
    }
    data.purchases.splice(index, 1);
    saveData(data);
    return { success: true };
}

// 删除销售记录
function deleteSale(id) {
    const data = loadData();
    const index = data.sales.findIndex(s => s.id === id);
    if (index === -1) {
        return { success: false, message: '销售记录不存在' };
    }
    data.sales.splice(index, 1);
    saveData(data);
    return { success: true };
}

// 删除其他费用
function deleteOtherExpense(id) {
    const data = loadData();
    const index = data.otherExpenses.findIndex(e => e.id === id);
    if (index === -1) {
        return { success: false, message: '费用记录不存在' };
    }
    data.otherExpenses.splice(index, 1);
    saveData(data);
    return { success: true };
}

// 获取所有数据（支持分页）
function getAllData(page = 1, pageSize = 1000) {
    const data = loadData();
    
    // 如果不需要分页，返回全部数据
    if (!page || pageSize >= 10000) {
        return data;
    }
    
    // 分页返回
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return {
        purchases: data.purchases.slice(start, end),
        sales: data.sales.slice(start, end),
        otherExpenses: data.otherExpenses.slice(start, end),
        totalPurchases: data.purchases.length,
        totalSales: data.sales.length,
        totalExpenses: data.otherExpenses.length,
        page,
        pageSize
    };
}

// 获取数据统计（不加载全部数据，只计算统计）
function getDataStats() {
    const data = loadData();
    return {
        purchasesCount: data.purchases.length,
        salesCount: data.sales.length,
        expensesCount: data.otherExpenses.length,
        totalRecords: data.purchases.length + data.sales.length + data.otherExpenses.length
    };
}

// 计算统计信息
function getStatistics() {
    const data = loadData();
    
    // 计算总进货成本
    const totalPurchaseCost = data.purchases.reduce((sum, p) => {
        return sum + p.amount + (p.channelFee || 0);
    }, 0);
    
    // 计算总进货卡片数
    const totalPurchasedCards = data.purchases.reduce((sum, p) => {
        return sum + p.cardCount;
    }, 0);
    
    // 计算总销售额
    const totalSales = data.sales.reduce((sum, s) => {
        return sum + s.amount;
    }, 0);
    
    // 计算已售出卡片数
    const totalSoldCards = data.sales.reduce((sum, s) => {
        return sum + (s.cardCount || 0);
    }, 0);
    
    // 计算总其他费用
    const totalOtherExpenses = data.otherExpenses.reduce((sum, e) => {
        return sum + e.amount;
    }, 0);
    
    // 计算总成本
    const totalCost = totalPurchaseCost + totalOtherExpenses;
    
    // 计算盈利
    const profit = totalSales - totalCost;
    
    // 计算剩余卡片
    const remainingCards = totalPurchasedCards - totalSoldCards;
    
    return {
        totalPurchaseCost,
        totalPurchasedCards,
        totalSales,
        totalOtherExpenses,
        totalCost,
        profit,
        remainingCards
    };
}

// 手动清理缓存（用于调试）
function clearCache() {
    dataCache = null;
    cacheTimestamp = 0;
}

// 手动清理旧数据
function cleanupData(type, keepCount = 5000) {
    const data = loadData();
    const cleaned = cleanupOldData(data, type, keepCount);
    saveData(cleaned);
    return { success: true, message: `已清理 ${type}，保留最新 ${keepCount} 条记录` };
}

module.exports = {
    addPurchase,
    addSale,
    addOtherExpense,
    deletePurchase,
    deleteSale,
    deleteOtherExpense,
    getAllData,
    getStatistics,
    getDataStats,
    clearCache,
    cleanupData
};

