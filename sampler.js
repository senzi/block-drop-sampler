const upload = document.getElementById('upload');
const originalCard = document.getElementById('original-card');
const resultCard = document.getElementById('result-card');
const originalWrapper = document.querySelector('#original-card .img-wrapper');
const resultWrapper = document.querySelector('#result-card .img-wrapper');
const resolutionSpan = document.querySelector('#original-card .resolution');
const gridInfoSpan = document.querySelector('#result-card .grid-info');

const N = 20;  // 固定列数

// 处理图片上传
upload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // 显示原图卡片
            originalCard.style.display = 'block';
            resolutionSpan.textContent = `(${img.width} × ${img.height})`;
            displayImage(img, originalWrapper);
            
            // 处理图片并显示结果卡片
            const { processedImage, rowCount } = processImage(img, N);
            resultCard.style.display = 'block';
            gridInfoSpan.textContent = `(${N} × ${rowCount})`;
            displayImage(processedImage, resultWrapper);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// 处理下载按钮点击
document.querySelector('.download-btn').addEventListener('click', function() {
    const img = resultWrapper.querySelector('img');
    if (!img) return;

    const link = document.createElement('a');
    link.download = 'processed-image.png';
    link.href = img.src;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// 显示图片函数
function displayImage(img, container) {
    container.innerHTML = '';
    const displayImg = new Image();
    displayImg.src = img.src || img.toDataURL();
    container.appendChild(displayImg);
}

// 图片处理函数
function processImage(img, N) {
    // 创建源画布
    const sourceCanvas = document.createElement('canvas');
    const sourceCtx = sourceCanvas.getContext('2d');
    
    // 获取原始尺寸
    const originalWidth = img.width;
    const originalHeight = img.height;

    // 计算行数
    const rowCount = Math.floor(originalHeight / (originalWidth / N));
    
    // 计算需要的高度（去掉多余的行）
    const requiredHeight = Math.floor(originalWidth / N * rowCount);

    // 设置源画布尺寸
    sourceCanvas.width = originalWidth;
    sourceCanvas.height = requiredHeight;

    // 绘制裁剪后的原图
    sourceCtx.drawImage(img, 0, 0, originalWidth, requiredHeight);

    // 计算块大小
    const blockWidth = Math.floor(originalWidth / N);
    const blockHeight = Math.floor(requiredHeight / rowCount);

    // 创建目标画布 - 大小是原来的1/4（因为隔行隔列采样）
    const targetCanvas = document.createElement('canvas');
    const targetCtx = targetCanvas.getContext('2d');
    targetCanvas.width = Math.floor(originalWidth / 2);
    targetCanvas.height = Math.floor(requiredHeight / 2);

    // 隔行隔列复制块
    let targetY = 0;
    for (let y = 1; y < rowCount; y += 2) {
        let targetX = 0;
        for (let x = 1; x < N; x += 2) {
            // 复制原始图像中的整个块
            const sourceX = x * blockWidth;
            const sourceY = y * blockHeight;
            targetCtx.drawImage(
                sourceCanvas,
                sourceX, sourceY,           // 源图像起始位置
                blockWidth, blockHeight,    // 源图像块大小
                targetX, targetY,           // 目标位置
                blockWidth, blockHeight     // 目标大小
            );
            targetX += blockWidth;
        }
        targetY += blockHeight;
    }

    // 创建最终画布并调整到原始尺寸
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = originalWidth;
    finalCanvas.height = requiredHeight;
    const finalCtx = finalCanvas.getContext('2d');
    
    // 将采样后的图像放大到原始尺寸
    finalCtx.drawImage(targetCanvas, 0, 0, targetCanvas.width, targetCanvas.height, 
                      0, 0, originalWidth, requiredHeight);

    return {
        processedImage: finalCanvas,
        rowCount: rowCount
    };
}