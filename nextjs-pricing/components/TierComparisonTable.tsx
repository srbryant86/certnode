export default function TierComparisonTable() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm mb-12">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Which plan is right for you?
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Feature</th>
              <th className="py-4 px-4 text-center">
                <div className="font-bold text-gray-900">Starter</div>
                <div className="text-xs text-gray-500 font-normal">For Startups</div>
              </th>
              <th className="py-4 px-4 text-center bg-blue-50 rounded-t-lg">
                <div className="font-bold text-blue-600">Professional</div>
                <div className="text-xs text-blue-500 font-normal">⭐ Most Popular</div>
              </th>
              <th className="py-4 px-4 text-center">
                <div className="font-bold text-gray-900">Business</div>
                <div className="text-xs text-gray-500 font-normal">For Operators</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-4 px-4 text-gray-700">Monthly Receipts</td>
              <td className="py-4 px-4 text-center">1,000</td>
              <td className="py-4 px-4 text-center bg-blue-50 font-semibold">5,000</td>
              <td className="py-4 px-4 text-center">25,000</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-4 px-4 text-gray-700">Transaction Receipts</td>
              <td className="py-4 px-4 text-center">
                <span className="text-green-600">✓</span>
              </td>
              <td className="py-4 px-4 text-center bg-blue-50">
                <span className="text-green-600">✓</span>
              </td>
              <td className="py-4 px-4 text-center">
                <span className="text-green-600">✓</span>
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-4 px-4 text-gray-700">Receipt Graph</td>
              <td className="py-4 px-4 text-center text-gray-400">Basic</td>
              <td className="py-4 px-4 text-center bg-blue-50">
                <span className="text-green-600">✓ Full</span>
              </td>
              <td className="py-4 px-4 text-center">
                <span className="text-green-600">✓ Full</span>
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-4 px-4 text-gray-700">API Access</td>
              <td className="py-4 px-4 text-center">
                <span className="text-green-600">✓</span>
              </td>
              <td className="py-4 px-4 text-center bg-blue-50">
                <span className="text-green-600">✓</span>
              </td>
              <td className="py-4 px-4 text-center">
                <span className="text-green-600">✓</span>
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-4 px-4 text-gray-700">Priority Support</td>
              <td className="py-4 px-4 text-center text-gray-400">Email</td>
              <td className="py-4 px-4 text-center bg-blue-50">
                <span className="text-green-600">✓ Chat</span>
              </td>
              <td className="py-4 px-4 text-center">
                <span className="text-green-600">✓ Phone</span>
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-4 px-4 text-gray-700">SLA</td>
              <td className="py-4 px-4 text-center">99%</td>
              <td className="py-4 px-4 text-center bg-blue-50 font-semibold">99.9%</td>
              <td className="py-4 px-4 text-center font-semibold">99.99%</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-4 px-4 text-gray-700">Custom Integration</td>
              <td className="py-4 px-4 text-center">
                <span className="text-gray-300">✗</span>
              </td>
              <td className="py-4 px-4 text-center bg-blue-50">
                <span className="text-gray-300">✗</span>
              </td>
              <td className="py-4 px-4 text-center">
                <span className="text-green-600">✓</span>
              </td>
            </tr>
            <tr>
              <td className="py-4 px-4 text-gray-700 font-semibold">Best For</td>
              <td className="py-4 px-4 text-center text-sm">Early-stage startups</td>
              <td className="py-4 px-4 text-center bg-blue-50 text-sm font-semibold text-blue-600">Growing businesses</td>
              <td className="py-4 px-4 text-center text-sm">Large enterprises</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
