'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, UserCheck, Building2, Award, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

export function ServicesSection() {
  const services = [
    {
      icon: Search,
      title: 'Talent Search',
      description: 'Find the perfect candidates for your specific requirements with our advanced search capabilities.',
      color: 'bg-brand-blue',
      textColor: 'text-white'
    },
    {
      icon: UserCheck,
      title: 'Candidate Screening',
      description: 'Comprehensive vetting process including skills assessment, background checks, and cultural fit evaluation.',
      color: 'bg-brand-yellow',
      textColor: 'text-black'
    },
    {
      icon: Building2,
      title: 'Team Building',
      description: 'Build high-performing teams with our strategic placement and team dynamics expertise.',
      color: 'bg-brand-black',
      textColor: 'text-white'
    },
    {
      icon: Award,
      title: 'Success Guarantee',
      description: 'We stand behind our placements with ongoing support and replacement guarantees.',
      color: 'bg-brand-cyan',
      textColor: 'text-black'
    }
  ];

  return (
    <section className="py-20 bg-gray-50 section-geometric">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            Our Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive talent solutions designed to connect exceptional professionals 
            with forward-thinking organizations.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              className={`${service.color} ${service.textColor} p-8 rounded-2xl relative overflow-hidden group cursor-pointer`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <div className="w-full h-full border-4 border-current rounded-full transform rotate-45"></div>
              </div>

              <div className="relative z-10">
                <service.icon className="w-12 h-12 mb-6" />
                <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                <p className="text-base opacity-90 mb-6">{service.description}</p>
                
                <div className="flex items-center gap-2 group-hover:gap-4 transition-all duration-300">
                  <span className="font-semibold">Learn More</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <Button className="btn-primary text-lg px-8 py-4">
            Start Your Journey
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}