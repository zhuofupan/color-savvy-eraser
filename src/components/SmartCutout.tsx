
import React, { useState, useRef, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Download, RotateCcw, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import ParameterPanel from './ParameterPanel';
import PreviewCanvas from './PreviewCanvas';
import ColorPicker from './ColorPicker';
import { detectBackgroundColor, processImage } from '@/utils/imageProcessor';

export interface CutoutParameters {
  enableR: boolean;
  enableG: boolean;
  enableB: boolean;
  colorTolerance: number;
  edgeTransparency: number;
  minPixelArea: number;
  backgroundColor: string;
}

const SmartCutout = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [processedImage, setProcessedImage] = useState<HTMLCanvasElement | null>(null);
  const [detectedBgColor, setDetectedBgColor] = useState<string>('#ffffff');
  const [parameters, setParameters] = useState<CutoutParameters>({
    enableR: true,
    enableG: true,
    enableB: true,
    colorTolerance: 30,
    edgeTransparency: 0.5,
    minPixelArea: 100,
    backgroundColor: '#ffffff'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请选择有效的图片文件');
      return;
    }

    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      
      // 自动检测背景色
      const bgColor = detectBackgroundColor(img);
      setDetectedBgColor(bgColor);
      setParameters(prev => ({
        ...prev,
        backgroundColor: bgColor
      }));
      
      toast.success('图片加载成功，已自动检测背景色');
    };
    
    img.onerror = () => {
      toast.error('图片加载失败');
    };
    
    img.src = URL.createObjectURL(file);
  }, []);

  const handleProcess = useCallback(async () => {
    if (!originalImage) {
      toast.error('请先上传图片');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processImage(originalImage, parameters);
      setProcessedImage(result);
      toast.success('抠图处理完成');
    } catch (error) {
      console.error('处理错误:', error);
      toast.error('处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, parameters]);

  const handleDownload = useCallback(() => {
    if (!processedImage) {
      toast.error('没有可下载的图片');
      return;
    }

    processedImage.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cutout_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('图片下载成功');
      }
    }, 'image/png');
  }, [processedImage]);

  const handleReset = useCallback(() => {
    setOriginalImage(null);
    setProcessedImage(null);
    setDetectedBgColor('#ffffff');
    setParameters({
      enableR: true,
      enableG: true,
      enableB: true,
      colorTolerance: 30,
      edgeTransparency: 0.5,
      minPixelArea: 100,
      backgroundColor: '#ffffff'
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('已重置所有设置');
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 工具栏 */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              上传图片
            </Button>
          </div>
          
          <Button
            onClick={handleProcess}
            disabled={!originalImage || isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            {isProcessing ? '处理中...' : '开始抠图'}
          </Button>
          
          <Button
            onClick={handleDownload}
            disabled={!processedImage}
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Download className="w-4 h-4 mr-2" />
            下载结果
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重置
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 参数控制面板 */}
        <div className="lg:col-span-1">
          <ParameterPanel
            parameters={parameters}
            onParametersChange={setParameters}
            detectedBgColor={detectedBgColor}
          />
        </div>

        {/* 预览区域 */}
        <div className="lg:col-span-2">
          <PreviewCanvas
            originalImage={originalImage}
            processedImage={processedImage}
            parameters={parameters}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
};

export default SmartCutout;
