export default function Pillars() {
  const pillars = [
    {
      title: "Lower Disputes",
      description: "Deflect buyer-remorse chargebacks before they hit Visa/MC.",
      icon: "🛡️"
    },
    {
      title: "Prove Commissions",
      description: "Signed receipts with affiliate attribution end dashboard fights.",
      icon: "📊"
    },
    {
      title: "Pass Audits",
      description: "Immutable, standards-based receipts auditors can verify offline.",
      icon: "✓"
    }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {pillars.map((pillar, index) => (
        <div key={index} className="text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">{pillar.icon}</span>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">
            {pillar.title}
          </h3>
          <p className="text-gray-600">
            {pillar.description}
          </p>
        </div>
      ))}
    </div>
  );
}