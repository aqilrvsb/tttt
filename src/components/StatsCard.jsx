export default function StatsCard({ title, value, color, icon }) {
  const colorClasses = {
    yellow: {
      text: 'text-yellow-600',
      bg: 'bg-yellow-50'
    },
    blue: {
      text: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    green: {
      text: 'text-green-600',
      bg: 'bg-green-50'
    },
    pink: {
      text: 'text-pink-600',
      bg: 'bg-pink-50'
    },
    cyan: {
      text: 'text-cyan-600',
      bg: 'bg-cyan-50'
    },
    purple: {
      text: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    orange: {
      text: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    red: {
      text: 'text-red-600',
      bg: 'bg-red-50'
    },
    indigo: {
      text: 'text-indigo-600',
      bg: 'bg-indigo-50'
    }
  };

  const colors = colorClasses[color] || { text: 'text-gray-900', bg: 'bg-gray-50' };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">
            {value}
          </p>
        </div>
        {icon && (
          <div className={`p-3 rounded-full ${colors.bg}`}>
            <div className={`w-6 h-6 ${colors.text}`}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
