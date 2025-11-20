const puppeteer = require('puppeteer');

async function captureApiRequest() {
    // 判断是否作为模块被调用（服务器端）还是直接运行（命令行）
    const isModuleCall = require.main !== module;
    
    if (!isModuleCall) {
        console.log('🚀 启动浏览器...');
    }
    
    const browser = await puppeteer.launch({
        headless: isModuleCall, // 作为模块调用时使用headless模式（服务器端），直接运行时显示浏览器
        args: ['--disable-blink-features=AutomationControlled']
    });

    try {
        const page = await browser.newPage();
        
        // 启用请求拦截以捕获所有请求头（包括Authorization）
        await page.setRequestInterception(true);
        
        // 监听所有网络请求
        const requests = [];
        const responses = [];
        
        page.on('request', (request) => {
            const url = request.url();
            const method = request.method();
            const headers = request.headers();
            
            // 只记录API相关的请求（包含/api/和api.misacard.com）
            const isApiRequest = url.includes('/api/') && url.includes('api.misacard.com');
            const hasAuth = !!(headers.authorization || headers.Authorization);
            
            if (isApiRequest && hasAuth) {
                const requestData = {
                    url: url,
                    method: method,
                    headers: JSON.parse(JSON.stringify(headers)), // 深拷贝
                    postData: request.postData()
                };
                
                requests.push(requestData);
                
                // 静默捕获，不输出
            }
            
            // 继续请求（不拦截）
            request.continue();
        });
        
        page.on('response', async (response) => {
            const url = response.url();
            const isApiRequest = url.includes('/api/') && url.includes('api.misacard.com');
            
            if (isApiRequest) {
                const status = response.status();
                let body = '';
                try {
                    body = await response.text();
                } catch (e) {
                    body = '[无法读取响应体]';
                }
                
                responses.push({
                    url: url,
                    status: status,
                    headers: response.headers(),
                    body: body
                });
            }
        });
        
        console.log('🌐 正在打开页面: https://misacard.com/activate');
        await page.goto('https://misacard.com/activate', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('✅ 页面加载完成');
        await page.waitForTimeout(2000);
        
        // 查找输入框并输入卡密ID
        const cardId = 'mio-0689a7d3-9fea-46ee-b8ae-8c5f27d8331d';
        
        const inputSelectors = [
            'input[type="text"]',
            'input[placeholder*="卡"]',
            'input[placeholder*="ID"]',
            'input[placeholder*="mio"]',
            'input',
            'input#cardId',
            'input[name*="card"]',
            'input[name*="id"]'
        ];
        
        let input = null;
        for (const selector of inputSelectors) {
            try {
                input = await page.$(selector);
                if (input) break;
            } catch (e) {}
        }
        
        if (!input) {
            const allInputs = await page.$$('input');
            if (!isModuleCall) {
                for (let i = 0; i < allInputs.length; i++) {
                    const type = await page.evaluate(el => el.type, allInputs[i]);
                    const placeholder = await page.evaluate(el => el.placeholder, allInputs[i]);
                    const name = await page.evaluate(el => el.name, allInputs[i]);
                    const id = await page.evaluate(el => el.id, allInputs[i]);
                    console.log(`   输入框 ${i + 1}: type=${type}, placeholder="${placeholder}", name="${name}", id="${id}"`);
                }
                if (allInputs.length > 0) {
                    console.log('💡 将使用第一个输入框...');
                }
            }
            if (allInputs.length > 0) {
                input = allInputs[0];
            }
        }
        
        if (input) {
            if (!isModuleCall) {
                console.log(`📝 输入卡密ID...`);
            }
            await page.evaluate((el) => el.value = '', input);
            await input.type(cardId, { delay: 100 });
            await page.waitForTimeout(500);
        }
        
        // 查找"获取卡信息"按钮
        // 查找按钮
        
        // 优先使用精确的class选择器
        const buttonSelectors = [
            'button.w-full.rounded.bg-blue-500', // 精确匹配主要class
            'button.bg-blue-500', // 简化版本
            '//button[contains(@class, "bg-blue-500")]', // XPath版本
            '//button[contains(@class, "w-full") and contains(@class, "bg-blue-500")]', // 更精确的XPath
            'button:has-text("获取卡信息")',
            '//button[contains(text(), "获取卡信息")]',
            'button'
        ];
        
        let button = null;
        for (const selector of buttonSelectors) {
            try {
                if (selector.startsWith('//')) {
                    // XPath
                    const elements = await page.$x(selector);
                    if (elements.length > 0) {
                        // 验证按钮是否包含正确的class
                        const hasCorrectClass = await page.evaluate((el) => {
                            return el && el.classList.contains('bg-blue-500');
                        }, elements[0]);
                        
                        if (hasCorrectClass) {
                            button = elements[0];
                            break;
                        } else if (elements.length === 1) {
                            button = elements[0];
                            break;
                        }
                    }
                } else {
                    const buttons = await page.$$(selector);
                    if (buttons.length > 0) {
                        // 如果有多个按钮，找到包含正确class的那个
                        for (const btn of buttons) {
                            const hasCorrectClass = await page.evaluate((el) => {
                                return el && (el.classList.contains('bg-blue-500') || el.classList.contains('bg-blue-600'));
                            }, btn);
                            
                            if (hasCorrectClass) {
                    button = btn;
                    break;
                            }
                        }
                        
                        if (!button && buttons.length === 1) {
                            button = buttons[0];
                        }
                        
                        if (button) break;
                    }
                }
            } catch (e) {
                // 继续尝试下一个选择器
            }
        }
        
        if (!button) {
            const buttonText = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const found = buttons.find(btn => {
                    const text = btn.textContent.trim();
                    return text.includes('获取卡信息') || text.includes('获取') || text.includes('查询');
                });
                return found ? found.textContent.trim() : null;
            });
            
            if (buttonText) {
                const xpath = `//button[contains(text(), "${buttonText.substring(0, 2)}")]`;
                const elements = await page.$x(xpath);
                if (elements.length > 0) {
                    button = elements[0];
                }
            }
        }
        
        if (!button) {
            const allButtons = await page.$$('button');
            for (let i = 0; i < allButtons.length; i++) {
                const className = await page.evaluate(el => el.className, allButtons[i]);
                const hasBlueClass = className.includes('bg-blue-500') || className.includes('bg-blue-600');
                if (hasBlueClass && !button) {
                    button = allButtons[i];
                    break;
                }
            }
            
            if (!button && allButtons.length > 0) {
                for (let i = 0; i < allButtons.length; i++) {
                    const text = await page.evaluate(el => el.textContent.trim(), allButtons[i]);
                    if (text.includes('获取') || text.includes('查询') || text.includes('信息')) {
                        button = allButtons[i];
                        break;
                    }
                }
                if (!button) {
                    button = allButtons[0];
                }
            }
        }
        
        if (button) {
            // 检查按钮是否有效
            const isValid = await page.evaluate((el) => {
                return el && el instanceof HTMLElement;
            }, button);
            
            if (isValid) {
                await page.waitForTimeout(1000);
                
                try {
                    await button.click();
                } catch (e1) {
                    try {
                        await page.evaluate((el) => el?.click(), button);
                    } catch (e2) {
                        try {
                            const box = await button.boundingBox();
                            if (box) {
                                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                            }
                        } catch (e3) {
                            if (!isModuleCall) {
                                console.log('⚠️  自动点击失败，请手动点击按钮');
                            }
                            await page.waitForTimeout(30000);
                        }
                    }
                }
                
                await page.waitForTimeout(10000);
            } else {
                if (!isModuleCall) {
                    console.log('⚠️  按钮无效，请手动点击');
                }
                await page.waitForTimeout(30000);
            }
        } else {
            if (!isModuleCall) {
                console.log('⚠️  未找到按钮，请手动点击');
            }
            await page.waitForTimeout(30000);
        }
        
        // 提取关键信息
        let result = {
            success: false,
            apiBaseUrl: null,
            apiToken: null,
            message: ''
        };
        
        if (requests.length > 0) {
            // 查找包含 /api/ 路径且包含 Authorization 的请求
            const targetRequest = requests.find(req => {
                const url = req.url || '';
                const headers = req.headers || {};
                const hasAuth = !!(headers.authorization || headers.Authorization || 
                                  Object.keys(headers).some(key => key.toLowerCase() === 'authorization'));
                const isApiUrl = url.includes('/api/') && url.includes('api.misacard.com');
                return isApiUrl && hasAuth;
            }) || requests[0];
            
            if (targetRequest) {
                const headers = targetRequest.headers || {};
                const authHeader = headers.authorization || 
                                  headers.Authorization || 
                                  Object.entries(headers).find(([key]) => 
                                      key.toLowerCase() === 'authorization'
                                  )?.[1];
                
                if (authHeader) {
                    try {
                        const apiUrl = new URL(targetRequest.url);
                        result.success = true;
                        result.apiBaseUrl = apiUrl.origin;
                        result.apiToken = authHeader;
                        result.message = '抓包成功';
                    } catch (e) {
                        const urlMatch = targetRequest.url.match(/^(https?:\/\/[^\/]+)/);
                        result.success = true;
                        result.apiBaseUrl = urlMatch ? urlMatch[1] : targetRequest.url;
                        result.apiToken = authHeader;
                        result.message = '抓包成功';
                    }
                } else {
                    result.message = '未找到Authorization请求头';
                }
            } else {
                result.message = '未找到API请求';
            }
        } else {
            result.message = '未捕获到API请求';
        }
        
        await page.waitForTimeout(2000);
        
        return result;
        
    } catch (error) {
        if (!isModuleCall) {
            console.error('❌ 发生错误:', error);
        }
        return {
            success: false,
            apiBaseUrl: null,
            apiToken: null,
            message: '抓包失败: ' + error.message
        };
    } finally {
        await browser.close();
        if (!isModuleCall) {
            console.log('\n✅ 浏览器已关闭');
        }
    }
}

// 如果直接运行此文件，执行抓包并输出结果
if (require.main === module) {
    captureApiRequest()
        .then(result => {
            console.log('\n' + '='.repeat(80));
            console.log('🎯 抓包结果');
            console.log('='.repeat(80));
            
            if (result.success) {
                console.log('\n✅ API地址:');
                console.log(`   ${result.apiBaseUrl}`);
                console.log('\n✅ Authorization Token:');
                console.log(`   ${result.apiToken}`);
                console.log('\n💡 配置提示:');
                console.log(`   将以上信息配置到管理后台的API配置中`);
            } else {
                console.log(`\n⚠️  ${result.message}`);
            }
            
            console.log('\n' + '='.repeat(80));
        })
        .catch(console.error);
}

// 导出函数供其他模块使用
module.exports = captureApiRequest;

