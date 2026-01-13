// src/components/Card.jsx
const Card = ({ title, children, className = "" }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      {title && <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>}
      {children}
    </div>
  );
};

export default Card;
