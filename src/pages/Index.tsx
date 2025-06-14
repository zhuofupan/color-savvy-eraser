
import SmartCutout from "@/components/SmartCutout";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            AI 智能抠图工具
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            基于 Hugging Face Transformers.js 的专业背景移除工具
          </p>
          <p className="text-sm text-gray-500">
            支持 AI 智能抠图和传统算法抠图，提供高质量的背景去除效果
          </p>
        </div>
        <SmartCutout />
      </div>
    </div>
  );
};

export default Index;
