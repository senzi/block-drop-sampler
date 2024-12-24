const upload = document.getElementById('upload');
const originalCard = document.getElementById('original-card');
const resultCard20 = document.getElementById('result-card-20');
const resultCard30 = document.getElementById('result-card-30');
const originalWrapper = document.querySelector('#original-card .img-wrapper');
const resultWrapper20 = document.querySelector('#result-card-20 .img-wrapper');
const resultWrapper30 = document.querySelector('#result-card-30 .img-wrapper');
const resolutionSpan = document.querySelector('#original-card .resolution');

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
            
            // 处理图片并显示20×20结果卡片
            const processedImage20 = processImage(img, 20);
            resultCard20.style.display = 'block';
            displayImage(processedImage20, resultWrapper20);

            // 处理图片并显示30×30结果卡片
            const processedImage30 = processImage(img, 30);
            resultCard30.style.display = 'block';
            displayImage(processedImage30, resultWrapper30);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// 处理下载按钮点击
document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const wrapper = this.parentElement.querySelector('.img-wrapper');
        const img = wrapper.querySelector('img');
        if (!img) return;

        const link = document.createElement('a');
        const cardType = this.closest('.card').id.includes('20') ? '20x20' : '30x30';
        link.download = `processed-image-${cardType}.png`;
        link.href = img.src;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});

// 显示图片函数
function displayImage(img, container) {
    // 清空容器
    container.innerHTML = '';
    
    // 创建新的img元素
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
    let width = img.width;
    let height = img.height;

    // 如果宽度不是偶数，添加一列
    if (width % 2 !== 0) width += 1;
    // 如果高度不是偶数，添加一行
    if (height % 2 !== 0) height += 1;

    // 设置源画布尺寸
    sourceCanvas.width = width;
    sourceCanvas.height = height;

    // 绘制原图
    sourceCtx.drawImage(img, 0, 0, img.width, img.height);

    // 如果需要添加行或列，复制最后一行/列
    if (img.width % 2 !== 0) {
        sourceCtx.drawImage(sourceCanvas, 
            img.width - 1, 0, 1, height,  // 源
            img.width, 0, 1, height       // 目标
        );
    }
    if (img.height % 2 !== 0) {
        sourceCtx.drawImage(sourceCanvas,
            0, img.height - 1, width, 1,  // 源
            0, img.height, width, 1       // 目标
        );
    }

    // 计算块大小
    const blockWidth = Math.floor(width / N);
    const blockHeight = Math.floor(height / N);

    // 创建目标画布 - 大小是原来的1/4（因为隔行隔列采样）
    const targetCanvas = document.createElement('canvas');
    const targetCtx = targetCanvas.getContext('2d');
    targetCanvas.width = Math.floor(width / 2);
    targetCanvas.height = Math.floor(height / 2);

    // 隔行隔列复制块
    let targetY = 0;
    for (let y = 1; y < N; y += 2) {
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
    finalCanvas.width = img.width;
    finalCanvas.height = img.height;
    const finalCtx = finalCanvas.getContext('2d');
    
    // 将采样后的图像放大到原始尺寸
    finalCtx.drawImage(targetCanvas, 0, 0, targetCanvas.width, targetCanvas.height, 
                      0, 0, img.width, img.height);

    return finalCanvas;
}