# 图片目录使用说明

这个目录用于存放教程中使用的图片文件。

## Gemini 教程所需图片

**请将以下两张图片放入此目录：**

1. **gemini-bind-card-tutorial.png** - Gemini 绑卡完整流程教程（7个步骤的截图）
2. **gemini-error-solution.png** - Gemini 绑卡报错解决方法（4个步骤的解决方案）

这两张图片已经在教程 HTML 文件中配置好了，放入后即可自动显示。

## 如何添加图片

1. **将图片文件放入此目录**
   - 支持的格式：`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
   - 建议使用 `.png` 或 `.jpg` 格式
   - 建议图片文件名使用英文和数字，避免中文和特殊字符

2. **在教程 HTML 文件中引用图片**

   在 `使用说明.html` 或 `gemini-使用说明.html` 中，找到需要添加图片的位置，使用以下代码：

   ```html
   <div class="tutorial-image-container">
       <img src="/images/你的图片文件名.png" alt="图片描述" class="tutorial-image">
       <div class="tutorial-image-caption">图1：图片说明文字</div>
   </div>
   ```

3. **多张图片并排显示**

   如果需要并排显示多张图片，可以使用：

   ```html
   <div class="image-grid">
       <div class="image-grid-item">
           <img src="/images/图片1.png" alt="图片1" class="tutorial-image">
           <div class="tutorial-image-caption">图1：说明文字</div>
       </div>
       <div class="image-grid-item">
           <img src="/images/图片2.png" alt="图片2" class="tutorial-image">
           <div class="tutorial-image-caption">图2：说明文字</div>
       </div>
   </div>
   ```

## 图片路径说明

- 图片路径使用 `/images/图片文件名` 格式
- 服务器会自动从 `public/images/` 目录提供图片
- 确保图片文件名正确，区分大小写

## 图片优化建议

- 图片大小建议控制在 500KB 以内，以提高加载速度
- 可以使用图片压缩工具优化图片大小
- 建议使用 PNG 格式保存截图，JPG 格式保存照片

## 示例

假设你有一张名为 `query-example.png` 的图片：

1. 将 `query-example.png` 放入 `public/images/` 目录
2. 在 HTML 中添加：
   ```html
   <div class="tutorial-image-container">
       <img src="/images/query-example.png" alt="查询示例" class="tutorial-image">
       <div class="tutorial-image-caption">图1：输入卡密查询状态示例</div>
   </div>
   ```

图片就会在教程页面中显示出来！

