export default function CTAGroup() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <button
        className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        data-analytics="cta-sandbox"
      >
        Start Free Sandbox
      </button>
      <button
        className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors"
        data-analytics="cta-sales"
      >
        Talk to Sales
      </button>
    </div>
  );
}