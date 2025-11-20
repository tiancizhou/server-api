// 配置文件
module.exports = {
    // 服务器端口
    PORT: process.env.PORT || 5200,
    
    // 管理后台密码
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'qq5201314',
    
    // 卡渠道 API 地址
    CARD_API_BASE_URL: process.env.CARD_API_BASE_URL || 'https://api.misacard.com',
    
    // 卡渠道 API Token（用于认证）
    // 可以通过环境变量 CARD_API_TOKEN 设置，或直接在此处填写
    CARD_API_TOKEN: process.env.CARD_API_TOKEN || 'nuceeDqN@UHDHWcpxTcMzj$pDDPrQSd^Q6EY^@$xqNZyRntxu1bmr2qGnJKuFf%&',
    
    // 数据文件路径
    DATA_DIR: './data',
    DATA_FILE: './data/cards.json',
    
    // 自动抓包配置
    AUTO_CAPTURE_ENABLED: process.env.AUTO_CAPTURE_ENABLED !== 'false', // 默认启用
    AUTO_CAPTURE_COOLDOWN: parseInt(process.env.AUTO_CAPTURE_COOLDOWN) || 60000, // 默认60秒（单位：毫秒）
    
    // 接口调用限制配置
    RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false', // 默认启用
    RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000, // 时间窗口（默认60秒，单位：毫秒）
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10 // 时间窗口内最大请求次数（默认10次）
};

