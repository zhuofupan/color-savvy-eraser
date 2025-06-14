
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon } from "lucide-react";
import { CutoutParameters } from './SmartCutout';
import { applyRGBChannelFilter } from '@/utils/imageProcessor';

interface PreviewCanvasProps {
  originalImage: HTMLImageElement | null;
  processedImage: HTMLCanvasElement | null;
  parameters: CutoutParameters;
  isProcessing: boolean;
}

const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  originalImage,
  processedImage,
  parameters,
  isProcessing
}) => {
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showContrastBg, setShowContrastBg] = useState(false);

  // 绘制原始图片（应用RGB通道过滤）
  const drawOriginalImage = useCallback(() => {
    if (!originalImage || !originalCanvasRef.current) return;

    const canvas = originalCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = originalImage.width;
    canvas.height = originalImage.height;

    // 应用RGB通道过滤
    const filteredCanvas = applyRGBChannelFilter(originalImage, parameters);
    ctx.drawImage(filteredCanvas, 0, 0);
  }, [originalImage, parameters]);

  // 绘制处理后的图片
  const drawProcessedImage = useCallback(() => {
    if (!processedImage || !processedCanvasRef.current) return;

    const canvas = processedCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = processedImage.width;
    canvas.height = processedImage.height;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 如果显示对比背景，先绘制棋盘格或对比色
    if (showContrastBg) {
      drawContrastBackground(ctx, canvas.width, canvas.height);
    }

    // 绘制处理后的图片
    ctx.drawImage(processedImage, 0, 0);
  }, [processedImage, showContrastBg]);

  // 绘制对比背景
  const drawContrastBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 获取图片主色调的对比色
    const contrastColor = getContrastColor(parameters.backgroundColor);
    
    // 绘制棋盘格背景
    const squareSize = 20;
    for (let x = 0; x < width; x += squareSize) {
      for (let y = 0; y < height; y += squareSize) {
        const isEven = (Math.floor(x / squareSize) + Math.floor(y / squareSize)) % 2 === 0;
        ctx.fillStyle = isEven ? '#f0f0f0' : contrastColor;
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }
  };

  // 获取对比色
  const getContrastColor = (color: string): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 计算亮度
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // 返回对比色
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  // 处理鼠标事件
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    drawOriginalImage();
  }, [drawOriginalImage]);

  useEffect(() => {
    drawProcessedImage();
  }, [drawProcessedImage]);

  return (
    <div className="space-y-4">
      {/* 预览控制工具栏 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">缩放: {(zoom * 100).toFixed(0)}%</Badge>
            <Button size="sm" variant="outline" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleResetView}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          <Button
            size="sm"
            variant={showContrastBg ? "default" : "outline"}
            onClick={() => setShowContrastBg(!showContrastBg)}
          >
            对比背景
          </Button>
        </div>
      </Card>

      {/* 预览区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 原始图片预览 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">原始图片 (RGB通道过滤)</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div 
              className="relative border border-gray-200 rounded overflow-hidden bg-gray-50"
              style={{ height: '400px' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {originalImage ? (
                <canvas
                  ref={originalCanvasRef}
                  className="absolute cursor-move"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'top left'
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>请上传图片</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 处理后图片预览 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">抠图结果</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div 
              className="relative border border-gray-200 rounded overflow-hidden bg-gray-50"
              style={{ height: '400px' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500">处理中...</p>
                  </div>
                </div>
              ) : processedImage ? (
                <canvas
                  ref={processedCanvasRef}
                  className="absolute cursor-move"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'top left'
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>等待处理</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PreviewCanvas;
