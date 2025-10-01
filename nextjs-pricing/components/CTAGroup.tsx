'use client';

function scrollToTab(tabId: 'standard' | 'high-ticket') {
  const pricingSection = document.getElementById('pricing-table');
  pricingSection?.scrollIntoView({ behavior: 'smooth' });

  // Trigger tab change after scroll
  setTimeout(() => {
    // Find and click the tab button
    const tabButtons = document.querySelectorAll('[role="tab"], button[data-tab-id]');
    tabButtons.forEach((button) => {
      if (button.textContent?.includes(tabId === 'standard' ? 'Core Trust' : 'High-Ticket Shield')) {
        (button as HTMLElement).click();
      }
    });
  }, 500);
}

export default function CTAGroup() {
  const handleCoreTraustClick = () => {
    scrollToTab('standard');
  };

  const handleHighTicketClick = () => {
    scrollToTab('high-ticket');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <button
        onClick={handleCoreTraustClick}
        className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        data-analytics="cta-core-trust"
      >
        View Core Trust Plans
      </button>
      <button
        onClick={handleHighTicketClick}
        className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors"
        data-analytics="cta-high-ticket"
      >
        View High-Ticket Plans
      </button>
    </div>
  );
}
