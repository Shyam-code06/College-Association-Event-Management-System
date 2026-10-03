import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Ticket,
  ShoppingBag,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Highlight } from '@/components/ui/Highlight';

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-surface py-20 lg:py-28 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-primary-soft text-primary text-xs font-semibold mb-6">
            <span className="h-2 w-2 rounded-pill bg-primary animate-pulse" />
            Next-Generation Student Association Suite
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink max-w-4xl mx-auto leading-tight sm:leading-tight">
            Manage your campus community with{' '}
            <Highlight color="yellow">effortless clarity</Highlight> and{' '}
            <Highlight color="purple">calm simplicity</Highlight>.
          </h1>

          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto mt-6 leading-relaxed">
            From event ticketing with instant gate QR verification to official merchandise
            and transparent association finances. Designed for modern universities.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/register')}
              icon={ArrowRight}
              className="w-full sm:w-auto px-8 shadow-card"
            >
              Get Started for Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/events')}
              icon={Calendar}
              className="w-full sm:w-auto px-8"
            >
              Browse Campus Events
            </Button>
          </div>

          {/* Key Value Prop Chips */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Multi-Tenant Architecture
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Offline Gate Pass QR
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              INR Direct Payment Tracking
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-20 bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink">
              All your student association tools in{' '}
              <Highlight color="teal">one unified hub</Highlight>
            </h2>
            <p className="text-sm text-muted mt-3">
              Inspired by Odoo&apos;s clean enterprise modularity — every campus task is an app.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 bg-surface hover:shadow-card transition-all duration-200">
              <div className="h-12 w-12 rounded-lg bg-primary-soft text-primary flex items-center justify-center mb-5">
                <Ticket className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-ink mb-2">Smart Ticketing</h3>
              <p className="text-xs text-muted leading-relaxed">
                Issue dynamic QR tickets with instant mobile gate scanner validation for fraud-proof entry.
              </p>
            </Card>

            <Card className="p-6 bg-surface hover:shadow-card transition-all duration-200">
              <div className="h-12 w-12 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center mb-5">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-ink mb-2">Tiered Memberships</h3>
              <p className="text-xs text-muted leading-relaxed">
                Provide student association passes with automatic member-exclusive discounts on events & merch.
              </p>
            </Card>

            <Card className="p-6 bg-surface hover:shadow-card transition-all duration-200">
              <div className="h-12 w-12 rounded-lg bg-accent/20 text-ink flex items-center justify-center mb-5">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-ink mb-2">Official Merchandise</h3>
              <p className="text-xs text-muted leading-relaxed">
                Sell branded hoodies, tees, and club kits with size variations and live inventory tracking.
              </p>
            </Card>

            <Card className="p-6 bg-surface hover:shadow-card transition-all duration-200">
              <div className="h-12 w-12 rounded-lg bg-success/10 text-success flex items-center justify-center mb-5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-ink mb-2">Finance Ledger</h3>
              <p className="text-xs text-muted leading-relaxed">
                Transparent revenue logs, receipt reimbursement claims, and double-entry auditing.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="py-16 bg-surface border-y border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-primary">100%</div>
              <div className="text-xs font-semibold text-muted uppercase mt-1">Digital Gate Entry</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-secondary">₹0</div>
              <div className="text-xs font-semibold text-muted uppercase mt-1">Hidden Setup Fees</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-ink">5,000+</div>
              <div className="text-xs font-semibold text-muted uppercase mt-1">Campus Students</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-primary">4.9/5</div>
              <div className="text-xs font-semibold text-muted uppercase mt-1">Organizer Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="py-20 bg-canvas">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary text-surface rounded-lg p-8 sm:p-12 shadow-card flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Ready to modernize your association?</h2>
              <p className="text-sm text-primary-soft/90 mt-2 max-w-lg">
                Join collegiate clubs already running seamless workshops, fests, and ticketing on Skyline.
              </p>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="bg-surface text-primary border-surface hover:bg-canvas text-sm font-bold shadow-soft"
              onClick={() => navigate('/register')}
            >
              Sign Up as Student
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
