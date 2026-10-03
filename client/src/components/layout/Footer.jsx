import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-ink text-surface py-16 border-t border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-surface/10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center text-surface shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-surface">
                Skyline Associations
              </span>
            </div>
            <p className="text-sm text-canvas-2/70 max-w-sm leading-relaxed mb-4">
              The modern, all-in-one operating platform for collegiate clubs, student councils, and campus communities.
            </p>
            <div className="text-xs text-canvas-2/50">
              Transactions processed in INR (₹). Built with Odoo-inspired simplicity.
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-canvas-2/90 mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-canvas-2/70">
              <li>
                <Link to="/events" className="hover:text-surface transition-colors">
                  Campus Events
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-surface transition-colors">
                  Join Association
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-surface transition-colors">
                  Member Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-canvas-2/90 mb-4">
              Modules
            </h4>
            <ul className="space-y-2.5 text-sm text-canvas-2/70">
              <li>Memberships & Passes</li>
              <li>Ticketing & Gate Scanner</li>
              <li>Merchandise & Inventory</li>
              <li>Finance & Reimbursements</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-canvas-2/90 mb-4">
              Institutions
            </h4>
            <ul className="space-y-2.5 text-sm text-canvas-2/70">
              <li>Skyline Tech University</li>
              <li>National Institute of Design</li>
              <li>Metropolitan Engineering</li>
              <li>College Admin Access</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-canvas-2/50">
          <p>© {new Date().getFullYear()} Skyline Student Association. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
