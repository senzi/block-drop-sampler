const upload = document.getElementById('upload');
const retry = document.getElementById('retry');
const blockRange = document.getElementById('block-range');
const blockValue = document.getElementById('block-value');
const originalCard = document.getElementById('original-card');
const resultCard = document.getElementById('result-card');
const originalWrapper = document.querySelector('#original-card .img-wrapper');
const resultWrapper = document.querySelector('#result-card .img-wrapper');
const resolutionSpan = document.querySelector('#original-card .resolution');
const gridInfoSpan = document.querySelector('#result-card .grid-info');

let currentImage = null;

// 处理滑动条变化
blockRange.addEventListener('input', function() {
    const N = this.value * 10;
    blockValue.textContent = N;
    if (currentImage) {
        processAndDisplayResult(currentImage);
    }
});

// 处理图片上传
upload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            currentImage = img;
            // 启用控制按钮
            blockRange.disabled = false;
            retry.disabled = false;
            // 显示原图卡片
            originalCard.style.display = 'block';
            resolutionSpan.textContent = `(${img.width} × ${img.height})`;
            displayImage(img, originalWrapper);
            // 使用默认N=20处理图片
            blockRange.value = 2;
            blockValue.textContent = '20';
            processAndDisplayResult(img);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// 处理重试按钮
retry.addEventListener('click', function() {
    if (currentImage) {
        processAndDisplayResult(currentImage);
    }
});

// 处理下载按钮点击
document.querySelector('.download-btn').addEventListener('click', function() {
    const img = resultWrapper.querySelector('img');
    if (!img) return;

    const link = document.createElement('a');
    const N = blockRange.value * 10;
    const originalName = upload.files[0]?.name || 'image';
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    link.download = `${baseName}_N${N}.png`;
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

// 处理图片并显示结果
function processAndDisplayResult(img) {
    const N = blockRange.value * 10;
    const { processedImage, rowCount, resizeScale } = processImage(img, N);
    resultCard.style.display = 'block';
    let infoText = `(${N} × ${rowCount})`;
    if (resizeScale > 1) {
        infoText += ` [×${resizeScale}]`;
    }
    gridInfoSpan.textContent = infoText;
    displayImage(processedImage, resultWrapper);
}

// 调整图片大小函数
function resizeImage(img, targetWidth) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const ratio = targetWidth / img.width;
    canvas.width = targetWidth;
    canvas.height = Math.floor(img.height * ratio);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
}

// 图片处理函数
function processImage(img, N) {
    let sourceCanvas;
    let width = img.width;
    let height = img.height;
    let resizeScale = 1;
    
    // 计算每个块的大小
    let blockSize = Math.floor(width / N);
    
    // 如果块太小，进行放大
    while (blockSize < 10) {
        width *= 2;
        height *= 2;
        resizeScale *= 2;
        blockSize = Math.floor(width / N);
    }
    
    // 调整图片大小
    if (width !== img.width) {
        sourceCanvas = resizeImage(img, width);
    } else {
        // 调整宽度使其能被N整除
        const adjustedWidth = Math.floor(width / N) * N;
        sourceCanvas = resizeImage(img, adjustedWidth);
        width = adjustedWidth;
        height = sourceCanvas.height;
    }
    
    // 计算行数和调整后的高度
    const rowCount = Math.floor(height / (width / N));
    const adjustedHeight = Math.floor(width / N * rowCount);
    
    // 裁剪高度
    const finalSourceCanvas = document.createElement('canvas');
    const finalSourceCtx = finalSourceCanvas.getContext('2d');
    finalSourceCanvas.width = width;
    finalSourceCanvas.height = adjustedHeight;
    finalSourceCtx.drawImage(sourceCanvas, 0, 0);
    
    // 计算最终的块大小
    const blockWidth = Math.floor(width / N);
    const blockHeight = Math.floor(adjustedHeight / rowCount);

    // 创建目标画布
    const targetCanvas = document.createElement('canvas');
    const targetCtx = targetCanvas.getContext('2d');
    targetCanvas.width = Math.floor(width / 2);
    targetCanvas.height = Math.floor(adjustedHeight / 2);

    // 隔行隔列复制块
    let targetY = 0;
    for (let y = 1; y < rowCount; y += 2) {
        let targetX = 0;
        for (let x = 1; x < N; x += 2) {
            const sourceX = x * blockWidth;
            const sourceY = y * blockHeight;
            targetCtx.drawImage(
                finalSourceCanvas,
                sourceX, sourceY,
                blockWidth, blockHeight,
                targetX, targetY,
                blockWidth, blockHeight
            );
            targetX += blockWidth;
        }
        targetY += blockHeight;
    }

    // 创建最终画布
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = width;
    finalCanvas.height = adjustedHeight;
    const finalCtx = finalCanvas.getContext('2d');
    
    // 将采样后的图像放大到原始尺寸
    finalCtx.drawImage(targetCanvas, 0, 0, targetCanvas.width, targetCanvas.height, 
                      0, 0, width, adjustedHeight);

    return {
        processedImage: finalCanvas,
        rowCount: rowCount,
        resizeScale: resizeScale
    };
}