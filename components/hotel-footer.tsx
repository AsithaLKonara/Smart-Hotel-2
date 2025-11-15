"use client"

import Link from 'next/link'
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react'
import { getHotelContactInfo } from '@/lib/settings'
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
        // Load contact info
        const contactResponse = await fetch('/api/settings/contact')
        if (contactResponse.ok) {
          const contactData = await contactResponse.json()
          setContact(contactData)
        }

        // Load social links
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

        // Load footer links
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
    return <footer className="bg-gray-900 text-white p-8 text-center">Loading...</footer>
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Hotel Info */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">GP</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">{contact.name}</h3>
                <p className="text-sm text-gray-400">{contact.tagline}</p>
              </div>
            </div>
            <p className="text-gray-400 mb-6">
              {contact.description}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const IconComponent = getSocialIcon(social.platform)
                return (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={`Follow us on ${social.platform}`}
                  >
                    {social.icon ? (
                      <span className="text-xl">{social.icon}</span>
                    ) : IconComponent ? (
                      <IconComponent className="w-5 h-5" />
                    ) : (
                      <span>{social.platform[0]}</span>
                    )}
                  </a>
                )
              })}
            </div>
          </div>

          {/* Quick Links */}
          {quickLinks.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <Link href={link.url} className="text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Services */}
          {services.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-6">Services</h4>
              <ul className="space-y-3">
                {services.map((link, index) => (
                  <li key={index} className="text-gray-400">
                    {link.url ? (
                      <Link href={link.url} className="hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    ) : (
                      link.label
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contact Info</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-amber-500 mt-1" />
                <div>
                  <p className="text-gray-400">{contact.address}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-amber-500" />
                <p className="text-gray-400">{contact.phone}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-amber-500" />
                <p className="text-gray-400">{contact.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {contact.name}. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {footerLinks.filter(link => link.category === 'Legal').map((link, index) => (
                <Link key={index} href={link.url} className="text-gray-400 hover:text-white text-sm transition-colors">
                  {link.label}
                </Link>
              ))}
              <Link href="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
