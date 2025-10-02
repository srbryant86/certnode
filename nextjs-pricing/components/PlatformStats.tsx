export default function PlatformStats() {
  const stats = [
    { number: 'API-First', label: 'Platform Architecture' },
    { number: '99.97%', label: 'Uptime SLA' },
    { number: '3 Domains', label: 'Unified Platform' },
    { number: 'SOC 2', label: 'Type II Certified' },
    { number: 'SHA-256', label: 'Cryptographic Security' },
    { number: '24/7', label: 'Enterprise Support' }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Platform Architecture</h2>
          <p className="text-lg text-gray-300">
            Technical specifications of the verification infrastructure
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-gray-300">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
