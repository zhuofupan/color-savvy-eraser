
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import ColorPicker from './ColorPicker';
import { CutoutParameters } from './SmartCutout';

interface ParameterPanelProps {
  parameters: CutoutParameters;
  onParametersChange: (params: CutoutParameters) => void;
  detectedBgColor: string;
}

const ParameterPanel: React.FC<ParameterPanelProps> = ({
  parameters,
  onParametersChange,
  detectedBgColor
}) => {
  const updateParameter = <K extends keyof CutoutParameters>(
    key: K,
    value: CutoutParameters[K]
  ) => {
    onParametersChange({
      ...parameters,
      [key]: value
    });
  };

  // 处理文本框输入
  const handleNumberInput = (
    key: keyof CutoutParameters,
    value: string,
    min: number,
    max: number,
    isFloat: boolean = false
  ) => {
    const numValue = isFloat ? parseFloat(value) : parseInt(value);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      updateParameter(key, numValue as any);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-800">
          抠图参数设置
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 背景色设置 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            背景颜色设置
          </Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div 
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: detectedBgColor }}
              />
              自动检测: {detectedBgColor}
            </div>
            <ColorPicker
              color={parameters.backgroundColor}
              onChange={(color) => updateParameter('backgroundColor', color)}
              label="自定义背景色"
            />
          </div>
        </div>

        <Separator />

        {/* RGB通道控制 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            RGB通道控制
          </Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-r" className="text-sm text-red-600 font-medium">
                红色通道 (R)
              </Label>
              <Switch
                id="enable-r"
                checked={parameters.enableR}
                onCheckedChange={(checked) => updateParameter('enableR', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-g" className="text-sm text-green-600 font-medium">
                绿色通道 (G)
              </Label>
              <Switch
                id="enable-g"
                checked={parameters.enableG}
                onCheckedChange={(checked) => updateParameter('enableG', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-b" className="text-sm text-blue-600 font-medium">
                蓝色通道 (B)
              </Label>
              <Switch
                id="enable-b"
                checked={parameters.enableB}
                onCheckedChange={(checked) => updateParameter('enableB', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* 颜色容差 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">
              颜色容差
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={parameters.colorTolerance}
                onChange={(e) => handleNumberInput('colorTolerance', e.target.value, 0, 100)}
                className="w-16 h-8 text-xs"
              />
              <span className="text-xs text-gray-500">/ 100</span>
            </div>
          </div>
          <Slider
            value={[parameters.colorTolerance]}
            onValueChange={([value]) => updateParameter('colorTolerance', value)}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            值越大，容忍的颜色差异越大
          </p>
        </div>

        <Separator />

        {/* 边缘透明度 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">
              边缘透明度
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={parameters.edgeTransparency.toFixed(1)}
                onChange={(e) => handleNumberInput('edgeTransparency', e.target.value, 0, 1, true)}
                className="w-16 h-8 text-xs"
              />
              <span className="text-xs text-gray-500">({(parameters.edgeTransparency * 100).toFixed(0)}%)</span>
            </div>
          </div>
          <Slider
            value={[parameters.edgeTransparency]}
            onValueChange={([value]) => updateParameter('edgeTransparency', value)}
            min={0}
            max={1}
            step={0.1}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            控制边缘羽化效果，0为完全透明，1为完全不透明
          </p>
        </div>

        <Separator />

        {/* 最小像素面积 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">
              最小像素面积
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="1000"
                value={parameters.minPixelArea}
                onChange={(e) => handleNumberInput('minPixelArea', e.target.value, 1, 1000)}
                className="w-20 h-8 text-xs"
              />
              <span className="text-xs text-gray-500">px</span>
            </div>
          </div>
          <Slider
            value={[parameters.minPixelArea]}
            onValueChange={([value]) => updateParameter('minPixelArea', value)}
            min={1}
            max={1000}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            过滤掉小于此面积的背景色块，减少噪点
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParameterPanel;
