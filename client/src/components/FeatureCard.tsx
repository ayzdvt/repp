import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  metric?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, metric }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
      <div className="p-6">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        {metric && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-sm font-medium text-gray-500">Performans Etkisi</div>
            <div className="mt-1 text-lg font-semibold text-blue-600">{metric}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureCard;