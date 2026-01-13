// src/components/FeatureCard.jsx
const FeatureCard = ({ title, description, actionText }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold mb-2 text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
        {actionText} →
      </button>
    </div>
  );
};

export default FeatureCard;
