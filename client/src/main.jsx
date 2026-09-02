import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import App from './App';
import './index.css';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 0.1,
  environment: import.meta.env.MODE || 'development',
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
``` |
| 7.1.3 | Configure Sentry for Backend | Update `server/src/server.js`:
```javascript
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
});

// Add error handling middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
app.use(Sentry.Handlers.errorHandler());
``` |
| 7.1.4 | Set Up Uptime Monitoring | 1. Go to [uptimerobot.com](https://uptimerobot.com) and create a free account<br>2. Add a monitor for your API health endpoint: `https://your-api.com/health`<br>3. Add a monitor for your frontend URL<br>4. Configure alerts (email, SMS, Slack) for downtime |
| 7.1.5 | Set Up Application Performance Monitoring | 1. Sign up for [New Relic](https://newrelic.com) or [Datadog](https://datadog.com) free tier<br>2. Install the APM agent for your backend<br>3. Configure to track response times, database queries, and error rates |
| 7.1.6 | Set Up Logging | Install and configure Winston or Morgan for structured logging:
```javascript
// server/src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

module.exports = logger;
``` |

**Validation Checkpoint:**
- Sentry captures errors and displays them in the dashboard.
- Uptime monitor alerts when services are down.
- Logs are being written to files.

---

## Step 7.2: Create Analytics Dashboard

**Objective:** Track user behavior and platform performance metrics.

**Action Items:**

| # | Task | Detailed Instructions |
|---|------|----------------------|
| 7.2.1 | Set Up Google Analytics | 1. Go to [analytics.google.com](https://analytics.google.com) and create a property<br>2. Get your Measurement ID (G-XXXXXXXXXX)<br>3. Install React GA package: `cd client && npm install react-ga4` |
| 7.2.2 | Configure Google Analytics in React | Create `client/src/utils/analytics.js`:
```javascript
import ReactGA from 'react-ga4';

const initializeAnalytics = () => {
  ReactGA.initialize(import.meta.env.VITE_GA_MEASUREMENT_ID);
};

const trackPageView = (path) => {
  ReactGA.send({ hitType: 'pageview', page: path });
};

const trackEvent = (category, action, label, value) => {
  ReactGA.event({ category, action, label, value });
};

const trackDonation = (amount, campaignId) => {
  ReactGA.event({
    category: 'Donation',
    action: 'Completed',
    label: campaignId || 'General',
    value: amount
  });
};

const trackVolunteerSignup = (skills) => {
  ReactGA.event({
    category: 'Volunteer',
    action: 'Signed Up',
    label: skills.join(', ')
  });
};

export default {
  initializeAnalytics,
  trackPageView,
  trackEvent,
  trackDonation,
  trackVolunteerSignup
};
``` |
| 7.2.3 | Add Page View Tracking | Update `client/src/App.jsx` to track page views on route changes:
```javascript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import analytics from './utils/analytics';

function App() {
  const location = useLocation();
  
  useEffect(() => {
    analytics.trackPageView(location.pathname);
  }, [location]);
  
  // ... rest of App component
}
``` |
| 7.2.4 | Create Custom Dashboard Using Mixpanel | 1. Sign up for [mixpanel.com](https://mixpanel.com) free tier<br>2. Install Mixpanel package: `cd client && npm install mixpanel-browser`<br>3. Track key user events (login, donation, volunteer signup) |

**Validation Checkpoint:**
- Google Analytics shows real-time active users.
- Events are being tracked in the analytics dashboard.

---

## Step 7.3: Establish User Feedback Loop

**Objective:** Continuously collect and act on user feedback.

**Action Items:**

| # | Task | Detailed Instructions |
|---|------|----------------------|
| 7.3.1 | Create Feedback Survey | 1. Sign up for [Typeform](https://typeform.com) or [Google Forms](https://forms.google.com)<br>2. Create a survey with questions about user experience, missing features, and challenges<br>3. Add the survey link to the app: `client/src/components/FeedbackButton.jsx` |
| 7.3.2 | Implement In-App Feedback Widget | Create `client/src/components/FeedbackWidget.jsx`:
```javascript
import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import api from '../services/api';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    try {
      await api.post('/feedback', { 
        rating, 
        feedback, 
        url: window.location.href,
        userAgent: navigator.userAgent 
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl p-6 w-80">
          <button
            onClick={() => setIsOpen(false)}
            className="float-right text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold mb-4">Send Feedback</h3>
          {!submitted ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-2xl ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full border rounded px-3 py-2 mb-4 h-24 resize-none"
              />
              <button
                onClick={handleSubmit}
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit Feedback
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-green-600 font-bold">Thank you!</p>
              <p className="text-gray-500 text-sm">Your feedback helps us improve.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
``` |
| 7.3.3 | Create Post-Onboarding Survey | Send an email survey to NGOs 2 weeks after they start using the platform:<br>1. How easy was the setup process?<br>2. What features are most valuable?<br>3. What's missing?<br>4. Would you recommend this to other NGOs? |
| 7.3.4 | Set Up NPS (Net Promoter Score) | 1. Create a one-question survey: "How likely are you to recommend CommunityConnect to other NGOs?"<br>2. Collect responses from users<br>3. Track NPS score over time |

**Validation Checkpoint:**
- Feedback is being collected and stored in the database.
- Survey responses show user sentiment.

---

## Step 7.4: Continuous Documentation

**Objective:** Keep documentation updated and accessible for users and developers.

**Action Items:**

| # | Task | Detailed Instructions |
|---|------|----------------------|
| 7.4.1 | Create User Documentation | Build a documentation site using [Docusaurus](https://docusaurus.io) or [MkDocs](https://www.mkdocs.org):<br>```
npx create-docusaurus@latest docs classic
cd docs
npm start
``` |
| 7.4.2 | Create API Documentation | 1. Install Swagger/OpenAPI: `cd server && npm install swagger-jsdoc swagger-ui-express`<br>2. Add Swagger comments to your controllers<br>3. Generate and host API documentation<br>4. API documentation should include:<br>- Authentication endpoints<br>- Donor endpoints<br>- Donation endpoints<br>- Volunteer endpoints<br>- Campaign endpoints<br>- Webhook examples |
| 7.4.3 | Create Integration Guide | Write detailed guides for NGOs:<br>1. **Quick Start:** How to get started<br>2. **Widget Integration:** How to embed the donation widget<br>3. **Admin Dashboard:** How to manage donors and volunteers<br>4. **Troubleshooting:** Common issues and solutions |
| 7.4.4 | Create Video Tutorials | 1. Record short (2-3 minute) video tutorials<br>2. Key videos:<br>- NGO onboarding and setup<br>- Adding a donation widget to a WordPress site<br>- Managing donors in the dashboard<br>- Processing a donation<br>- Managing volunteers<br>3. Host on YouTube or Vimeo<br>4. Embed in documentation |
| 7.4.5 | Maintain CHANGELOG.md | Create and maintain a changelog file:
```markdown
# Changelog

## [1.0.0] - 2026-09-02
### Added
- Initial release of CommunityConnect
- Donation widget with Stripe integration
- Volunteer management system
- Admin dashboard with analytics

### Fixed
- Payment webhook timeout issues
- Mobile responsiveness
