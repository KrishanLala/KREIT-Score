import { sql } from "drizzle-orm";
import { pgTable, serial, text, varchar, integer, timestamp, decimal, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  kreitId: varchar("kreit_id", { length: 20 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  subscriptionTier: varchar("subscription_tier", { length: 50 }).default("free"),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  tier: varchar("tier", { length: 50 }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  billingCycleStart: timestamp("billing_cycle_start"),
  billingCycleEnd: timestamp("billing_cycle_end"),
  status: varchar("status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Searches table
export const searches = pgTable("searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  address: varchar("address", { length: 500 }).notNull(),
  kreitScore: integer("kreit_score"),
  aiResponse: jsonb("ai_response"),
  searchedAt: timestamp("searched_at").defaultNow(),
});

// Revenue table
export const revenue = pgTable("revenue", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  stripeChargeId: varchar("stripe_charge_id", { length: 255 }),
  paymentDate: timestamp("payment_date").defaultNow(),
});

// Costs table
export const costs = pgTable("costs", {
  id: serial("id").primaryKey(),
  costType: varchar("cost_type", { length: 100 }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  description: text("description"),
  recordedDate: timestamp("recorded_date").defaultNow(),
});

// Shared KREIT Scores table
export const sharedScores = pgTable("shared_scores", {
  id: serial("id").primaryKey(),
  shareId: varchar("share_id", { length: 32 }).unique().notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  score: integer("score").notNull(),
  simpleExplanation: text("simple_explanation"),
  technicalExplanation: text("technical_explanation"),
  propertyDetails: jsonb("property_details"),
  benefits: jsonb("benefits"),
  concerns: jsonb("concerns"),
  keyMetrics: jsonb("key_metrics"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Saved Analysis Reports - stores downloadable HTML reports
export const savedReports = pgTable("saved_reports", {
  id: serial("id").primaryKey(),
  reportId: varchar("report_id", { length: 32 }).unique().notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  address: varchar("address", { length: 500 }).notNull(),
  score: integer("score").notNull(),
  htmlContent: text("html_content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Analytics table
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 10 }).unique(),
  totalUsers: integer("total_users").default(0),
  activeUsers: integer("active_users").default(0),
  paidUsers: integer("paid_users").default(0),
  searchesCount: integer("searches_count").default(0),
  revenueCents: integer("revenue_cents").default(0),
  costsCents: integer("costs_cents").default(0),
  profitCents: integer("profit_cents").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Verification codes table for 2FA
export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  purpose: varchar("purpose", { length: 50 }).notNull(), // 'signup', 'password_change', 'email_change'
  userId: integer("user_id"), // null for signup, set for password/email changes
  newEmail: varchar("new_email", { length: 255 }), // for email changes only
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product usage tracking for admin analytics
export const productUsage = pgTable("product_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  productSlug: varchar("product_slug", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  meta: jsonb("meta"),
});

// User suggestions for product improvements
export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }),
  status: varchar("status", { length: 50 }).default("new").notNull(),
  aiRecommendation: text("ai_recommendation"),
  votes: integer("votes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI-generated insights for admin dashboard
export const aiInsights = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 100 }).notNull(),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Usage events for metered billing - tracks each billable action
export const usageEvents = pgTable("usage_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  productSlug: varchar("product_slug", { length: 100 }).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // 'free', 'paid'
  units: integer("units").notNull().default(1),
  costCents: integer("cost_cents").notNull().default(0), // our cost to provide this
  priceCents: integer("price_cents").notNull().default(0), // what we charge
  idempotencyKey: varchar("idempotency_key", { length: 255 }).unique(),
  stripeMeterEventId: varchar("stripe_meter_event_id", { length: 255 }),
  syncStatus: varchar("sync_status", { length: 50 }).default("pending"), // 'pending', 'synced', 'failed'
  syncError: text("sync_error"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Monthly usage quotas per user/product - tracks free tier usage
export const usageQuotas = pgTable("usage_quotas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productSlug: varchar("product_slug", { length: 100 }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  freeLimit: integer("free_limit").notNull().default(3), // free analyses per period
  freeUsed: integer("free_used").notNull().default(0),
  paidUsed: integer("paid_used").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stripe customer mapping - links users to Stripe customers
export const stripeCustomers = pgTable("stripe_customers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
  hasPaymentMethod: boolean("has_payment_method").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User AI Preferences - stores personalized real estate goals and preferences
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  role: varchar("role", { length: 100 }), // Professional role: 'analyst', 'appraiser', 'agent', 'data_scientist', 'asset_manager', 'developer', 'lender', 'advisor', 'broker', 'investor'
  focusAreas: text("focus_areas").array(), // ['property_valuation', 'market_analysis', 'risk_assessment', 'investment_strategy', 'due_diligence', 'client_advisory', etc.]
  investorType: varchar("investor_type", { length: 50 }), // 'homeowner', 'investor', 'developer', 'landlord', 'flipper' (legacy, backward compatible)
  experienceLevel: varchar("experience_level", { length: 30 }), // 'beginner', 'intermediate', 'advanced', 'expert'
  propertyTypes: text("property_types").array(), // ['residential', 'commercial', 'industrial', 'land', 'multifamily']
  investmentStrategy: text("investment_strategy").array(), // ['buyhold', 'flip', 'brrrr', 'str', 'wholesale', etc.]
  goals: text("goals"), // Free-form description of what they want to achieve
  priorities: text("priorities").array(), // ['cash_flow', 'appreciation', 'location', 'schools', 'safety']
  financialGoals: text("financial_goals").array(), // ['passive_income', 'wealth_building', 'retire_early', etc.]
  budgetMin: integer("budget_min"), // Minimum budget in dollars
  budgetMax: integer("budget_max"), // Maximum budget in dollars
  targetROI: integer("target_roi"), // Target annual ROI percentage
  targetCashFlow: integer("target_cash_flow"), // Target monthly cash flow in dollars
  preferredLocations: text("preferred_locations").array(), // Cities, states, or regions
  preferredMarkets: text("preferred_markets").array(), // ['hot', 'emerging', 'stable', 'cashflow']
  riskTolerance: varchar("risk_tolerance", { length: 20 }), // 'conservative', 'moderate', 'aggressive'
  holdingPeriod: varchar("holding_period", { length: 20 }), // 'short', 'medium', 'long'
  investmentStyle: varchar("investment_style", { length: 30 }), // 'hands_on', 'passive', 'mixed'
  dealCriteria: text("deal_criteria").array(), // Custom deal criteria
  workSituation: varchar("work_situation", { length: 30 }), // 'full_time_investor', 'side_hustle', 'transitioning'
  aiSummary: text("ai_summary"), // AI-generated summary of user preferences
  rawInput: text("raw_input"), // The raw text input from the user
  // Learned preferences from user behavior
  learnedPropertyTypes: text("learned_property_types").array(), // Property types inferred from searches
  learnedPriceRange: jsonb("learned_price_range"), // { min: number, max: number, avg: number }
  learnedLocations: text("learned_locations").array(), // Locations frequently searched
  learnedScorePreference: integer("learned_score_preference"), // Average score of properties they show interest in
  learnedPriorities: jsonb("learned_priorities"), // { priority: weight } learned from behavior
  behaviorInsights: text("behavior_insights"), // AI-generated insights from user behavior
  lastBehaviorAnalysis: timestamp("last_behavior_analysis"), // When behavior was last analyzed
  totalSearches: integer("total_searches").default(0), // Total number of searches
  engagementScore: integer("engagement_score").default(0), // How engaged they are with the app (0-100)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Behavior Tracking - tracks user actions for AI learning
export const userBehavior = pgTable("user_behavior", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  actionType: varchar("action_type", { length: 50 }).notNull(), // 'search', 'view_result', 'share', 'save', 'click_feature'
  actionData: jsonb("action_data"), // { address, score, propertyType, priceRange, location, etc. }
  sessionId: varchar("session_id", { length: 100 }), // Track actions within a session
  pageContext: varchar("page_context", { length: 100 }), // Which page/feature they were using
  timeSpent: integer("time_spent"), // Seconds spent on action (for engagement tracking)
  createdAt: timestamp("created_at").defaultNow(),
});

// Rate limiting - tracks analysis requests per user/hour
export const rateLimits = pgTable("rate_limits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  ipAddress: varchar("ip_address", { length: 45 }),
  endpoint: varchar("endpoint", { length: 100 }).notNull(),
  requestCount: integer("request_count").notNull().default(1),
  windowStart: timestamp("window_start").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// IP abuse tracking - suspends abusive IPs
export const ipAbuse = pgTable("ip_abuse", {
  id: serial("id").primaryKey(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull().unique(),
  abuseType: varchar("abuse_type", { length: 50 }).notNull(),
  suspendedUntil: timestamp("suspended_until"),
  totalViolations: integer("total_violations").notNull().default(1),
  lastViolation: timestamp("last_violation").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Error logs for production monitoring with AI fix suggestions
export const errorLogs = pgTable("error_logs", {
  id: serial("id").primaryKey(),
  errorType: varchar("error_type", { length: 50 }).notNull(), // 'frontend', 'backend', 'api', 'database'
  severity: varchar("severity", { length: 20 }).notNull().default("error"), // 'critical', 'error', 'warning', 'info'
  message: text("message").notNull(),
  stack: text("stack"),
  source: varchar("source", { length: 255 }), // file/component name
  endpoint: varchar("endpoint", { length: 255 }), // API endpoint if applicable
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  requestData: jsonb("request_data"), // sanitized request info
  aiFix: jsonb("ai_fix"), // AI-generated fix suggestion
  status: varchar("status", { length: 20 }).default("new"), // 'new', 'reviewing', 'fixed', 'ignored'
  occurrences: integer("occurrences").default(1),
  lastOccurrence: timestamp("last_occurrence").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Property listings table - stores analyzed properties
export const propertyListings = pgTable("property_listings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  address: varchar("address", { length: 500 }).notNull(),
  city: varchar("city", { length: 255 }),
  country: varchar("country", { length: 100 }),
  kreitScore: integer("kreit_score").notNull(),
  pricePerSqm: decimal("price_per_sqm", { precision: 12, scale: 2 }),
  rentPerSqm: decimal("rent_per_sqm", { precision: 10, scale: 2 }),
  estimatedValue: decimal("estimated_value", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// User investment portfolios
export const userPortfolios = pgTable("user_portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  totalInvested: decimal("total_invested", { precision: 15, scale: 2 }).default("0"),
  averageScore: decimal("average_score", { precision: 5, scale: 2 }).default("0"),
  propertyCount: integer("property_count").default(0),
  diversificationScore: integer("diversification_score").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Investment history - tracks portfolio changes
export const investmentHistory = pgTable("investment_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyListingId: integer("property_listing_id").references(() => propertyListings.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 50 }).notNull(), // 'added', 'removed', 'updated'
  investmentAmount: decimal("investment_amount", { precision: 15, scale: 2 }),
  performanceChange: decimal("performance_change", { precision: 8, scale: 2 }),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Saved properties - user favorites/watchlist
export const savedProperties = pgTable("saved_properties", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyListingId: integer("property_listing_id").references(() => propertyListings.id, { onDelete: "cascade" }),
  address: varchar("address", { length: 500 }).notNull(),
  kreitScore: integer("kreit_score"),
  notes: text("notes"),
  savedAt: timestamp("saved_at").defaultNow(),
});

// Market analysis data - trends and regional insights
export const marketAnalysis = pgTable("market_analysis", {
  id: serial("id").primaryKey(),
  region: varchar("region", { length: 255 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  medianPrice: decimal("median_price", { precision: 15, scale: 2 }),
  priceGrowthRate: decimal("price_growth_rate", { precision: 6, scale: 2 }),
  rentYield: decimal("rent_yield", { precision: 6, scale: 2 }),
  demandScore: integer("demand_score"),
  supplyScore: integer("supply_score"),
  riskScore: integer("risk_score"),
  analysisData: jsonb("analysis_data"),
  analyzedAt: timestamp("analyzed_at").defaultNow(),
});

// Price alerts - notifies users of market changes
export const priceAlerts = pgTable("price_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  region: varchar("region", { length: 255 }).notNull(),
  threshold: decimal("threshold", { precision: 8, scale: 2 }).notNull(),
  alertType: varchar("alert_type", { length: 50 }).notNull(), // 'price_increase', 'price_decrease', 'yield_opportunity'
  isActive: boolean("is_active").default(true),
  triggerCount: integer("trigger_count").default(0),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// INTERNATIONAL MARKET DATABASES (Cost-Optimized)
// ============================================

// Economic indicators by country - GDP, inflation, interest rates
export const economicIndicators = pgTable("economic_indicators", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", { length: 3 }).notNull(),
  countryName: varchar("country_name", { length: 100 }).notNull(),
  gdpGrowthRate: decimal("gdp_growth_rate", { precision: 6, scale: 2 }),
  inflationRate: decimal("inflation_rate", { precision: 6, scale: 2 }),
  interestRate: decimal("interest_rate", { precision: 6, scale: 2 }),
  unemploymentRate: decimal("unemployment_rate", { precision: 6, scale: 2 }),
  gdpPerCapita: decimal("gdp_per_capita", { precision: 12, scale: 2 }),
  currencyCode: varchar("currency_code", { length: 10 }),
  exchangeRateUsd: decimal("exchange_rate_usd", { precision: 15, scale: 6 }),
  publicDebtGdp: decimal("public_debt_gdp", { precision: 6, scale: 2 }),
  dataSource: varchar("data_source", { length: 100 }),
  dataYear: integer("data_year"),
  cachedAt: timestamp("cached_at").defaultNow(),
});

// Demographics by region - population, growth, urbanization
export const demographicData = pgTable("demographic_data", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", { length: 3 }).notNull(),
  region: varchar("region", { length: 255 }),
  population: integer("population"),
  populationGrowthRate: decimal("population_growth_rate", { precision: 6, scale: 3 }),
  urbanizationRate: decimal("urbanization_rate", { precision: 6, scale: 2 }),
  medianAge: decimal("median_age", { precision: 5, scale: 2 }),
  workingAgePct: decimal("working_age_pct", { precision: 5, scale: 2 }),
  migrationRate: decimal("migration_rate", { precision: 6, scale: 2 }),
  householdSize: decimal("household_size", { precision: 4, scale: 2 }),
  homeOwnershipRate: decimal("home_ownership_rate", { precision: 5, scale: 2 }),
  dataSource: varchar("data_source", { length: 100 }),
  cachedAt: timestamp("cached_at").defaultNow(),
});

// Infrastructure quality by country/region
export const infrastructureData = pgTable("infrastructure_data", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", { length: 3 }).notNull(),
  region: varchar("region", { length: 255 }),
  transportScore: integer("transport_score"), // 0-100
  electricityReliability: integer("electricity_reliability"), // 0-100
  waterAccessPct: decimal("water_access_pct", { precision: 5, scale: 2 }),
  internetPenetration: decimal("internet_penetration", { precision: 5, scale: 2 }),
  broadbandSpeed: decimal("broadband_speed", { precision: 8, scale: 2 }), // Mbps
  roadQuality: integer("road_quality"), // 0-100
  airportAccess: boolean("airport_access"),
  publicTransitScore: integer("public_transit_score"), // 0-100
  dataSource: varchar("data_source", { length: 100 }),
  cachedAt: timestamp("cached_at").defaultNow(),
});

// Political and risk indicators by country
export const riskIndicators = pgTable("risk_indicators", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", { length: 3 }).notNull(),
  politicalStabilityScore: integer("political_stability_score"), // 0-100
  corruptionIndex: integer("corruption_index"), // 0-100 (higher = less corrupt)
  propertyRightsIndex: integer("property_rights_index"), // 0-100
  ruleOfLawIndex: integer("rule_of_law_index"), // 0-100
  easeOfDoingBusiness: integer("ease_of_doing_business"), // rank
  foreignInvestmentFreedom: integer("foreign_investment_freedom"), // 0-100
  taxBurden: decimal("tax_burden", { precision: 5, scale: 2 }),
  laborFreedom: integer("labor_freedom"), // 0-100
  regulatoryQuality: integer("regulatory_quality"), // 0-100
  dataSource: varchar("data_source", { length: 100 }),
  dataYear: integer("data_year"),
  cachedAt: timestamp("cached_at").defaultNow(),
});

// Construction and building activity
export const constructionActivity = pgTable("construction_activity", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", { length: 3 }).notNull(),
  region: varchar("region", { length: 255 }),
  buildingPermitsGrowth: decimal("building_permits_growth", { precision: 6, scale: 2 }),
  constructionOutput: decimal("construction_output", { precision: 15, scale: 2 }),
  cementConsumption: decimal("cement_consumption", { precision: 12, scale: 2 }),
  housingStarts: integer("housing_starts"),
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }),
  constructionCostIndex: decimal("construction_cost_index", { precision: 8, scale: 2 }),
  landSupplyIndex: integer("land_supply_index"), // 0-100
  dataSource: varchar("data_source", { length: 100 }),
  cachedAt: timestamp("cached_at").defaultNow(),
});

// Financial market indicators for real estate
export const financialMarkets = pgTable("financial_markets", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", { length: 3 }).notNull(),
  mortgageRate: decimal("mortgage_rate", { precision: 6, scale: 3 }),
  creditAvailability: integer("credit_availability"), // 0-100
  housingAffordabilityIndex: decimal("housing_affordability_index", { precision: 8, scale: 2 }),
  priceToIncomeRatio: decimal("price_to_income_ratio", { precision: 6, scale: 2 }),
  rentToIncomeRatio: decimal("rent_to_income_ratio", { precision: 6, scale: 2 }),
  housePriceIndex: decimal("house_price_index", { precision: 10, scale: 2 }),
  rentIndex: decimal("rent_index", { precision: 10, scale: 2 }),
  mortgagePenetration: decimal("mortgage_penetration", { precision: 5, scale: 2 }),
  foreignBuyerPct: decimal("foreign_buyer_pct", { precision: 5, scale: 2 }),
  dataSource: varchar("data_source", { length: 100 }),
  cachedAt: timestamp("cached_at").defaultNow(),
});

// Environmental and climate factors
export const environmentalFactors = pgTable("environmental_factors", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", { length: 3 }).notNull(),
  region: varchar("region", { length: 255 }),
  airQualityIndex: integer("air_quality_index"),
  climateRiskScore: integer("climate_risk_score"), // 0-100
  floodRiskLevel: varchar("flood_risk_level", { length: 20 }),
  earthquakeRiskLevel: varchar("earthquake_risk_level", { length: 20 }),
  naturalDisasterFrequency: integer("natural_disaster_frequency"),
  greenSpacePct: decimal("green_space_pct", { precision: 5, scale: 2 }),
  pollutionLevel: integer("pollution_level"), // 0-100
  renewableEnergyPct: decimal("renewable_energy_pct", { precision: 5, scale: 2 }),
  dataSource: varchar("data_source", { length: 100 }),
  cachedAt: timestamp("cached_at").defaultNow(),
});

// Quality of life indicators
export const qualityOfLife = pgTable("quality_of_life", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", { length: 3 }).notNull(),
  region: varchar("region", { length: 255 }),
  hdiIndex: decimal("hdi_index", { precision: 5, scale: 3 }), // Human Development Index
  safetyScore: integer("safety_score"), // 0-100
  healthcareQuality: integer("healthcare_quality"), // 0-100
  educationQuality: integer("education_quality"), // 0-100
  costOfLivingIndex: decimal("cost_of_living_index", { precision: 8, scale: 2 }),
  qualityOfLifeScore: decimal("quality_of_life_score", { precision: 6, scale: 2 }),
  crimeRate: decimal("crime_rate", { precision: 8, scale: 2 }),
  lifeExpectancy: decimal("life_expectancy", { precision: 5, scale: 2 }),
  dataSource: varchar("data_source", { length: 100 }),
  cachedAt: timestamp("cached_at").defaultNow(),
});

// Global API cache table - stores all API responses with TTL
export const globalApiCache = pgTable("global_api_cache", {
  id: serial("id").primaryKey(),
  cacheKey: varchar("cache_key", { length: 500 }).unique().notNull(),
  apiSource: varchar("api_source", { length: 100 }).notNull(),
  countryCode: varchar("country_code", { length: 3 }),
  region: varchar("region", { length: 255 }),
  responseData: jsonb("response_data").notNull(),
  ttlHours: integer("ttl_hours").default(24),
  hitCount: integer("hit_count").default(0),
  cachedAt: timestamp("cached_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Property Score Cache - stores calculated KREIT scores with data versioning
export const propertyScoreCache = pgTable("property_score_cache", {
  id: serial("id").primaryKey(),
  propertyHash: varchar("property_hash", { length: 64 }).unique().notNull(), // SHA-256 of normalized address
  address: varchar("address", { length: 500 }).notNull(),
  city: varchar("city", { length: 255 }),
  country: varchar("country", { length: 100 }),
  countryCode: varchar("country_code", { length: 3 }),
  
  // KREIT Score Data
  kreitScore: integer("kreit_score").notNull(),
  scoreBreakdown: jsonb("score_breakdown"), // Full category breakdown
  confidence: integer("confidence"), // 0-100 data availability confidence
  label: varchar("label", { length: 20 }), // 'Excellent', 'Strong', 'Good', etc.
  
  // Data Version Tracking
  dataVersion: varchar("data_version", { length: 64 }).notNull(), // Hash of underlying data
  dataSourceCount: integer("data_source_count").default(0),
  dataSources: text("data_sources").array(), // List of API sources used
  
  // Cache Tier (live/daily/weekly) 
  cacheTier: varchar("cache_tier", { length: 20 }).default("daily"), // 'live', 'daily', 'weekly'
  ttlMinutes: integer("ttl_minutes").default(1440), // Default 24 hours
  
  // Timestamps
  calculatedAt: timestamp("calculated_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  accessCount: integer("access_count").default(0),
});

// Data Source Freshness Tracking - monitors API data age by source
export const dataSourceFreshness = pgTable("data_source_freshness", {
  id: serial("id").primaryKey(),
  sourceKey: varchar("source_key", { length: 100 }).unique().notNull(), // e.g., 'census_acs', 'zillow', 'fbi_crime'
  sourceName: varchar("source_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'economic', 'market', 'demographic', etc.
  
  // Freshness Configuration
  refreshTier: varchar("refresh_tier", { length: 20 }).notNull(), // 'live', 'daily', 'weekly', 'monthly', 'annual'
  ttlMinutes: integer("ttl_minutes").notNull(), // How long data stays fresh
  
  // Status Tracking
  lastFetched: timestamp("last_fetched"),
  lastSuccess: timestamp("last_success"),
  lastError: text("last_error"),
  consecutiveErrors: integer("consecutive_errors").default(0),
  isHealthy: boolean("is_healthy").default(true),
  
  // Rate Limiting
  rateLimitPerHour: integer("rate_limit_per_hour"),
  requestsThisHour: integer("requests_this_hour").default(0),
  hourWindowStart: timestamp("hour_window_start"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Score Refresh Queue - background jobs for batch score updates
export const scoreRefreshQueue = pgTable("score_refresh_queue", {
  id: serial("id").primaryKey(),
  propertyHash: varchar("property_hash", { length: 64 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  priority: integer("priority").default(5), // 1 = highest, 10 = lowest
  reason: varchar("reason", { length: 100 }), // 'data_stale', 'user_request', 'scheduled', 'data_changed'
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'processing', 'completed', 'failed'
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  lastError: text("last_error"),
  scheduledFor: timestamp("scheduled_for").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Help Center articles - FAQ knowledge base for app usage
export const helpArticles = pgTable("help_articles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'getting-started', 'features', 'billing', 'troubleshooting', 'account'
  content: text("content").notNull(),
  keywords: text("keywords"), // searchable keywords
  helpfulCount: integer("helpful_count").default(0),
  unhelpfulCount: integer("unhelpful_count").default(0),
  viewCount: integer("view_count").default(0),
  order: integer("order").default(0), // display order
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Help article view tracking - track user engagement
export const helpArticleViews = pgTable("help_article_views", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  articleId: integer("article_id").notNull().references(() => helpArticles.id, { onDelete: "cascade" }),
  helpful: boolean("helpful"),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

// Help desk AI learning - stores Q&A pairs for improved responses
export const helpDeskLearning = pgTable("help_desk_learning", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  wasHelpful: boolean("was_helpful"),
  category: varchar("category", { length: 50 }), // auto-detected category
  timesUsed: integer("times_used").default(1), // how often this Q&A pair has been used as context
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string().min(8),
  subscriptionTier: z.string().optional().default("free"),
});

export const insertSubscriptionSchema = z.object({
  userId: z.number(),
  tier: z.string(),
  amountCents: z.number(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
});

export const insertSearchSchema = z.object({
  userId: z.number(),
  address: z.string(),
  kreitScore: z.number().optional(),
  aiResponse: z.any().optional(),
});

export const insertRevenueSchema = z.object({
  subscriptionId: z.number(),
  userId: z.number(),
  amountCents: z.number(),
  stripeChargeId: z.string().optional(),
});

export const insertCostSchema = z.object({
  costType: z.string(),
  amountCents: z.number(),
  description: z.string().optional(),
});

export const insertSharedScoreSchema = z.object({
  address: z.string(),
  score: z.number(),
  simpleExplanation: z.string().optional(),
  technicalExplanation: z.string().optional(),
  propertyDetails: z.any().optional(),
  benefits: z.array(z.string()).optional(),
  concerns: z.array(z.string()).optional(),
  keyMetrics: z.any().optional(),
});

export const insertSavedReportSchema = z.object({
  userId: z.number().nullable().optional(),
  address: z.string(),
  score: z.number(),
  htmlContent: z.string(),
});

export const insertVerificationCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  purpose: z.enum(['signup', 'password_change', 'email_change']),
  userId: z.number().optional(),
  newEmail: z.string().email().optional(),
  expiresAt: z.date(),
});

export const insertProductUsageSchema = z.object({
  userId: z.number().nullable().optional(),
  productSlug: z.string(),
  meta: z.any().optional(),
});

export const insertSuggestionSchema = z.object({
  userId: z.number().nullable().optional(),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  category: z.string().nullable().optional(),
  status: z.enum(['new', 'reviewing', 'planned', 'done']).default('new'),
});

export const insertAiInsightSchema = z.object({
  type: z.string(),
  content: z.any(),
});

export const insertUsageEventSchema = z.object({
  userId: z.number().nullable().optional(),
  stripeCustomerId: z.string().optional(),
  productSlug: z.string(),
  eventType: z.enum(['free', 'paid']),
  units: z.number().default(1),
  costCents: z.number().default(0),
  priceCents: z.number().default(0),
  idempotencyKey: z.string().optional(),
  meta: z.any().optional(),
});

export const insertUsageQuotaSchema = z.object({
  userId: z.number(),
  productSlug: z.string(),
  periodStart: z.date(),
  periodEnd: z.date(),
  freeLimit: z.number().default(3),
  freeUsed: z.number().default(0),
  paidUsed: z.number().default(0),
});

export const insertStripeCustomerSchema = z.object({
  userId: z.number(),
  stripeCustomerId: z.string(),
  email: z.string().email().optional(),
  hasPaymentMethod: z.boolean().default(false),
});

export const insertUserPreferencesSchema = z.object({
  userId: z.number(),
  role: z.string().optional(), // Professional role
  focusAreas: z.array(z.string()).optional(), // Professional focus areas
  investorType: z.enum(['homeowner', 'investor', 'developer', 'landlord', 'flipper', 'agent', 'wholesaler']).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  propertyTypes: z.array(z.string()).optional(),
  investmentStrategy: z.array(z.string()).optional(),
  goals: z.string().optional(),
  priorities: z.array(z.string()).optional(),
  financialGoals: z.array(z.string()).optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  targetROI: z.number().optional(),
  targetCashFlow: z.number().optional(),
  preferredLocations: z.array(z.string()).optional(),
  preferredMarkets: z.array(z.string()).optional(),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  holdingPeriod: z.enum(['short', 'medium', 'long']).optional(),
  investmentStyle: z.enum(['passive', 'active', 'hybrid']).optional(),
  dealCriteria: z.array(z.string()).optional(),
  workSituation: z.enum(['fulltime_job', 'parttime_job', 'self_employed', 'fulltime_rei', 'retired']).optional(),
  aiSummary: z.string().optional(),
  rawInput: z.string().optional(),
  // Learned preferences
  learnedPropertyTypes: z.array(z.string()).optional(),
  learnedPriceRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    avg: z.number().optional(),
  }).optional(),
  learnedLocations: z.array(z.string()).optional(),
  learnedScorePreference: z.number().optional(),
  learnedPriorities: z.record(z.string(), z.number()).optional(),
  behaviorInsights: z.string().optional(),
  lastBehaviorAnalysis: z.date().optional(),
  totalSearches: z.number().optional(),
  engagementScore: z.number().optional(),
});

export const insertUserBehaviorSchema = z.object({
  userId: z.number(),
  actionType: z.enum(['search', 'view_result', 'share', 'save', 'click_feature', 'time_on_page']),
  actionData: z.any().optional(),
  sessionId: z.string().optional(),
  pageContext: z.string().optional(),
  timeSpent: z.number().optional(),
});

export const insertRateLimitSchema = z.object({
  userId: z.number().nullable().optional(),
  ipAddress: z.string().optional(),
  endpoint: z.string(),
  requestCount: z.number().default(1),
  windowStart: z.date(),
});

export const insertIpAbuseSchema = z.object({
  ipAddress: z.string(),
  abuseType: z.string(),
  suspendedUntil: z.date().optional(),
  totalViolations: z.number().default(1),
});

export const insertHelpArticleSchema = z.object({
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
  category: z.enum(['getting-started', 'features', 'billing', 'troubleshooting', 'account']),
  content: z.string().min(1),
  keywords: z.string().optional(),
  order: z.number().default(0),
  isPublished: z.boolean().default(true),
});

export const insertHelpArticleViewSchema = z.object({
  userId: z.number().nullable().optional(),
  articleId: z.number(),
  helpful: z.boolean().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Search = typeof searches.$inferSelect;
export type InsertSearch = z.infer<typeof insertSearchSchema>;

export type Revenue = typeof revenue.$inferSelect;
export type InsertRevenue = z.infer<typeof insertRevenueSchema>;

export type Cost = typeof costs.$inferSelect;
export type InsertCost = z.infer<typeof insertCostSchema>;

export type SharedScore = typeof sharedScores.$inferSelect;
export type InsertSharedScore = z.infer<typeof insertSharedScoreSchema>;

export type SavedReport = typeof savedReports.$inferSelect;
export type InsertSavedReport = z.infer<typeof insertSavedReportSchema>;

export type Analytics = typeof analytics.$inferSelect;

export type VerificationCode = typeof verificationCodes.$inferSelect;
export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;

export type ProductUsage = typeof productUsage.$inferSelect;
export type InsertProductUsage = z.infer<typeof insertProductUsageSchema>;

export type Suggestion = typeof suggestions.$inferSelect;
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;

export type AiInsight = typeof aiInsights.$inferSelect;
export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;

export type UsageEvent = typeof usageEvents.$inferSelect;
export type InsertUsageEvent = z.infer<typeof insertUsageEventSchema>;

export type UsageQuota = typeof usageQuotas.$inferSelect;
export type InsertUsageQuota = z.infer<typeof insertUsageQuotaSchema>;

export type StripeCustomer = typeof stripeCustomers.$inferSelect;
export type InsertStripeCustomer = z.infer<typeof insertStripeCustomerSchema>;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type UserBehavior = typeof userBehavior.$inferSelect;
export type InsertUserBehavior = z.infer<typeof insertUserBehaviorSchema>;

export type RateLimit = typeof rateLimits.$inferSelect;
export type InsertRateLimit = z.infer<typeof insertRateLimitSchema>;

export type IpAbuse = typeof ipAbuse.$inferSelect;
export type InsertIpAbuse = z.infer<typeof insertIpAbuseSchema>;

export type HelpArticle = typeof helpArticles.$inferSelect;
export type InsertHelpArticle = z.infer<typeof insertHelpArticleSchema>;

export type HelpArticleView = typeof helpArticleViews.$inferSelect;
export type InsertHelpArticleView = z.infer<typeof insertHelpArticleViewSchema>;

// New insert schemas
export const insertPropertyListingSchema = z.object({
  userId: z.number(),
  address: z.string(),
  city: z.string().optional(),
  country: z.string().optional(),
  kreitScore: z.number(),
  pricePerSqm: z.string().optional(),
  rentPerSqm: z.string().optional(),
  estimatedValue: z.string().optional(),
  currency: z.string().optional(),
});

export const insertUserPortfolioSchema = z.object({
  userId: z.number(),
  totalInvested: z.string().optional(),
  averageScore: z.string().optional(),
  propertyCount: z.number().optional(),
  diversificationScore: z.number().optional(),
});

export const insertInvestmentHistorySchema = z.object({
  userId: z.number(),
  propertyListingId: z.number().optional(),
  action: z.enum(['added', 'removed', 'updated']),
  investmentAmount: z.string().optional(),
  performanceChange: z.string().optional(),
  notes: z.string().optional(),
});

export const insertSavedPropertySchema = z.object({
  userId: z.number(),
  propertyListingId: z.number().optional(),
  address: z.string(),
  kreitScore: z.number().optional(),
  notes: z.string().optional(),
});

export const insertMarketAnalysisSchema = z.object({
  region: z.string(),
  country: z.string(),
  medianPrice: z.string().optional(),
  priceGrowthRate: z.string().optional(),
  rentYield: z.string().optional(),
  demandScore: z.number().optional(),
  supplyScore: z.number().optional(),
  riskScore: z.number().optional(),
  analysisData: z.any().optional(),
});

export const insertPriceAlertSchema = z.object({
  userId: z.number(),
  region: z.string(),
  threshold: z.string(),
  alertType: z.enum(['price_increase', 'price_decrease', 'yield_opportunity']),
  isActive: z.boolean().optional(),
});

// New types
export type PropertyListing = typeof propertyListings.$inferSelect;
export type InsertPropertyListing = z.infer<typeof insertPropertyListingSchema>;

export type UserPortfolio = typeof userPortfolios.$inferSelect;
export type InsertUserPortfolio = z.infer<typeof insertUserPortfolioSchema>;

export type InvestmentHistory = typeof investmentHistory.$inferSelect;
export type InsertInvestmentHistory = z.infer<typeof insertInvestmentHistorySchema>;

export type SavedProperty = typeof savedProperties.$inferSelect;
export type InsertSavedProperty = z.infer<typeof insertSavedPropertySchema>;

export type MarketAnalysis = typeof marketAnalysis.$inferSelect;
export type InsertMarketAnalysis = z.infer<typeof insertMarketAnalysisSchema>;

export type PriceAlert = typeof priceAlerts.$inferSelect;
export type InsertPriceAlert = z.infer<typeof insertPriceAlertSchema>;

// International market insert schemas
export const insertEconomicIndicatorSchema = z.object({
  countryCode: z.string().max(3),
  countryName: z.string(),
  gdpGrowthRate: z.string().optional(),
  inflationRate: z.string().optional(),
  interestRate: z.string().optional(),
  unemploymentRate: z.string().optional(),
  gdpPerCapita: z.string().optional(),
  currencyCode: z.string().optional(),
  exchangeRateUsd: z.string().optional(),
  publicDebtGdp: z.string().optional(),
  dataSource: z.string().optional(),
  dataYear: z.number().optional(),
});

export const insertDemographicDataSchema = z.object({
  countryCode: z.string().max(3),
  region: z.string().optional(),
  population: z.number().optional(),
  populationGrowthRate: z.string().optional(),
  urbanizationRate: z.string().optional(),
  medianAge: z.string().optional(),
  workingAgePct: z.string().optional(),
  migrationRate: z.string().optional(),
  householdSize: z.string().optional(),
  homeOwnershipRate: z.string().optional(),
  dataSource: z.string().optional(),
});

export const insertRiskIndicatorSchema = z.object({
  countryCode: z.string().max(3),
  politicalStabilityScore: z.number().optional(),
  corruptionIndex: z.number().optional(),
  propertyRightsIndex: z.number().optional(),
  ruleOfLawIndex: z.number().optional(),
  easeOfDoingBusiness: z.number().optional(),
  foreignInvestmentFreedom: z.number().optional(),
  taxBurden: z.string().optional(),
  laborFreedom: z.number().optional(),
  regulatoryQuality: z.number().optional(),
  dataSource: z.string().optional(),
  dataYear: z.number().optional(),
});

export const insertGlobalApiCacheSchema = z.object({
  cacheKey: z.string(),
  apiSource: z.string(),
  countryCode: z.string().optional(),
  region: z.string().optional(),
  responseData: z.any(),
  ttlHours: z.number().optional(),
  expiresAt: z.date(),
});

// International market types
export type EconomicIndicator = typeof economicIndicators.$inferSelect;
export type InsertEconomicIndicator = z.infer<typeof insertEconomicIndicatorSchema>;

export type DemographicData = typeof demographicData.$inferSelect;
export type InsertDemographicData = z.infer<typeof insertDemographicDataSchema>;

export type InfrastructureData = typeof infrastructureData.$inferSelect;
export type RiskIndicator = typeof riskIndicators.$inferSelect;
export type InsertRiskIndicator = z.infer<typeof insertRiskIndicatorSchema>;

export type ConstructionActivity = typeof constructionActivity.$inferSelect;
export type FinancialMarket = typeof financialMarkets.$inferSelect;
export type EnvironmentalFactor = typeof environmentalFactors.$inferSelect;
export type QualityOfLife = typeof qualityOfLife.$inferSelect;
export type GlobalApiCache = typeof globalApiCache.$inferSelect;
export type InsertGlobalApiCache = z.infer<typeof insertGlobalApiCacheSchema>;

// Property Score Cache types
export const insertPropertyScoreCacheSchema = createInsertSchema(propertyScoreCache).omit({
  id: true,
  calculatedAt: true,
  lastAccessedAt: true,
  accessCount: true,
});

export type PropertyScoreCache = typeof propertyScoreCache.$inferSelect;
export type InsertPropertyScoreCache = z.infer<typeof insertPropertyScoreCacheSchema>;

// Data Source Freshness types
export const insertDataSourceFreshnessSchema = createInsertSchema(dataSourceFreshness).omit({
  id: true,
  lastFetched: true,
  lastSuccess: true,
  lastError: true,
  consecutiveErrors: true,
  isHealthy: true,
  requestsThisHour: true,
  hourWindowStart: true,
  createdAt: true,
  updatedAt: true,
});

export type DataSourceFreshness = typeof dataSourceFreshness.$inferSelect;
export type InsertDataSourceFreshness = z.infer<typeof insertDataSourceFreshnessSchema>;

// Score Refresh Queue types
export const insertScoreRefreshQueueSchema = createInsertSchema(scoreRefreshQueue).omit({
  id: true,
  status: true,
  attempts: true,
  maxAttempts: true,
  lastError: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
});

export type ScoreRefreshQueue = typeof scoreRefreshQueue.$inferSelect;
export type InsertScoreRefreshQueue = z.infer<typeof insertScoreRefreshQueueSchema>;
