'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Briefcase, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50"></div>
      
      {/* Geometric Accents */}
      <div className="geometric-accent bg-brand-blue top-10 left-10"></div>
      <div className="geometric-accent bg-brand-yellow top-1/2 right-20"></div>
      <div className="geometric-accent bg-brand-cyan bottom-20 left-1/3"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Main Headline */}
            <div className="relative">
              <div className="absolute -left-4 top-0 w-2 h-full bg-brand-yellow"></div>
              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                We build meaningful
                <span className="block text-brand-blue">partnerships</span>
                <span className="block">between</span>
                <span className="block bg-brand-yellow text-black px-4 py-2 inline-block mt-2">
                  top talent
                </span>
                <span className="block">and forward-thinking companies</span>
              </h1>
            </div>

            {/* Subtitle */}
            <motion.p 
              className="text-xl text-gray-600 max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Connect with the best opportunities and exceptional talent through our innovative platform designed for the future of work.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Button className="btn-primary text-lg px-8 py-4">
                <Users className="w-5 h-5" />
                Find Talent
              </Button>
              <Button className="btn-secondary text-lg px-8 py-4">
                <Briefcase className="w-5 h-5" />
                Get Hired
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="stat-item">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Professionals</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">500+</span>
                <span className="stat-label">Companies</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">95%</span>
                <span className="stat-label">Success Rate</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Feature Cards */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="card-modern">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-blue rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Elite Talent Network</h3>
                  <p className="text-gray-600">Access pre-vetted professionals with proven track records in their fields.</p>
                </div>
              </div>
            </div>

            <div className="card-modern">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-yellow rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Smart Matching</h3>
                  <p className="text-gray-600">AI-powered algorithms ensure perfect fits between candidates and roles.</p>
                </div>
              </div>
            </div>

            <div className="card-modern">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-black rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">End-to-End Support</h3>
                  <p className="text-gray-600">From initial contact to successful placement and beyond.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}