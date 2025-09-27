'use client';

export default function CTAGroup() {
  const handleSandboxClick = () => {
    // Link to Starter plan (free sandbox)
    const pricingSection = document.getElementById('pricing-table');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });

      // Highlight the Starter plan
      setTimeout(() => {
        const starterCard = document.querySelector('[data-plan-id="starter"]');
        if (starterCard) {
          starterCard.classList.add('ring-2', 'ring-green-500', 'ring-offset-2');
          setTimeout(() => {
            starterCard.classList.remove('ring-2', 'ring-green-500', 'ring-offset-2');
          }, 3000);
        }
      }, 500);
    }
  };

  const handleSalesClick = () => {
    // For high-ticket sales - could link to custom form or calendar
    // For now, scroll to pricing with Business plan highlighted
    const pricingSection = document.getElementById('pricing-table');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });

      // Highlight the Business plan for enterprise sales
      setTimeout(() => {
        const businessCard = document.querySelector('[data-plan-id="business"]');
        if (businessCard) {
          businessCard.classList.add('ring-2', 'ring-purple-500', 'ring-offset-2');
          setTimeout(() => {
            businessCard.classList.remove('ring-2', 'ring-purple-500', 'ring-offset-2');
          }, 3000);
        }
      }, 500);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <button
        onClick={handleSandboxClick}
        className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        data-analytics="cta-sandbox"
      >
        Start Free Sandbox
      </button>
      <button
        onClick={handleSalesClick}
        className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors"
        data-analytics="cta-sales"
      >
        Talk to Sales
      </button>
    </div>
  );
}