
import { pipeline, env } from '@huggingface/transformers';

// 配置 transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 1024;

// 调整图片尺寸以提高处理速度
function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

// 使用 AI 模型移除背景
export const removeBackgroundWithAI = async (imageElement: HTMLImageElement): Promise<HTMLCanvasElement> => {
  try {
    console.log('开始 AI 背景移除处理...');
    
    // 创建图像分割管道
    const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
      device: 'webgpu',
    });
    
    // 将 HTMLImageElement 转换为 canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('无法获取 canvas 上下文');
    
    // 调整图片尺寸并绘制到 canvas
    const wasResized = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`图片${wasResized ? '已' : '未'}调整尺寸。最终尺寸: ${canvas.width}x${canvas.height}`);
    
    // 获取图片数据为 base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('图片已转换为 base64');
    
    // 使用分割模型处理图片
    console.log('正在使用分割模型处理...');
    const result = await segmenter(imageData);
    
    console.log('分割结果:', result);
    
    if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
      throw new Error('无效的分割结果');
    }
    
    // 创建输出 canvas
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('无法获取输出 canvas 上下文');
    
    // 绘制原始图片
    outputCtx.drawImage(canvas, 0, 0);
    
    // 应用遮罩
    const outputImageData = outputCtx.getImageData(
      0, 0,
      outputCanvas.width,
      outputCanvas.height
    );
    const data = outputImageData.data;
    
    // 应用反转遮罩到 alpha 通道（保留主体而不是背景）
    for (let i = 0; i < result[0].mask.data.length; i++) {
      // 反转遮罩值 (1 - value) 来保留主体而不是背景
      const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
      data[i * 4 + 3] = alpha;
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    console.log('遮罩应用成功');
    
    return outputCanvas;
  } catch (error) {
    console.error('AI 背景移除错误:', error);
    throw error;
  }
};

// 加载图片工具函数
export const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
