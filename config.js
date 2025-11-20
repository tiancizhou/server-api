// 配置文件
module.exports = {
    // 服务器端口
    PORT: process.env.PORT || 5201,
    
    // 管理后台密码
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'qq5201314',
    
    // 卡渠道 API 地址
    CARD_API_BASE_URL: process.env.CARD_API_BASE_URL || 'https://api.misacard.com',
    
    // 卡渠道 API Token（用于认证）
    // 可以通过环境变量 CARD_API_TOKEN 设置，或直接在此处填写
    CARD_API_TOKEN: process.env.CARD_API_TOKEN || 'nuceeDqN@UHDHWcpxTcMzj$pDDPrQSd^Q6EY^@$xqNZyRntxu1bmr2qGnJKuFf%&',
    
    // 数据文件路径
    DATA_DIR: './data',
    DATA_FILE: './data/cards.json'
};

