# WiseDrive Project - Complete Codebase Inventory

**Project**: Auto Track Car Value (WiseDrive)  
**Type**: Vehicle Maintenance Tracking & Reporting Platform  
**Tech Stack**: Vite + React + TypeScript + Supabase + Stripe  
**Status**: MVP Beta - Fully Functional

---

## TECHNOLOGY STACK

### Frontend Framework & Build
- **Vite** (v5.4.19) - Module bundler with hot reload
- **React** (v18.3.1) - UI library
- **TypeScript** (v5.8.3) - Type safety
- **Tailwind CSS** (v3.4.17) - Utility-first CSS
- **shadcn/ui** - Component library based on Radix UI
- **React Router** (v6.30.1) - Client-side routing

### State Management & Data
- **React Context** - Authentication state
- **React Query/TanStack Query** (v5.83.0) - Server state management
- **React Hook Form** (v7.61.1) - Form handling with Zod validation
- **Zod** (v3.25.76) - Schema validation

### Backend Services
- **Supabase** - PostgreSQL + Authentication + Storage
  - Supabase JS SDK (v2.76.1)
  - Auth: Email/Password, Google OAuth
  - Storage: File attachments for maintenances
  - PostgreSQL database

### Payment & Billing
- **Stripe** - Payment processing
  - Stripe Checkout (hosted)
  - Stripe Billing Portal
  - Webhook integration for subscription events
  - Automatic refunds (7-day guarantee)

### UI & UX Libraries
- **Radix UI** - Headless component primitives (30+ components)
- **Lucide React** - Icon library
- **Recharts** (v2.15.4) - Chart/data visualization
- **Sonner** (v1.7.4) - Toast notifications
- **Next-Themes** (v0.3.0) - Dark mode support
- **Embla Carousel** (v8.6.0) - Carousel component
- **Input OTP** (v1.4.2) - OTP input component
- **React Day Picker** (v8.10.1) - Date picker
- **React Resizable Panels** (v2.1.9) - Resizable panels

### Data & File Handling
- **XLSX** (v0.18.5) - Excel file generation
- **QRCode** (v1.5.4) - QR code generation
- **Date-fns** (v3.6.0) - Date manipulation

### Deployment & Config
- **Vercel** - Deployment platform
- **ESLint** - Code linting
- **Lovable** - Low-code development platform integration

---

## PROJECT STRUCTURE

```
/src
├── /pages                    # Route components
│   ├── Index.tsx            # Landing page
│   ├── Login.tsx            # Auth page
│   ├── Dashboard.tsx        # Main app (protected)
│   ├── Report.tsx           # Public vehicle report
│   └── NotFound.tsx         # 404 page
├── /components              # React components
│   ├── /ui                  # shadcn/ui components (55+)
│   ├── VehicleFormDialog.tsx
│   ├── MaintenanceFormDialog.tsx
│   ├── ProfileEditDialog.tsx
│   ├── UpgradeDialog.tsx
│   ├── MaintenanceAlerts.tsx
│   ├── Onboarding.tsx
│   ├── KmUpdateReminder.tsx
│   ├── TrialBanner.tsx
│   ├── UpgradeCTA.tsx
│   ├── ProfileCompletionReminder.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── AttachmentViewer.tsx
│   ├── ProtectedRoute.tsx
│   ├── BenefitCard.tsx
│   └── StepCard.tsx
├── /contexts                # React Context
│   └── AuthContext.tsx      # Auth state management
├── /hooks                   # Custom React hooks
│   ├── useVehicles.ts
│   ├── useMaintenances.ts
│   ├── useSubscription.ts
│   ├── useMaintenanceAlerts.ts
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── /services                # API services
│   └── fipeApi.ts          # Brazilian vehicle API
├── /integrations
│   └── /supabase
│       ├── client.ts        # Supabase client config
│       └── types.ts         # Auto-generated types
├── /constants               # Static data
│   ├── maintenanceCategories.ts
│   ├── maintenanceRecommendations.ts
│   └── brazilLocations.ts
├── /lib                     # Utilities
│   └── utils.ts
├── App.tsx                  # Main app routing
├── main.tsx                 # React entry point
└── registerSW.ts            # PWA service worker

/supabase
├── /functions               # Edge functions
│   ├── /create-checkout
│   ├── /stripe-webhook
│   ├── /create-portal-session
│   └── /check-subscription
├── /migrations              # Database migrations
└── config.toml             # Supabase config

/public                      # Static assets
```

---

## ROUTES & PAGES

| Route | Component | Access | Purpose |
|-------|-----------|--------|---------|
| `/` | Index.tsx | Public | Landing page with features, pricing, hero |
| `/login` | Login.tsx | Public | Email/Password/Google sign-in/sign-up |
| `/dashboard` | Dashboard.tsx | Protected | Main app - vehicles, maintenance, reports |
| `/report/:vehicleId` | Report.tsx | Public | Shareable vehicle maintenance history |
| `/report` | Report.tsx | Public | Default report (first vehicle) |
| `/*` | NotFound.tsx | Public | 404 error page |

---

## CORE FEATURES INVENTORY

### 1. AUTHENTICATION & USER MANAGEMENT

**Status**: Fully Implemented

#### Authentication Methods
- Email/Password sign-up and login
- Google OAuth integration
- Session persistence with auto-refresh
- Email verification with redirect URLs
- Logout functionality

#### User Profile Management
- Profile creation on signup
- Profile editing dialog
- Profile data fields:
  - Basic: full_name, email, phone, date_of_birth, gender
  - Location: state, municipality
  - Usage: average_monthly_km, vehicles_count, vehicle_usage_type, residence_type
  - Preferences: preferred_contact, mechanical_knowledge, maintenance_frequency
  - Socioeconomic: income_range, profession
  - Billing: subscription_plan, subscription_status, trial_end, subscription_end

#### Authorization
- Protected routes with ProtectedRoute wrapper
- Admin user support with full feature access
- Subscription-based feature restrictions

---

### 2. VEHICLE MANAGEMENT

**Status**: Fully Implemented

#### Vehicle Operations
- **Create**: Add vehicle with FIPE API integration
- **Read**: List all user vehicles with status
- **Update**: Edit vehicle KM, plate, basic info
- **Delete**: Remove vehicle (cascades to maintenances)

#### Vehicle Data
- Brand, model, version, year
- License plate
- Initial KM (purchase KM)
- Current KM (auto-updates from maintenances)
- Status tracking: up-to-date, due-soon, overdue

#### FIPE API Integration
- Real-time Brazilian vehicle database lookup
- Brand selection with caching
- Model lookup by brand
- Year/version selection
- Automatic brand sorting (popular brands first)

#### Features
- KM update reminders
- Vehicle status badges
- Cost summary per vehicle
- Maintenance count per vehicle
- Bulk vehicle operations

---

### 3. MAINTENANCE TRACKING

**Status**: Fully Implemented

#### Maintenance CRUD
- **Create**: Register maintenance with form validation
- **Read**: View all maintenances with filters
- **Update**: Edit existing maintenance records
- **Delete**: Remove maintenance records

#### Maintenance Data
- Date of service
- Service type (from 100+ categories)
- Kilometer reading
- Cost (R$ currency)
- Notes/observations
- Attachment (receipt, invoice, photo)

#### Maintenance Categories (8 Main + Subcategories)
1. **Motor** (16 items): Oil change, filters, spark plugs, timing belt, etc.
2. **Suspension** (12 items): Shocks, springs, bushings, tie rods, etc.
3. **Brakes** (11 items): Pads, discs, fluid, ABS, etc.
4. **Transmission** (8 items): Oil, clutch, cables, etc.
5. **Electrical** (4 items): Battery, alternator, lights, etc.
6. **Air Conditioning** (4 items): Cabin filter, gas charge, compressor, etc.
7. **Tires & Wheels** (5 items): Pressure, rotation, balance, alignment, etc.
8. **Exhaust & Body** (7 items): Muffler, rust prevention, waxing, etc.

#### Attachment Support
- File upload to Supabase storage
- Signed URLs with 24-hour expiration
- Multiple file types (PDF, images, etc.)
- Attachment viewer component
- Storage location: `user-id/timestamp.extension`

#### Advanced Features
- Auto-update vehicle KM if maintenance KM is higher
- Service type auto-complete
- Cost formatting with thousands separator
- Maintenance history timeline
- Bulk import from Excel (base file provided)

---

### 4. MAINTENANCE ALERTS & RECOMMENDATIONS

**Status**: Fully Implemented

#### Alert System
- 40+ maintenance recommendations with intervals
- KM-based alerts: alerts when within 500 KM of due date
- Time-based alerts: alerts 15 days before due date
- Overdue detection

#### Alert Types
- **Overdue**: Service exceeded recommended interval
- **Due-Soon**: Service approaching due date
- **OK**: Service up-to-date

#### Recommendations Include
- Item name and description
- KM interval (e.g., 10,000 km)
- Time interval (e.g., 6 months)
- Type: Preventiva or Corretiva
- Auto-link to maintenance form with pre-fill

#### Alert Features
- Priority sorting (overdue first)
- Modal for quick maintenance registration
- Count badge on alerts tab
- Per-vehicle alert generation

---

### 5. REPORTS & ANALYTICS

**Status**: Fully Implemented (Pro Feature)

#### Report Views
- **Summary Cards**: Count, total cost, average cost
- **Timeline View**: Chronological maintenance history
- **Charts** (Pro only):
  - Monthly cost trend (line chart)
  - Cost by category (pie chart)
  - Category comparison (bar chart)

#### Filtering
- By vehicle (dropdown)
- By year (dropdown with available years)
- By month (1-12)
- Real-time chart updates based on filters

#### Data Export
- **Excel Export**: Maintenance records with vehicle info, dates, costs
- **QR Code**: Generated for report URL sharing
- **Link Sharing**: Copy shareable link to clipboard

#### Report Customization
- Dynamic date ranges
- Selectable vehicles
- Color-coded charts
- Responsive design

---

### 6. PUBLIC SHARING & REPORTS

**Status**: Fully Implemented (Pro Feature)

#### Public Report Page
- Accessible without authentication
- Vehicle information header with status badge
- Summary statistics (maintenance count, total cost, average)
- Timeline view of all services
- Cost evolution chart
- QR code placeholder
- Professional styling

#### Sharing Methods
- **QR Code**: Generated on-demand, downloadable
- **Direct Link**: `/report/:vehicleId` format
- **Link Copy**: One-click copy to clipboard

#### Security
- Public read-only access to specific vehicles
- No authentication required
- Database policies control visibility

---

### 7. SUBSCRIPTION & MONETIZATION

**Status**: Fully Implemented

#### Subscription Plans

| Feature | Free Trial | Pro Monthly | Pro Yearly |
|---------|-----------|-------------|-----------|
| Duration | 90 days | Recurring | Recurring |
| Price | R$ 0 | R$ 19.90/mth | R$ 199/year |
| Vehicles | 1 | 3 | 3 |
| Maintenances/Month | 3 | Unlimited | Unlimited |
| Reports | Basic | Advanced + Charts | Advanced + Charts |
| Sharing (QR/Link) | No | Yes | Yes |
| Excel Export | No | Yes | Yes |
| Alerts | Yes | Yes | Yes |

#### Stripe Integration
- Stripe Checkout (hosted payment form)
- Stripe Billing Portal (manage subscriptions)
- Webhook processing for subscription events

#### Subscription Events Handled
- `checkout.session.completed`: Create/upgrade subscription
- `customer.subscription.updated`: Plan changes, renewal
- `customer.subscription.deleted`: Cancellation with 7-day refund
- `invoice.payment_failed`: Mark subscription as past_due

#### Subscription Status Tracking
- Plans: free_trial, pro_monthly, pro_yearly
- Status: active, expired, cancelled, past_due
- Trial end date
- Subscription end date
- Days remaining calculation

#### Feature Gates
- `canAddVehicle`: Unlimited for Pro, 1 for Trial
- `canAddMaintenance`: Unlimited for Pro, 3/month for Trial
- `canShareLink`: Pro only
- `canExportExcel`: Pro only

#### Admin Access
- Admin users get all features unlocked
- `is_admin` flag in profiles table

---

### 8. ONBOARDING & USER EDUCATION

**Status**: Fully Implemented

#### Onboarding Flow
- 4-step introduction wizard
- Shows on first visit (tracked in localStorage)
- Can be skipped at any time
- Test mode with URL parameter

#### Steps
1. Manage vehicles
2. Register maintenances
3. Smart alerts
4. Detailed reports

#### Onboarding Features
- Progress dots
- Rich icons for each step
- Next/Skip buttons
- Completion tracking

---

### 9. REMINDERS & NOTIFICATIONS

**Status**: Fully Implemented

#### In-App Reminders
- **KM Update Reminder**: Prompt to update vehicle KM
- **Profile Completion Reminder**: Encourage profile completion
- **Trial Banner**: Show days remaining in trial
- **Upgrade CTAs**: Multiple upgrade prompts at strategic points

#### Notifications
- Toast notifications for all actions
- Success/error messages
- Action confirmations
- Status updates

---

### 10. UI/UX COMPONENTS

**Status**: Comprehensive Implementation

#### Custom Components (16)
1. **VehicleFormDialog**: FIPE-integrated vehicle creation/editing
2. **MaintenanceFormDialog**: Maintenance registration with attachments
3. **ProfileEditDialog**: User profile management
4. **UpgradeDialog**: Pricing and plan comparison
5. **MaintenanceAlerts**: Alert list with action buttons
6. **Onboarding**: Multi-step intro wizard
7. **KmUpdateReminder**: KM update prompt
8. **TrialBanner**: Trial countdown display
9. **UpgradeCTA**: Contextual upgrade calls-to-action
10. **ProfileCompletionReminder**: Profile completion nudge
11. **AttachmentViewer**: Attachment preview
12. **ProtectedRoute**: Route authentication wrapper
13. **Header**: Navigation header with user menu
14. **Footer**: App footer with links
15. **BenefitCard**: Landing page benefit showcase
16. **StepCard**: How-it-works step display

#### shadcn/ui Components (55+)
- Accordion, Alert, Alert Dialog
- Avatar, Badge
- Button, Calendar, Card, Carousel
- Checkbox, Command, Context Menu
- Dialog, Drawer, Dropdown Menu
- Form, Hover Card, Input
- Label, MenuBar, Navigation Menu
- Pagination, Popover, Progress
- Radio Group, Resizable, Scroll Area
- Select, Separator, Sheet, Sidebar
- Skeleton, Slider, Switch
- Table, Tabs, Textarea
- Toast, Toggle, Toggle Group, Tooltip

---

## DATABASE SCHEMA

### Tables

#### profiles
```sql
id (UUID, PK)
email (text)
full_name (text)
phone (text)
avatar_url (text)
date_of_birth (date)
gender (text)
state (text)
municipality (text)
average_monthly_km (int)
vehicles_count (int)
vehicle_usage_type (text)
residence_type (text)
preferred_contact (text)
mechanical_knowledge (text)
maintenance_frequency (text)
income_range (text)
profession (text)

-- Subscription
subscription_plan (enum: free_trial, pro_monthly, pro_yearly)
subscription_status (enum: active, expired, cancelled, past_due)
subscription_started_at (timestamp)
subscription_ends_at (timestamp)
trial_end (timestamp)

-- Stripe
stripe_customer_id (text)
stripe_subscription_id (text)

-- Admin
is_admin (boolean)

-- CTA Tracking
cta_dismiss_count (int)
last_cta_shown_at (timestamp)

created_at (timestamp)
```

#### vehicles
```sql
id (UUID, PK)
user_id (UUID, FK -> profiles)
brand (text)
model (text)
version (text, nullable)
year (integer)
plate (text)
initial_km (integer) -- KM at purchase
current_km (integer) -- Updated when maintenance added
status (enum: up-to-date, due-soon, overdue)
created_at (timestamp)
updated_at (timestamp)
```

#### maintenances
```sql
id (UUID, PK)
vehicle_id (UUID, FK -> vehicles)
user_id (UUID, FK -> profiles)
date (date)
service_type (text) -- Format: "Category - Subcategory"
km (integer)
cost (numeric)
notes (text, nullable)
attachment_url (text, nullable) -- Storage path
created_at (timestamp)
updated_at (timestamp)
```

#### storage.objects (maintenance-attachments bucket)
```
id (UUID)
name (text) -- Format: "user-id/timestamp.ext"
bucket_id (text) = 'maintenance-attachments'
owner (UUID)
metadata (jsonb)
created_at (timestamp)
updated_at (timestamp)
```

### Relationships
- profiles: 1 → many vehicles
- profiles: 1 → many maintenances
- vehicles: 1 → many maintenances
- vehicles: 1 → many attachments (via maintenances)

### Row Level Security (RLS)
- Users can see only their own vehicles
- Users can see only their own maintenances
- Users can only upload/delete their own attachments
- Public read access to vehicles for report sharing

---

## SERVER-SIDE FUNCTIONS (Supabase Edge Functions)

### 1. create-checkout
**Purpose**: Create Stripe checkout session  
**Type**: HTTP POST  
**Auth**: Required (Bearer token)  
**Request**:
```json
{
  "priceId": "price_1STNQDDxgvgb9mV6gZUMk2hx"
}
```

**Response**:
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

**Logic**:
- Authenticate user via bearer token
- Check if Stripe customer exists for email
- Create new customer if needed
- Create Stripe checkout session
- Return hosted checkout URL

**Error Handling**: Comprehensive logging and error responses

---

### 2. stripe-webhook
**Purpose**: Process Stripe webhook events  
**Type**: HTTP POST  
**Auth**: Webhook signature verification  
**Events Handled**:

#### checkout.session.completed
- Retrieve subscription details
- Find user by email
- Create/update profile with subscription info
- Calculate plan from price ID
- End trial when subscription starts

#### customer.subscription.updated
- Update subscription plan
- Update subscription end date
- Handle plan changes (monthly ↔ yearly)

#### customer.subscription.deleted
- Check 7-day refund eligibility
- Issue automatic refund if applicable
- Cancel subscription in profile

#### invoice.payment_failed
- Mark subscription as past_due
- Allow user to retry payment

**Logging**: Detailed step-by-step logging for debugging

---

### 3. create-portal-session
**Purpose**: Create Stripe Billing Portal session  
**Type**: HTTP POST  
**Auth**: Required (Bearer token)  
**Request**:
```json
{
  "returnUrl": "https://wisedrive.com.br/dashboard"
}
```

**Response**:
```json
{
  "url": "https://billing.stripe.com/..."
}
```

**Logic**:
- Authenticate user
- Find Stripe customer by email
- Create portal session with return URL
- Return portal URL for redirect

---

### 4. check-subscription
**Purpose**: Verify subscription status  
**Type**: HTTP GET  
**Auth**: Required  
**Response**: Subscription data (status, plan, days remaining)

---

## CONSTANTS & STATIC DATA

### Maintenance Categories (maintenanceCategories.ts)
8 categories with 30+ subcategories organized as:
- Category (value, label)
  - Subcategory (value, label)

### Maintenance Recommendations (maintenanceRecommendations.ts)
40+ recommendations with:
- Category
- Item name
- Description
- KM interval (nullable)
- Time interval in months (nullable)
- Type: Preventiva or Corretiva

Example:
```
{
  category: "Motor",
  item: "Troca de óleo",
  description: "...",
  kmInterval: 10000,
  timeInterval: 6,
  type: "Preventiva"
}
```

### Brazil Locations (brazilLocations.ts)
- All Brazilian states
- Municipalities per state
- Used for user profile geographic data

---

## ENVIRONMENT CONFIGURATION

### Required Environment Variables
```env
# Supabase
VITE_SUPABASE_PROJECT_ID=sqnoxtuzoccjstlzekhc
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_URL=https://sqnoxtuzoccjstlzekhc.supabase.co

# App URL (for Supabase redirects)
VITE_APP_URL=https://www.wisedrive.com.br

# Stripe (backend only)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY_ID=price_1STNQDDxgvgb9mV6gZUMk2hx
STRIPE_PRICE_YEARLY_ID=price_1STNQwDxgvgb9mV62Kd2HT6D

# Supabase Service Role (for edge functions)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## CONFIGURATION FILES

### vite.config.ts
- Vite build configuration
- React SWC plugin
- Path aliases (@/ → src/)
- Lovable component tagger (dev only)
- Dev server on port 8080

### tailwind.config.ts
- Custom color scheme (primary, success, warning, danger, etc.)
- Responsive container
- Font family: Inter
- Extended themes for dark mode
- Shadow utilities (glow, glow-primary)
- Animation utilities

### tsconfig.json
- Module: ES modules
- Target: ES2020
- Strict mode enabled
- JSX: react-jsx
- Path alias for @/

### ESLint Configuration
- Recommended rules from @eslint/js
- TypeScript ESLint support
- React hooks rules
- React refresh rules

---

## DEPLOYMENT CONFIGURATION

### Vercel
- `vercel.json`: Deployment config
- Next.js like handling for Vite
- Environment variables configured
- Edge functions support

### PWA (Progressive Web App)
- Service worker registration
- `registerSW.ts`: PWA initialization
- Manifest file: `index.html`
- Offline support potential

---

## FEATURE IMPLEMENTATION STATUS

### Fully Implemented
✓ User authentication (Email/Password, Google OAuth)  
✓ User profile management  
✓ Vehicle CRUD with FIPE integration  
✓ Maintenance CRUD with attachments  
✓ Maintenance alerts and recommendations  
✓ Reports and analytics  
✓ Public report sharing  
✓ QR code generation  
✓ Excel export  
✓ Stripe payment integration  
✓ Subscription management  
✓ Trial system (90 days)  
✓ Onboarding tutorial  
✓ Reminders and CTAs  
✓ Responsive design  
✓ Toast notifications  
✓ Dark mode support  
✓ Protected routes  
✓ Error handling and logging  

### Partially Implemented
◐ Email notifications (structure exists, not wired)  
◐ Advanced analytics (charts Pro-only)  
◐ Mobile optimization (responsive but not mobile-first)  

### Not Implemented / Future
✗ Push notifications  
✗ SMS alerts  
✗ Social sharing  
✗ API for third-party integrations  
✗ PDF report generation  
✗ Vehicle valuation tracking (FIPE integration)  
✗ Insurance integration  
✗ Maintenance history export (PDF)  
✗ Multi-language support  
✗ User roles beyond admin  
✗ Team/family account sharing  
✗ Appointment scheduling  

---

## STYLING & DESIGN SYSTEM

### Color Palette
- **Primary**: Green (#27ae60) - Main action color
- **Success**: Green - Success states
- **Warning**: Orange/Yellow - Warnings
- **Danger**: Red - Destructive actions
- **Secondary**: Gray - Secondary actions
- **Muted**: Gray - Disabled/secondary text
- **Surface**: Light gray - Card backgrounds
- **Accent**: Teal - Accents

### Typography
- Font: Inter (system fallback)
- Responsive sizing
- Font weight: 400-700

### Spacing System
- Based on Tailwind defaults (4px unit)
- Consistent padding/margins
- Container max-width: 1400px

### Animations
- Fade-in effects
- Scale transitions
- Smooth color transitions
- Loading spinners
- Hover effects

---

## CODE QUALITY & STANDARDS

### TypeScript
- Strict mode enabled
- Type definitions for all interfaces
- Generated types from Supabase schema
- Custom hook return types

### Naming Conventions
- Components: PascalCase
- Files: PascalCase (components), lowercase (utils)
- Variables: camelCase
- Constants: UPPER_CASE
- Database columns: snake_case

### Code Organization
- Separation of concerns
- Custom hooks for logic
- Components for UI
- Services for external APIs
- Contexts for global state

### Error Handling
- Try-catch blocks
- Toast notifications for errors
- Console logging for debugging
- Graceful fallbacks

---

## TESTING & DEBUGGING

### Available Debug Features
- URL parameter: `?test-onboarding=true` - Force show onboarding
- Local storage: `onboarding-completed-${userId}` - Onboarding state
- Console logging in all async operations
- Subscription state logging in Dashboard

### No Automated Tests
- No unit tests found
- No integration tests
- No E2E tests
- Manual testing only

---

## NOTES & OBSERVATIONS

### Project Characteristics
1. **MVP Status**: Described as MVP in beta phase
2. **Lovable Platform**: Built with Lovable low-code platform
3. **Brazilian Market**: Focused on Brazilian users (Portuguese UI, FIPE API, Brazilian locations)
4. **Freemium Model**: Trial + paid subscription model
5. **Production Ready**: Currently live on production with real users

### Architecture Decisions
1. **Supabase Choice**: PostgreSQL for reliability, Auth for user management
2. **Stripe Integration**: Handled via edge functions for secure payment processing
3. **FIPE API**: Real-time Brazilian vehicle data
4. **React Context**: Minimal, Auth-only context usage
5. **React Query**: Not heavily used, mostly Supabase hooks

### Recent Changes (from git history)
- Fix JSX syntax error (Nov 19)
- Add debug logging for subscription state (Nov 18)
- Fix Pro subscription visibility
- Complete diagnostic script for issues
- Fix webhook 401 error

### Known Issues/TODOs
- None visible in code (all marked items completed)
- Some incomplete features marked as future work

---

## DIRECTORY TREE

```
/auto-track-car-value
├── /src
│   ├── /components (16 custom + 55+ shadcn)
│   ├── /pages (5 pages)
│   ├── /hooks (6 custom hooks)
│   ├── /contexts (1 auth context)
│   ├── /services (1 FIPE API service)
│   ├── /integrations/supabase
│   ├── /constants (3 data files)
│   ├── /lib (utils)
│   ├── App.tsx (main routing)
│   └── main.tsx
├── /supabase
│   ├── /functions (4 edge functions)
│   ├── /migrations (13+ migration files)
│   └── config.toml
├── /public (static assets)
├── package.json
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
├── vercel.json
└── index.html
```

---

## SUMMARY STATISTICS

- **Total TypeScript Files**: 88
- **Custom Components**: 16
- **UI Components**: 55+
- **Database Tables**: 3
- **API Functions**: 4
- **Maintenance Categories**: 8
- **Maintenance Subcategories**: 30+
- **Maintenance Recommendations**: 40+
- **Routes**: 6
- **Pages**: 5
- **Custom Hooks**: 6
- **Lines of Code**: ~50,000+

---

## CONCLUSION

WiseDrive is a comprehensive, feature-complete vehicle maintenance tracking and reporting platform. It successfully combines:
- Modern frontend stack (React, TypeScript, Tailwind)
- Robust backend (Supabase PostgreSQL)
- Sophisticated payment integration (Stripe)
- Rich feature set (alerts, analytics, sharing, exporting)
- Professional UX (dialogs, forms, responsive design)
- Business model (freemium subscription)

The codebase is well-organized, follows naming conventions, and implements proper error handling and validation. It's currently in production serving Brazilian users and is actively maintained.

