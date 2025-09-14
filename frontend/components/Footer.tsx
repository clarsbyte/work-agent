import React from 'react'
import Image from 'next/image'

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20 -mx-10">
      <div className="mx-10 py-12">
        <div className="flex justify-between items-start">
          <div className="left-section">
            <h3 className="font-zt-formom text-2xl mb-4">Worme</h3>
            <p className="font-inter text-gray-600 mb-6 max-w-sm">
              Streamline your workflow with AI-powered email composition and automatic meeting scheduling.
            </p>
            <div className="social-links flex gap-4">
              <a href="mailto:csaputra@ucsd.edu" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                <span className="text-gray-600 text-sm">@</span>
              </a>
              <a href="https://www.linkedin.com/in/clarisssaans/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                <span className="text-gray-600 text-sm">in</span>
              </a>
            </div>
          </div>

          <div className="right-section flex gap-16">
            <div className="links-column">
              <h4 className="font-inter font-semibold mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="/about" className="font-inter text-gray-600 hover:text-gray-900 transition-colors">About</a></li>
              </ul>
            </div>

            <div className="integrations">
              <h4 className="font-inter font-semibold mb-4">Integrations</h4>
              <div className="flex gap-3">
                <Image alt="gmail" width={24} height={24} src='https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg' className="hover:scale-110 transition-transform duration-200"/>
                <Image alt="calendar" width={24} height={24} src='https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg' className="hover:scale-110 transition-transform duration-200"/>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-12 pt-6 flex justify-between items-center">
          <p className="font-inter text-sm text-gray-500">
            © 2025 Worme. All rights reserved.
          </p>
          <p className="font-inter text-sm text-gray-500">
            Made with ❤️ for productivity
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer