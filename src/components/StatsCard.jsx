export default function StatsCard({ title, value, color, icon }) {
  const colorClasses = {
    yellow: 'text-yellow-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    pink: 'text-tiktok-pink',
    cyan: 'text-tiktok-cyan',
    purple: 'text-purple-500',
    orange: 'text-orange-500'
  };

  return (
    <div className="card hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${colorClasses[color] || 'text-white'}`}>
            {value}
          </p>
        </div>
        {icon && (
          <div className={`p-3 rounded-lg bg-gray-700 ${colorClasses[color] || 'text-white'}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
