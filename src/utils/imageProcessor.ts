import { CutoutParameters } from '@/components/SmartCutout';

// 检测图像的主要背景色
export const detectBackgroundColor = (image: HTMLImageElement): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '#ffffff';
  
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // 采样边缘像素来检测背景色
  const edgePixels: number[][] = [];
  const sampleSize = 10;
  
  // 上边缘
  for (let x = 0; x < canvas.width; x += sampleSize) {
    for (let y = 0; y < sampleSize && y < canvas.height; y++) {
      const index = (y * canvas.width + x) * 4;
      edgePixels.push([data[index], data[index + 1], data[index + 2]]);
    }
  }
  
  // 下边缘
  for (let x = 0; x < canvas.width; x += sampleSize) {
    for (let y = Math.max(0, canvas.height - sampleSize); y < canvas.height; y++) {
      const index = (y * canvas.width + x) * 4;
      edgePixels.push([data[index], data[index + 1], data[index + 2]]);
    }
  }
  
  // 左边缘
  for (let y = 0; y < canvas.height; y += sampleSize) {
    for (let x = 0; x < sampleSize && x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      edgePixels.push([data[index], data[index + 1], data[index + 2]]);
    }
  }
  
  // 右边缘
  for (let y = 0; y < canvas.height; y += sampleSize) {
    for (let x = Math.max(0, canvas.width - sampleSize); x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      edgePixels.push([data[index], data[index + 1], data[index + 2]]);
    }
  }
  
  // 找到最常见的颜色
  const colorCount: { [key: string]: number } = {};
  
  edgePixels.forEach(([r, g, b]) => {
    // 对颜色进行量化以提高检测精度
    const quantizedR = Math.floor(r / 16) * 16;
    const quantizedG = Math.floor(g / 16) * 16;
    const quantizedB = Math.floor(b / 16) * 16;
    const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
    colorCount[colorKey] = (colorCount[colorKey] || 0) + 1;
  });
  
  // 找到最常见的颜色
  let maxCount = 0;
  let dominantColor = '255,255,255';
  
  Object.entries(colorCount).forEach(([color, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantColor = color;
    }
  });
  
  const [r, g, b] = dominantColor.split(',').map(Number);
  return rgbToHex(r, g, b);
};

// RGB转16进制
const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

// 16进制转RGB
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [255, 255, 255];
};

// 应用RGB通道过滤
export const applyRGBChannelFilter = (
  image: HTMLImageElement, 
  parameters: CutoutParameters
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('无法获取canvas上下文');
  
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // 应用通道过滤
  for (let i = 0; i < data.length; i += 4) {
    if (!parameters.enableR) data[i] = 0;     // R
    if (!parameters.enableG) data[i + 1] = 0; // G
    if (!parameters.enableB) data[i + 2] = 0; // B
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

// 计算颜色差异
const colorDifference = (
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number => {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) + 
    Math.pow(g1 - g2, 2) + 
    Math.pow(b1 - b2, 2)
  );
};

// 连通区域标记
const floodFill = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  targetColor: [number, number, number],
  tolerance: number,
  enabledChannels: { r: boolean; g: boolean; b: boolean }
): boolean[] => {
  const visited = new Array(width * height).fill(false);
  const stack: [number, number][] = [[startX, startY]];
  const region: boolean[] = new Array(width * height).fill(false);
  
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const index = y * width + x;
    
    if (x < 0 || x >= width || y < 0 || y >= height || visited[index]) {
      continue;
    }
    
    const pixelIndex = index * 4;
    const pixelR = data[pixelIndex];
    const pixelG = data[pixelIndex + 1];
    const pixelB = data[pixelIndex + 2];
    
    // 根据启用的通道计算颜色差异
    let diff = 0;
    let channelCount = 0;
    
    if (enabledChannels.r) {
      diff += Math.pow(pixelR - targetColor[0], 2);
      channelCount++;
    }
    if (enabledChannels.g) {
      diff += Math.pow(pixelG - targetColor[1], 2);
      channelCount++;
    }
    if (enabledChannels.b) {
      diff += Math.pow(pixelB - targetColor[2], 2);
      channelCount++;
    }
    
    if (channelCount === 0) continue;
    
    diff = Math.sqrt(diff / channelCount);
    
    if (diff > tolerance) continue;
    
    visited[index] = true;
    region[index] = true;
    
    // 添加相邻像素到栈中
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  
  return region;
};

// 检查像素是否匹配目标颜色
const isPixelMatchingColor = (
  data: Uint8ClampedArray,
  index: number,
  targetColor: [number, number, number],
  tolerance: number,
  enabledChannels: { r: boolean; g: boolean; b: boolean }
): boolean => {
  const pixelIndex = index * 4;
  const pixelR = data[pixelIndex];
  const pixelG = data[pixelIndex + 1];
  const pixelB = data[pixelIndex + 2];
  
  let diff = 0;
  let channelCount = 0;
  
  if (enabledChannels.r) {
    diff += Math.pow(pixelR - targetColor[0], 2);
    channelCount++;
  }
  if (enabledChannels.g) {
    diff += Math.pow(pixelG - targetColor[1], 2);
    channelCount++;
  }
  if (enabledChannels.b) {
    diff += Math.pow(pixelB - targetColor[2], 2);
    channelCount++;
  }
  
  if (channelCount === 0) return false;
  
  diff = Math.sqrt(diff / channelCount);
  return diff <= tolerance;
};

// 内部背景色块检测和移除
const removeInternalBackgroundBlocks = (
  data: Uint8ClampedArray,
  outputData: Uint8ClampedArray,
  width: number,
  height: number,
  targetColor: [number, number, number],
  tolerance: number,
  minPixelArea: number,
  enabledChannels: { r: boolean; g: boolean; b: boolean }
): void => {
  const processed = new Array(width * height).fill(false);
  
  console.log('开始检测内部背景色块...');
  
  // 遍历所有未被透明化的像素
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      
      // 跳过已处理的像素或已透明的像素
      if (processed[index] || outputData[index * 4 + 3] === 0) {
        continue;
      }
      
      // 检查当前像素是否匹配背景色
      if (isPixelMatchingColor(data, index, targetColor, tolerance, enabledChannels)) {
        // 进行洪水填充找到连通区域
        const region = floodFill(
          data,
          width,
          height,
          x,
          y,
          targetColor,
          tolerance,
          enabledChannels
        );
        
        // 计算区域大小
        const regionSize = region.filter(Boolean).length;
        console.log(`发现内部背景色块，大小: ${regionSize} 像素`);
        
        // 如果区域大小满足最小面积要求，则移除
        if (regionSize >= minPixelArea) {
          region.forEach((shouldRemove, i) => {
            if (shouldRemove) {
              outputData[i * 4 + 3] = 0; // 设置为透明
              processed[i] = true;
            }
          });
          console.log(`移除了大小为 ${regionSize} 的内部背景色块`);
        } else {
          // 标记为已处理但不移除
          region.forEach((pixel, i) => {
            if (pixel) {
              processed[i] = true;
            }
          });
          console.log(`保留了大小为 ${regionSize} 的小色块（小于最小面积）`);
        }
      }
    }
  }
  
  console.log('内部背景色块检测完成');
};

// 主要的图像处理函数
export const processImage = async (
  image: HTMLImageElement,
  parameters: CutoutParameters
): Promise<HTMLCanvasElement> => {
  console.log('开始图像处理...');
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('无法获取canvas上下文');
  
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const outputData = new Uint8ClampedArray(data);
  
  const [targetR, targetG, targetB] = hexToRgb(parameters.backgroundColor);
  const enabledChannels = {
    r: parameters.enableR,
    g: parameters.enableG,
    b: parameters.enableB
  };
  
  console.log('目标背景色:', parameters.backgroundColor, `RGB(${targetR}, ${targetG}, ${targetB})`);
  console.log('启用的通道:', enabledChannels);
  
  // 第一步：边缘抠图 - 创建标记数组，记录哪些像素需要被移除
  const toRemove = new Array(canvas.width * canvas.height).fill(false);
  const processed = new Array(canvas.width * canvas.height).fill(false);
  
  // 从边缘开始扫描
  const edgePixels: [number, number][] = [];
  
  // 添加边缘像素
  for (let x = 0; x < canvas.width; x++) {
    edgePixels.push([x, 0], [x, canvas.height - 1]);
  }
  for (let y = 0; y < canvas.height; y++) {
    edgePixels.push([0, y], [canvas.width - 1, y]);
  }
  
  console.log('开始边缘抠图...');
  
  // 对每个边缘像素进行洪水填充
  edgePixels.forEach(([x, y]) => {
    const index = y * canvas.width + x;
    if (processed[index]) return;
    
    if (isPixelMatchingColor(data, index, [targetR, targetG, targetB], parameters.colorTolerance, enabledChannels)) {
      // 进行洪水填充
      const region = floodFill(
        data,
        canvas.width,
        canvas.height,
        x,
        y,
        [targetR, targetG, targetB],
        parameters.colorTolerance,
        enabledChannels
      );
      
      // 计算区域大小
      const regionSize = region.filter(Boolean).length;
      
      // 如果区域大小满足最小面积要求，则标记为需要移除
      if (regionSize >= parameters.minPixelArea) {
        region.forEach((shouldRemove, i) => {
          if (shouldRemove) {
            toRemove[i] = true;
            processed[i] = true;
          }
        });
      }
    }
  });
  
  // 应用边缘移除标记
  for (let i = 0; i < toRemove.length; i++) {
    if (toRemove[i]) {
      const pixelIndex = i * 4;
      outputData[pixelIndex + 3] = 0; // 设置为完全透明
    }
  }
  
  console.log('边缘抠图完成');
  
  // 第二步：内部背景色块检测和移除
  removeInternalBackgroundBlocks(
    data,
    outputData,
    canvas.width,
    canvas.height,
    [targetR, targetG, targetB],
    parameters.colorTolerance,
    parameters.minPixelArea,
    enabledChannels
  );
  
  // 第三步：应用边缘透明度（羽化效果）
  if (parameters.edgeTransparency < 1) {
    console.log('应用边缘羽化效果...');
    const edgeDistance = 3; // 羽化范围
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = y * canvas.width + x;
        const pixelIndex = index * 4;
        
        // 只对不透明的像素应用羽化
        if (outputData[pixelIndex + 3] > 0) {
          // 检查周围是否有被移除的像素
          let nearEdge = false;
          let minDistance = edgeDistance;
          
          for (let dy = -edgeDistance; dy <= edgeDistance; dy++) {
            for (let dx = -edgeDistance; dx <= edgeDistance; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              
              if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                const nIndex = ny * canvas.width + nx;
                const nPixelIndex = nIndex * 4;
                if (outputData[nPixelIndex + 3] === 0) {
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  if (distance < minDistance) {
                    minDistance = distance;
                    nearEdge = true;
                  }
                }
              }
            }
          }
          
          if (nearEdge) {
            const edgeFactor = minDistance / edgeDistance;
            const alpha = Math.floor(
              outputData[pixelIndex + 3] * 
              (parameters.edgeTransparency + (1 - parameters.edgeTransparency) * edgeFactor)
            );
            outputData[pixelIndex + 3] = Math.max(0, Math.min(255, alpha));
          }
        }
      }
    }
  }
  
  // 创建输出画布
  const outputCanvas = document.createElement('canvas');
  const outputCtx = outputCanvas.getContext('2d');
  
  if (!outputCtx) throw new Error('无法获取输出canvas上下文');
  
  outputCanvas.width = canvas.width;
  outputCanvas.height = canvas.height;
  
  const outputImageData = new ImageData(outputData, canvas.width, canvas.height);
  outputCtx.putImageData(outputImageData, 0, 0);
  
  console.log('图像处理完成');
  return outputCanvas;
};
