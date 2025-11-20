/**
 * MisaCard 配置自动更新方法示例
 * 
 * 针对 https://misacard.com/activate 页面的配置获取
 * 复制此文件为 update-methods.js 并配置
 */

module.exports = [
    // 方式1: 从激活页面抓取配置（推荐）
    // 系统会自动分析页面中的JavaScript代码，提取API地址和Token
    {
        type: 'web',
        name: '从MisaCard激活页面抓取',
        url: 'https://misacard.com/activate',
        jsParser: true  // 启用JavaScript代码解析，自动提取API配置
    },

    // 方式2: 如果页面有明确的配置元素，可以使用CSS选择器
    // {
    //     type: 'web',
    //     name: '从MisaCard页面选择器提取',
    //     url: 'https://misacard.com/activate',
    //     selectors: {
    //         apiBaseUrl: '#api-url',  // 替换为实际的CSS选择器
    //         apiToken: '#api-token'   // 替换为实际的CSS选择器
    //     }
    // },

    // 方式3: 如果MisaCard提供了配置API（如果有的话）
    // {
    //     type: 'api',
    //     name: '从MisaCard配置API获取',
    //     url: 'https://misacard.com/api/config',  // 替换为实际的API地址
    //     method: 'GET',
    //     responseParser: (response) => {
    //         return {
    //             apiBaseUrl: response.data.api_url || response.data.apiBaseUrl,
    //             apiToken: response.data.token || response.data.apiToken
    //         };
    //     }
    // },

    // 方式4: 备用方案 - 从其他来源获取（如GitHub Gist）
    // {
    //     type: 'file',
    //     name: '从备用源获取',
    //     path: 'https://gist.githubusercontent.com/your-username/gist-id/raw/...',
    //     parser: (data) => ({
    //         apiBaseUrl: data.api_url,
    //         apiToken: data.token
    //     })
    // }
];

