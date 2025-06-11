'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Phone, Mail } from 'lucide-react';
import { Button } from './ui/button';

export function CTASection() {
  return (
    <section className="bg-brand-black text-white py-20 section-geometric relative overflow-hidden">
      {/* Background Elements */}
      <div className="geometric-accent bg-brand-blue top-10 right-10"></div>
      <div className="geometric-accent bg-brand-yellow bottom-10 left-10"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div>
              <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                Start Your
                <span className="block text-brand-yellow">Search</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Ready to transform your career or find exceptional talent? 
                Let's connect and explore the possibilities together.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="btn-secondary text-lg px-8 py-4">
                <ArrowRight className="w-5 h-5" />
                Get Started
              </Button>
              <Button className="btn-dark border border-white/20 text-lg px-8 py-4">
                <Phone className="w-5 h-5" />
                Schedule Call
              </Button>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col sm:flex-row gap-8 pt-8 border-t border-white/20">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-brand-yellow" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-brand-yellow" />
                <span>hello@digitalsync.com</span>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Stats */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm">
                <div className="text-4xl font-bold text-brand-yellow mb-2">10K+</div>
                <div className="text-gray-300">Successful Placements</div>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm">
                <div className="text-4xl font-bold text-brand-yellow mb-2">500+</div>
                <div className="text-gray-300">Partner Companies</div>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm">
                <div className="text-4xl font-bold text-brand-yellow mb-2">95%</div>
                <div className="text-gray-300">Success Rate</div>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm">
                <div className="text-4xl font-bold text-brand-yellow mb-2">24/7</div>
                <div className="text-gray-300">Support Available</div>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="font-bold text-xl mb-4">Why Choose DigitalSync?</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-brand-yellow rounded-full"></div>
                  Industry-leading placement success rate
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-brand-yellow rounded-full"></div>
                  Comprehensive candidate vetting process
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-brand-yellow rounded-full"></div>
                  Ongoing support and consultation
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-brand-yellow rounded-full"></div>
                  Global network of top talent
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}