/**
 * 配置管理模块
 * 支持动态读取和更新配置，无需重启服务
 */

const fs = require('fs').promises;
const path = require('path');

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, 'data', 'runtime-config.json');

// 默认配置（从config.js读取）
const defaultConfig = require('./config');

// 运行时配置（会覆盖默认配置）
let runtimeConfig = null;

/**
 * 加载运行时配置
 */
async function loadRuntimeConfig() {
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf8');
        runtimeConfig = JSON.parse(data);
        console.log('[ConfigManager] 已加载运行时配置');
        return runtimeConfig;
    } catch (error) {
        if (error.code === 'ENOENT') {
            // 配置文件不存在，使用默认配置
            console.log('[ConfigManager] 运行时配置文件不存在，使用默认配置');
            runtimeConfig = {};
            return null;
        }
        console.error('[ConfigManager] 加载运行时配置失败:', error.message);
        return null;
    }
}

/**
 * 保存运行时配置
 */
async function saveRuntimeConfig(config) {
    try {
        const dir = path.dirname(CONFIG_FILE);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
        runtimeConfig = config;
        console.log('[ConfigManager] 运行时配置已保存');
        return true;
    } catch (error) {
        console.error('[ConfigManager] 保存运行时配置失败:', error.message);
        throw error;
    }
}

/**
 * 获取当前配置（运行时配置优先，否则使用默认配置）
 */
function getConfig() {
    const config = {
        ...defaultConfig,
        ...(runtimeConfig || {})
    };
    return config;
}

/**
 * 更新配置
 */
async function updateConfig(updates) {
    // 加载现有配置
    let currentConfig = runtimeConfig || {};
    
    // 合并更新
    currentConfig = {
        ...currentConfig,
        ...updates,
        lastUpdate: new Date().toISOString()
    };
    
    // 保存配置
    await saveRuntimeConfig(currentConfig);
    
    return currentConfig;
}

/**
 * 获取配置值（用于API接口）
 */
function getConfigValue(key) {
    const config = getConfig();
    return config[key];
}

/**
 * 初始化配置管理器
 */
async function initialize() {
    await loadRuntimeConfig();
}

module.exports = {
    initialize,
    getConfig,
    getConfigValue,
    updateConfig,
    loadRuntimeConfig
};

