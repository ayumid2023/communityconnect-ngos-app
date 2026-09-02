// server/src/models/Donation.js
const DonationSchema = new mongoose.Schema({
  // ... existing fields
  isRecurring: { type: Boolean, default: false },
  recurringInterval: { type: String, enum: ['monthly', 'yearly', 'quarterly'] },
  nextDonationDate: { type: Date },
  stripeSubscriptionId: { type: String }
});
``` |
| 8.1.2 | Update Stripe Integration | Modify payment controller to handle subscriptions:
```javascript
exports.createSubscriptionIntent = async (req, res) => {
  const { amount, currency, interval, campaignId, donorEmail } = req.body;
  
  const customer = await stripe.customers.create({ email: donorEmail });
  
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{
      price_data: {
        currency: currency || 'usd',
        product_data: { name: 'Donation' },
        unit_amount: Math.round(amount * 100),
        recurring: { interval: interval || 'month' }
      }
    }],
    metadata: { campaignId }
  });
  
  res.json({ clientSecret: subscription.latest_invoice.payment_intent.client_secret });
};
``` |
| 8.1.3 | Update Frontend Widget | Add recurring option to donation widget:
```jsx
<div className="mb-4">
  <label className="flex items-center">
    <input
      type="checkbox"
      checked={isRecurring}
      onChange={(e) => setIsRecurring(e.target.checked)}
      className="mr-2"
    />
    Make this a monthly recurring donation
  </label>
  {isRecurring && (
    <select className="w-full px-4 py-2 border rounded mt-2">
      <option value="monthly">Monthly</option>
      <option value="quarterly">Quarterly</option>
      <option value="yearly">Yearly</option>
    </select>
  )}
</div>
``` |

**Validation Checkpoint:**
- Users can select a recurring donation option.
- Stripe subscription is created and processed.

---

### Step 8.2: Impact Dashboard

**Objective:** Show donors and NGOs the real-world impact of their contributions.

**Action Items:**

| # | Task | Detailed Instructions |
|---|------|----------------------|
| 8.2.1 | Create Impact Model | Create `server/src/models/Impact.js`:
```javascript
const mongoose = require('mongoose');

const ImpactSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectName: { type: String, required: true },
  description: { type: String },
  metrics: {
    peopleHelped: { type: Number, default: 0 },
    volunteersEngaged: { type: Number, default: 0 },
    fundsRaised: { type: Number, default: 0 }
  },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  images: [String],
  videoUrl: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Impact', ImpactSchema);
``` |
| 8.2.2 | Create Impact Endpoint | Create API endpoints for creating and fetching impact stories. |
| 8.2.3 | Build Impact Dashboard Frontend | Create `client/src/pages/ImpactDashboard.jsx` with:
- Map view showing project locations
- Project cards with images and metrics
- Donor-specific impact: "You helped fund this project"
- Progress toward goals |
| 8.2.4 | Create Impact Widget | Create embeddable impact widget for NGO websites:
```html
<cc-impact-widget organization-id="ngo-12345"></cc-impact-widget>
``` |

**Validation Checkpoint:**
- Impact stories are displayed in the dashboard.
- Donors can see how their contributions are being used.

---

### Step 8.3: Email Automation

**Objective:** Automate donor communications to improve retention and engagement.

**Action Items:**

| # | Task | Detailed Instructions |
|---|------|----------------------|
| 8.3.1 | Install Email Service | `cd server && npm install nodemailer`<br>Configure with SMTP credentials. |
| 8.3.2 | Create Email Service Module | `server/src/services/email.service.js`:
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendDonationReceipt = async (donation, donor) => {
  // Generate PDF receipt
  // Send email with receipt attachment
};

const sendThankYouEmail = async (donor, donation) => {
  // Send personalized thank you
};

module.exports = { sendDonationReceipt, sendThankYouEmail };
``` |
| 8.3.3 | Create Email Templates | Create HTML email templates for:<br>1. Donation receipt<br>2. Donation thank you<br>3. Volunteer welcome<br>4. Impact update<br>5. Recurring donation confirmation |
| 8.3.4 | Set Up Automated Triggers | Add triggers for email sending in donation controller:
```javascript
// After successful donation
if (donation.status === 'completed') {
  sendThankYouEmail(donor, donation);
  sendDonationReceipt(donation, donor);
}
``` |

**Validation Checkpoint:**
- Emails are sent after successful donations.
- Email templates render correctly.

---

### Step 8.4: Advanced Reporting

**Objective:** Provide customizable reports for NGOs and donors.

**Action Items:**

| # | Task | Detailed Instructions |
|---|------|----------------------|
| 8.4.1 | Create Report Generator | Build a report generation service using libraries like `pdfkit` or `exceljs`. |
| 8.4.2 | Build Report Builder UI | Create a report builder interface in the admin dashboard with:<br>- Filter options (date range, donor, campaign)<br>- Chart selection (bar, pie, line)<br>- Export formats (PDF, Excel, CSV)<br>- Schedule reports |
| 8.4.3 | Create Pre-built Report Templates | 1. **Donation Summary:** Total donations, average donation, top donors<br>2. **Donor Retention:** Donor churn rate, retention rate<br>3. **Volunteer Engagement:** Volunteer hours, top volunteers<br>4. **Campaign Performance:** Campaign progress, ROI |
| 8.4.4 | Set Up Automated Reporting | Enable scheduled reports:<br>1. Monthly donor reports emailed to NGO admin<br>2. Board reports generated quarterly<br>3. Grant reports for funders |

**Validation Checkpoint:**
- Reports can be generated and exported.
- Scheduled reports are sent to users.

---

## Phase 9: Scaling and Optimization (Months 13-18)

### Step 9.1: Database Optimization

**Objective:** Optimize database performance for growing user base.

**Action Items:**

| # | Task | Detailed Instructions |
|---|------|----------------------|
| 9.1.1 | Add Database Indexes | Create indexes on frequently queried fields:
```javascript
// In each model file
UserSchema.index({ email: 1, orgId: 1 });
DonationSchema.index({ orgId: 1, status: 1, createdAt: -1 });
DonationSchema.index({ campaignId: 1 });
VolunteerSchema.index({ orgId: 1, status: 1 });
``` |
| 9.1.2 | Implement Query Optimization | Review slow queries and optimize:
1. Use `select` to limit returned fields
2. Use `lean()` for read-only queries
3. Implement pagination for large datasets |
| 9.1.3 | Set Up Database Monitoring | Enable MongoDB Atlas performance monitoring<br>Track connection count, query execution times, and memory usage. |

**Validation Checkpoint:**
- Query performance improves with indexes.
- Database monitoring shows stable performance.

---

### Step 9.2: Caching Implementation

**Objective:** Reduce load and improve response times with caching.

**Action Items:**

| # | Task | Detailed Instructions |
|---|------|----------------------|
| 9.2.1 | Set Up Redis Cache | 1. Create a Redis instance (Redis Cloud free tier or self-hosted)<br>2. Install Redis client: `cd server && npm install ioredis` |
| 9.2.2 | Implement Cache Middleware | Create `server/src/middleware/cache.js`:
```javascript
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cachedData = await redis.get(key);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }
    res.sendResponse = res.json;
    res.json = (data) => {
      redis.setex(key, duration, JSON.stringify(data));
      res.sendResponse(data);
    };
    next();
  };
};
``` |
| 9.2.3 | Apply Caching to Endpoints | Apply caching to read endpoints:
```javascript
router.get('/donors', auth, cacheMiddleware(600), donorController.getAllDonors);
router.get('/campaigns', auth, cacheMiddleware(300), campaignController.getAllCampaigns);
``` |
| 9.2.4 | Implement Cache Invalidation | Invalidate cache when data changes:
```javascript
// In POST/PUT/DELETE controllers
const invalidateCache = async (pattern) => {
  const keys = await redis.keys(pattern);
  if (keys.length) {
    await redis.del(...keys);
  }
};
``` |

**Validation Checkpoint:**
- Redis caches API responses.
- Cache invalidation works on data updates.

---

### Step 9.3: CDN Setup for Assets

**Objective:** Serve static assets globally with low latency.

**Action Items:**

| # | Task | Detailed Instructions |
|---|------|----------------------|
| 9.3.1 | Set Up CloudFront or CloudFlare | 1. Sign up for CloudFlare (free tier)<br>2. Add your domain to CloudFlare<br>3. Update DNS nameservers |
| 9.3.2 | Configure CDN Caching | Set cache headers for static assets:<br>- Images: Cache-Control: max-age=31536000<br>- CSS/JS: Cache-Control: max-age=31536000<br>- HTML: Cache-Control: no-cache |
| 9.3.3 | Optimize Images | Implement image optimization:<br>1. Upload images to a CDN like Cloudinary<br>2. Generate responsive image sizes<br>3. Lazy load images on the frontend |
| 9.3.4 | Configure Gzip/Brotli Compression | Enable compression in your web server (Nginx/Apache) or CDN setting. |

**Validation Checkpoint:**
- Assets are served via CDN.
- Page load times improve significantly.

---

## Phase 10: Community and Ecosystem Building (Ongoing)

### Step 10.1: Build Developer Community

**Objective:** Create an ecosystem of developers contributing to and building on the platform.

**Action Items:**

| # | Task | Detailed Instructions |
|---|------|----------------------|
| 10.1.1 | Open Source the Codebase | 1. Review code for security issues<br>2. Add comprehensive documentation<br>3. Publish the repository as public<br>4. Add CONTRIBUTING.md, CODE_OF_CONDUCT.md |
| 10.1.2 | Create Contribution Guide | Write a guide covering:<br>1. How to set up the development environment<br>2. Coding standards and style guide<br>3. How to submit pull requests<br>4. Issue tracking and project board |
| 10.1.3 | Build API Marketplace | Create a marketplace for third-party integrations:<br>1. Accounting software (QuickBooks, Xero)<br>2. Email marketing (Mailchimp)<br>3. SMS notifications (Twilio)<br>4. Social media integrations |
| 10.1.4 | Host Community Events | 1. Monthly virtual office hours<br>2. Quarterly hackathons<br>3. Annual NGO tech summit |
| 10.1.5 | Create Partner Program | 1. NGO ambassadors<br>2. Tech partner program<br>3. Corporate sponsorship program |

**Validation Checkpoint:**
- External contributors are submitting pull requests.
- The developer community is growing.

---

## Phase 11: White-Label and Enterprise Features (Ongoing)

### Step 11.1: Multi-Tenant White-Label Support

**Objective:** Allow NGOs to fully brand the platform as their own.

**Action Items:**

| # | Task | Detailed Instructions |
|---|------|----------------------|
| 11.1.1 | Add Custom Domain Support | 1. DNS verification for custom domains<br>2. SSL certificate generation (Let's Encrypt)<br>3. Route requests to the correct NGO tenant |
| 11.1.2 | Add Theme Customization | NGO administrators can customize:<br>1. Primary and secondary colors<br>2. Logo and favicon<br>3. Font selection<br>4. Custom CSS |
| 11.1.3 | Add Branding Removal | Remove all CommunityConnect branding for enterprise customers |
| 11.1.4 | Add Custom CSS/JS Injection | Allow NGOs to add custom CSS and JS for advanced customization |

**Validation Checkpoint:**
- NGOs can use their own domain.
- White-label configuration works.

---

### Step 11.2: API Public and Rate Limiting

**Objective:** Publish a public API with appropriate usage controls.

**Action Items:**

| # | Task | Detailed Instructions |
|---|------|----------------------|
| 11.2.1 | Publish Public API | Create a public-facing API with documentation:<br>1. Donation endpoint<br>2. Campaign endpoint<br>3. Impact endpoint<br>4. Authentication |
| 11.2.2 | Implement Rate Limiting | Add rate limiting middleware:
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api/public', limiter);
``` |
| 11.2.3 | Create API Access Portal | 1. API key generation<br>2. Usage dashboard<br>3. Billing integration |

**Validation Checkpoint:**
- Public API is accessible and documented.
- Rate limiting protects the API from abuse.

---

## Summary: Complete Development Lifecycle

| Phase | Description | Duration | Key Deliverables |
|-------|-------------|----------|------------------|
| **Phase 0** | Foundation | Weeks 1-2 | Repository, environment, project structure |
| **Phase 1** | GitHub App | Weeks 2-3 | GitHub App registered and installed |
| **Phase 2** | Backend API | Weeks 3-7 | REST API, authentication, models |
| **Phase 3** | Frontend | Weeks 8-14 | React dashboard, widgets |
| **Phase 4** | CI/CD | Weeks 15-16 | GitHub Actions, deployment |
| **Phase 5** | Testing | Weeks 17-18 | Unit tests, integration tests |
| **Phase 6** | Deployment | Weeks 19-20 | Production deployment, launch |
| **Phase 7** | Monitoring & Maintenance | Weeks 21-24 | Error tracking, analytics, feedback |
| **Phase 8** | Feature Roadmap | Months 7-12 | Recurring donations, impact dashboard, email automation |
| **Phase 9** | Scaling | Months 13-18 | Database optimization, caching, CDN |
| **Phase 10** | Community | Ongoing | Open source, developer community |
| **Phase 11** | Enterprise | Ongoing | White-label, public API |

---

## Final Checklist: Production Readiness

| # | Checklist Item | Status |
|---|----------------|--------|
| 1 | All environment variables configured in production | ☐ |
| 2 | Sentry error tracking configured | ☐ |
| 3 | Uptime monitoring configured | ☐ |
| 4 | Google Analytics configured | ☐ |
| 5 | SSL certificates installed | ☐ |
| 6 | Database backups configured | ☐ |
| 7 | Rate limiting configured | ☐ |
| 8 | Security headers configured (Helmet) | ☐ |
| 9 | User documentation complete | ☐ |
| 10 | API documentation complete | ☐ |
| 11 | Load tested for expected traffic | ☐ |
| 12 | Disaster recovery plan documented | ☐ |

---

**This completes the comprehensive step-by-step guide for developing, deploying, and maintaining CommunityConnect using GitHub's ecosystem. Your NGO management platform is now ready for production use!**

Would you like me to elaborate on any specific phase or provide additional details for a particular component?
