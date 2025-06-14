
import SmartCutout from "@/components/SmartCutout";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            智能抠图工具
          </h1>
          <p className="text-lg text-gray-600">
            基于PaddleSeg技术的专业背景去除工具，支持纯色背景智能识别与精确抠图
          </p>
        </div>
        <SmartCutout />
      </div>
    </div>
  );
};

export default Index;
