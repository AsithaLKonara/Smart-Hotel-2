"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SocialLink {
  platform: string
  url: string
  icon?: string
}

interface FooterLink {
  label: string
  url: string
  category: string
}

export default function HotelFooter() {
  const [contact, setContact] = useState<any>(null)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const contactResponse = await fetch('/api/settings/contact')
        if (contactResponse.ok) {
          const contactData = await contactResponse.json()
          setContact(contactData)
        }

        const socialResponse = await fetch('/api/social-links')
        if (socialResponse.ok) {
          const socialData = await socialResponse.json()
          const items = Array.isArray(socialData) ? socialData : (socialData.items || [])
          setSocialLinks(items.map((item: any) => ({
            platform: item.platform,
            url: item.url,
            icon: item.icon
          })))
        }

        const footerResponse = await fetch('/api/footer-links')
        if (footerResponse.ok) {
          const footerData = await footerResponse.json()
          const items = Array.isArray(footerData) ? footerData : (footerData.items || [])
          setFooterLinks(items.map((item: any) => ({
            label: item.label,
            url: item.url,
            category: item.category
          })))
        }
      } catch (error) {
        console.error('Failed to load footer data:', error)
      }
    }
    loadData()
  }, [])

  const quickLinks = footerLinks.filter(link => link.category === 'Quick Links')
  const services = footerLinks.filter(link => link.category === 'Services')

  const getSocialIcon = (platform: string) => {
    const lowerPlatform = platform.toLowerCase()
    if (lowerPlatform.includes('facebook')) return Facebook
    if (lowerPlatform.includes('twitter') || lowerPlatform.includes('x')) return Twitter
    if (lowerPlatform.includes('instagram')) return Instagram
    if (lowerPlatform.includes('youtube')) return Youtube
    return null
  }

  if (!contact) {
    return (
      <footer className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=1600"
            alt="Hotel Background"
            fill
            className="object-cover opacity-15"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        </div>
        <div className="relative z-10 p-8 text-center text-white/40 text-sm uppercase tracking-widest font-bold">Loading...</div>
      </footer>
    )
  }

  return (
    <footer className="relative overflow-hidden border-t border-white/5">
      {/* Background Image + Blur */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=1600"
          alt="Luxury Hotel Lobby"
          fill
          className="object-cover opacity-20"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Hotel Brand */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-3">
                <div className="w-10 h-10 bg-gold-gradient rounded-xl flex items-center justify-center shadow-luxury">
                  <span className="text-white font-bold text-sm">GP</span>
                </div>
                <span className="text-xl font-serif font-bold text-white tracking-tight">SMART<span className="text-primary">HOTEL</span></span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold">{contact.tagline || 'Grand Palace'}</p>
            </div>
            <p className="text-white/40 text-sm font-light leading-relaxed">
              {contact.description || 'A sanctuary of refined luxury where every moment is crafted to exceed expectation.'}
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social, index) => {
                const IconComponent = getSocialIcon(social.platform)
                return (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/30 rounded-xl flex items-center justify-center text-white/40 hover:text-primary transition-all duration-300"
                    aria-label={`Follow us on ${social.platform}`}
                  >
                    {social.icon ? (
                      <span className="text-sm">{social.icon}</span>
                    ) : IconComponent ? (
                      <IconComponent className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{social.platform[0]}</span>
                    )}
                  </a>
                )
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Quick Links</h4>
            <ul className="space-y-3">
              {(quickLinks.length > 0 ? quickLinks : [
                { label: 'Rooms & Suites', url: '/rooms' },
                { label: 'Facilities', url: '/facilities' },
                { label: 'Gallery', url: '/gallery' },
                { label: 'Contact', url: '/contact' },
              ]).map((link, index) => (
                <li key={index}>
                  <Link href={link.url} className="text-white/40 hover:text-primary text-sm font-light transition-colors duration-300 hover:tracking-wider">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Services</h4>
            <ul className="space-y-3">
              {(services.length > 0 ? services : [
                { label: 'Concierge', url: '/contact' },
                { label: 'Spa & Wellness', url: '/facilities' },
                { label: 'Fitness Center', url: '/facilities' },
                { label: 'Valet Parking', url: '/facilities' },
              ]).map((link, index) => (
                <li key={index}>
                  {link.url ? (
                    <Link href={link.url} className="text-white/40 hover:text-primary text-sm font-light transition-colors duration-300 hover:tracking-wider">
                      {link.label}
                    </Link>
                  ) : (
                    <span className="text-white/40 text-sm font-light">{link.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Contact</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 group">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-white/40 text-sm font-light leading-relaxed group-hover:text-white/60 transition-colors">{contact.address}</p>
              </div>
              <div className="flex items-center space-x-3 group">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-white/40 text-sm font-light group-hover:text-white/60 transition-colors">{contact.phone}</p>
              </div>
              <div className="flex items-center space-x-3 group">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-white/40 text-sm font-light group-hover:text-white/60 transition-colors">{contact.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/20 text-xs font-light tracking-wider">
              © {new Date().getFullYear()} {contact.name}. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              {footerLinks.filter(link => link.category === 'Legal').map((link, index) => (
                <Link key={index} href={link.url} className="text-white/20 hover:text-primary text-xs font-light transition-colors tracking-wider">
                  {link.label}
                </Link>
              ))}
              <Link href="/contact" className="text-white/20 hover:text-primary text-xs font-light transition-colors tracking-wider">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
