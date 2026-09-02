import React from 'react';
import ReactDOM from 'react-dom/client';
import DonationWidget from './DonationWidget';

// Custom Element for Donation Widget
class DonationWidgetElement extends HTMLElement {
  constructor() {
    super();
    this._root = null;
    this._mountPoint = null;
  }

  connectedCallback() {
    // Get attributes
    const organizationId = this.getAttribute('organization-id') || '';
    const campaignId = this.getAttribute('campaign-id') || '';
    const theme = this.getAttribute('theme') || 'light';
    const suggestedAmounts = this.getAttribute('suggested-amounts')
      ? this.getAttribute('suggested-amounts').split(',').map(Number)
      : [10, 25, 50, 100];

    // Create mount point
    this._mountPoint = document.createElement('div');
    this._mountPoint.style.width = '100%';
    this._mountPoint.style.height = '100%';

    // Create shadow DOM for encapsulation
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(this._mountPoint);

    // Inject minimal styles for shadow DOM
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        width: 100%;
        max-width: 500px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
      .widget-container {
        width: 100%;
      }
    `;
    shadowRoot.appendChild(style);

    // Render React component
    this._root = ReactDOM.createRoot(this._mountPoint);
    this._root.render(
      React.createElement(DonationWidget, {
        organizationId,
        campaignId,
        theme,
        suggestedAmounts,
        customClassName: 'widget-container',
      })
    );
  }

  disconnectedCallback() {
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}

// Register the custom element
if (!customElements.get('cc-donation-widget')) {
  customElements.define('cc-donation-widget', DonationWidgetElement);
}

// Also support loading via function
export function renderDonationWidget(containerId, props) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }

  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(DonationWidget, props));
  return root;
}

// Auto-initialize if there are widgets on the page
document.addEventListener('DOMContentLoaded', () => {
  // Wait for custom elements to be defined
  const widgets = document.querySelectorAll('cc-donation-widget');
  if (widgets.length > 0) {
    // Custom element will handle itself
  }
});

console.log('CommunityConnect Widgets loaded successfully!');
