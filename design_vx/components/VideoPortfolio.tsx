'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Menu, X, ExternalLink, Mail, Phone } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  videoUrl?: string;
  year: string;
  client: string;
}

const projects: Project[] = [
  {
    id: '1',
    title: 'Brand Revolution',
    description: 'Complete brand overhaul for tech startup featuring dynamic motion graphics and contemporary aesthetics.',
    category: 'Branding',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=450&fit=crop',
    year: '2024',
    client: 'TechFlow Inc.'
  },
  {
    id: '2',
    title: 'Digital Dreams',
    description: 'Experimental short film exploring the intersection of technology and human consciousness.',
    category: 'Film',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop',
    year: '2024',
    client: 'Independent'
  },
  {
    id: '3',
    title: 'Urban Pulse',
    description: 'High-energy commercial showcasing city life through innovative cinematography and bold editing.',
    category: 'Commercial',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=450&fit=crop',
    year: '2023',
    client: 'Metro City'
  },
  {
    id: '4',
    title: 'Future Forward',
    description: 'Corporate video series highlighting innovation and forward-thinking business solutions.',
    category: 'Corporate',
    thumbnail: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&h=450&fit=crop',
    year: '2023',
    client: 'Global Dynamics'
  },
  {
    id: '5',
    title: 'Neon Nights',
    description: 'Music video featuring striking visual effects and bold color palettes inspired by cyberpunk aesthetics.',
    category: 'Music Video',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop',
    year: '2024',
    client: 'Electric Sound'
  },
  {
    id: '6',
    title: 'Minimal Motion',
    description: 'Artistic exploration of minimalism through carefully crafted motion design and typography.',
    category: 'Art',
    thumbnail: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=450&fit=crop',
    year: '2024',
    client: 'Gallery Modern'
  }
];

export function VideoPortfolio() {
  const [activeSection, setActiveSection] = useState('work');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navItems = [
    { id: 'work', label: 'Work', className: 'highlight-green' },
    { id: 'about', label: 'About', className: '' },
    { id: 'services', label: 'Services', className: 'highlight-pink' },
    { id: 'contact', label: 'Contact', className: 'highlight-green' }
  ];

  return (
    <div className="brutalist-container">
      {/* Mobile Navigation Toggle */}
      <button 
        className="mobile-nav-toggle"
        onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
      >
        {isMobileNavOpen ? <X /> : <Menu />}
      </button>

      {/* Main Content */}
      <main className="brutalist-main" style={{ marginRight: '300px' }}>
        {/* Hero Section */}
        <section className="split-section">
          <div className="split-left bg-neon-yellow">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="brutalist-headline">
                Video
                <br />
                Creator
              </h1>
              <p className="brutalist-body mt-8 max-w-lg">
                Bold visuals. Striking narratives. Unforgettable experiences.
                I create video content that demands attention and drives results.
              </p>
              <div className="mt-12 flex gap-4">
                <button className="btn-brutalist">View Work</button>
                <button className="btn-brutalist-outline">Get In Touch</button>
              </div>
            </motion.div>
          </div>
          <div className="split-right bg-electric-blue">
            <motion.div
              className="video-showcase max-w-2xl w-full"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop"
                alt="Featured Video"
                className="w-full h-full object-cover"
              />
              <div className="video-overlay">
                <div className="play-button">
                  <Play className="ml-1" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Work Section */}
        <section className="bg-pure-white py-0">
          <div className="split-section">
            <div className="split-left bg-pure-black">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="brutalist-headline text-pure-white">
                  Selected
                  <br />
                  Works
                </h2>
                <p className="brutalist-body text-pure-white mt-8 max-w-lg opacity-80">
                  Each project represents a unique challenge overcome through 
                  creative vision and technical excellence.
                </p>
              </motion.div>
            </div>
            <div className="split-right bg-fluorescent-green">
              <motion.div
                className="w-full max-w-lg"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="brutalist-label text-pure-black mb-4">Latest Project</div>
                <h3 className="brutalist-subhead text-pure-black mb-4">Brand Revolution</h3>
                <p className="brutalist-body text-pure-black mb-8 opacity-80">
                  Complete brand overhaul featuring dynamic motion graphics 
                  and contemporary aesthetics for TechFlow Inc.
                </p>
                <button className="btn-brutalist">
                  View Case Study
                  <ExternalLink className="inline ml-2 w-4 h-4" />
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Project Grid */}
        <section className="project-grid">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              className="project-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <ImageWithFallback
                src={project.thumbnail}
                alt={project.title}
                className="w-full h-full object-cover"
              />
              <div className="video-overlay">
                <div className="play-button">
                  <Play className="ml-1" />
                </div>
              </div>
              <div className="project-info">
                <div className="flex justify-between items-start mb-2">
                  <div className="brutalist-label opacity-60">
                    {project.category} • {project.year}
                  </div>
                  <div className="brutalist-label opacity-60">
                    {project.client}
                  </div>
                </div>
                <h3 className="project-title">{project.title}</h3>
                <p className="project-description">{project.description}</p>
              </div>
            </motion.div>
          ))}
        </section>

        {/* About Section */}
        <section className="split-section">
          <div className="split-left bg-hot-pink">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="brutalist-headline">
                About
                <br />
                Me
              </h2>
              <p className="brutalist-body mt-8 max-w-lg">
                With over 8 years of experience in video production, I specialize 
                in creating bold, impactful content that resonates with audiences 
                and achieves business objectives.
              </p>
              <div className="mt-12">
                <div className="brutalist-label mb-4">Expertise</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="brutalist-body">Motion Graphics</div>
                  <div className="brutalist-body">Brand Films</div>
                  <div className="brutalist-body">Commercials</div>
                  <div className="brutalist-body">Music Videos</div>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="split-right bg-pure-white">
            <motion.div
              className="max-w-lg"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="brutalist-label text-pure-black mb-4">Philosophy</div>
              <h3 className="brutalist-subhead text-pure-black mb-6">
                Bold Ideas.
                <br />
                Flawless Execution.
              </h3>
              <p className="brutalist-body text-pure-black mb-8 opacity-80">
                Every frame matters. Every cut has purpose. I believe in pushing 
                creative boundaries while maintaining technical excellence to 
                deliver videos that not only look stunning but perform exceptionally.
              </p>
              <div className="flex gap-4">
                <button className="btn-brutalist">Download Reel</button>
                <button className="btn-brutalist-outline">View Resume</button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="split-section">
          <div className="split-left bg-pure-black">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="brutalist-headline text-pure-white">
                Let's
                <br />
                Create
              </h2>
              <p className="brutalist-body text-pure-white mt-8 max-w-lg opacity-80">
                Ready to bring your vision to life? Let's discuss your project 
                and create something extraordinary together.
              </p>
            </motion.div>
          </div>
          <div className="split-right bg-neon-yellow">
            <motion.div
              className="w-full max-w-lg"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="space-y-8">
                <div>
                  <div className="brutalist-label text-pure-black mb-2">Email</div>
                  <div className="brutalist-body text-pure-black">hello@videocreator.com</div>
                </div>
                <div>
                  <div className="brutalist-label text-pure-black mb-2">Phone</div>
                  <div className="brutalist-body text-pure-black">+1 (555) 123-4567</div>
                </div>
                <div>
                  <div className="brutalist-label text-pure-black mb-2">Location</div>
                  <div className="brutalist-body text-pure-black">New York, NY</div>
                </div>
                <div className="pt-8">
                  <button className="btn-brutalist w-full">Start Project</button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Right Navigation */}
      <nav className={`brutalist-nav ${isMobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="nav-brand">
          <h1>Video Creator</h1>
        </div>
        
        <div className="nav-links">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`nav-link ${item.className} ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveSection(item.id);
                setIsMobileNavOpen(false);
              }}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="nav-contact">
          <div className="contact-info">
            <div className="mb-4">
              <div className="brutalist-label mb-1">Available for</div>
              <div>Freelance Projects</div>
            </div>
            <div className="flex gap-4">
              <Mail className="w-5 h-5" />
              <Phone className="w-5 h-5" />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}