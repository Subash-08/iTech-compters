
import React from 'react';
import { 
  Monitor, 
  Cpu, 
  Laptop, 
  Wrench, 
  Briefcase,
  ShieldCheck,
  Tag,
  Lightbulb,
  Headphones,
  MapPin,
  Heart
} from 'lucide-react';

export const BRAND = {
  name: 'iTech Computers',
  phone: '6382928973',
  email: 'itechcomputersno7@gmail.com',
  address: `iTech Computers, RBT Mall, Meyyanur Bypass Rd, Opp. to iPlanet, Meyyanur, Salem, Tamil Nadu – 636004`
};

export const OFFERINGS = [
  {
    title: 'Computers & Accessories',
    description: 'A curated selection of high-performance peripherals and workstation setups.',
    icon: <Monitor className="w-6 h-6 text-blue-600" />
  },
  {
    title: 'Custom PC Builds',
    description: 'Precision-engineered gaming and professional rigs tailored to your specific needs.',
    icon: <Cpu className="w-6 h-6 text-blue-600" />
  },
  {
    title: 'Laptops & Components',
    description: 'The latest portable computing solutions and premium internal components.',
    icon: <Laptop className="w-6 h-6 text-blue-600" />
  },
  {
    title: 'Tech Support & Service',
    description: 'Expert diagnostic services and rapid hardware repairs by certified technicians.',
    icon: <Wrench className="w-6 h-6 text-blue-600" />
  },
  {
    title: 'Business Solutions',
    description: 'Scalable infrastructure and procurement for modern office environments.',
    icon: <Briefcase className="w-6 h-6 text-blue-600" />
  }
];

export const TRUST_POINTS = [
  {
    title: 'Quality Products',
    description: 'We source only from authorized distributors to ensure 100% authenticity.',
    icon: <ShieldCheck className="w-5 h-5" />
  },
  {
    title: 'Transparent Pricing',
    description: 'Honest market rates with zero hidden costs or surprise fees.',
    icon: <Tag className="w-5 h-5" />
  },
  {
    title: 'Expert Guidance',
    description: 'Our consultants help you navigate complex specs to find the perfect fit.',
    icon: <Lightbulb className="w-5 h-5" />
  },
  {
    title: 'After-Sales Support',
    description: 'Our relationship begins when you walk out the door, not when we close the sale.',
    icon: <Headphones className="w-5 h-5" />
  },
  {
    title: 'Trusted Local Presence',
    description: 'A physical landmark in Salem where you can always find support.',
    icon: <MapPin className="w-5 h-5" />
  },
  {
    title: 'Customer Satisfaction',
    description: 'Consistently high ratings driven by our commitment to your success.',
    icon: <Heart className="w-5 h-5" />
  }
];
