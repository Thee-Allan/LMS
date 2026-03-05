import React from 'react';
import { Button } from '@/components/ui/button';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">NLF</span>
              </div>
              <span className="text-xl font-bold">Nanyuki Law Firm</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#practice" className="hover:text-yellow-400 transition-colors">Practice Areas</a>
              <a href="#team" className="hover:text-yellow-400 transition-colors">Our Team</a>
              <a href="#testimonials" className="hover:text-yellow-400 transition-colors">Testimonials</a>
              <a href="#contact" className="hover:text-yellow-400 transition-colors">Contact</a>
            </div>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={onEnterApp}
                className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
              >
                Sign In
              </Button>
              <Button
                onClick={onEnterApp}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <section className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                    Justice Begins
                    <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                      With Us
                    </span>
                  </h1>
                  <p className="text-xl text-gray-300 leading-relaxed">
                    For over 18 years, Nanyuki Law Firm has been providing exceptional legal services
                    with a commitment to excellence, integrity, and client success.
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="text-3xl lg:text-4xl font-bold text-yellow-400" data-count="500">0</div>
                    <div className="text-sm text-gray-400">Cases Handled</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl lg:text-4xl font-bold text-yellow-400" data-count="200">0</div>
                    <div className="text-sm text-gray-400">Happy Clients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl lg:text-4xl font-bold text-yellow-400" data-count="18">0</div>
                    <div className="text-sm text-gray-400">Years Experience</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={onEnterApp}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-lg py-6 px-8 hover:from-yellow-300 hover:to-orange-400"
                  >
                    Create Your Account
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onEnterApp}
                    className="border-yellow-400 text-yellow-400 text-lg py-6 px-8 hover:bg-yellow-400 hover:text-black"
                  >
                    Sign In to Portal
                  </Button>
                </div>
              </div>

              {/* Portal Preview Card */}
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20"></div>
                  <div className="relative">
                    <h3 className="text-2xl font-bold mb-4">Your Legal Portal</h3>
                    <div className="space-y-3 text-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>Track your cases in real-time</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>Secure document sharing</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>Direct communication with your attorney</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>24/7 access to case updates</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Practice Areas */}
        <section id="practice" className="py-16 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Practice Areas</h2>
              <p className="text-gray-300">Comprehensive legal services across multiple disciplines</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: 'Commercial Law', desc: 'Business contracts, mergers, and corporate compliance' },
                { title: 'Criminal Defence', desc: 'Representation for individuals and businesses' },
                { title: 'Civil Litigation', desc: 'Dispute resolution and court representation' },
                { title: 'Land & Property', desc: 'Real estate transactions and property disputes' },
                { title: 'Family Law', desc: 'Divorce, custody, and family-related matters' },
                { title: 'Employment Law', desc: 'Workplace disputes and employment contracts' },
              ].map((area, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                  <h3 className="text-xl font-semibold mb-2">{area.title}</h3>
                  <p className="text-gray-300">{area.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Band */}
        <section className="py-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold" data-count="98">0%</div>
                <div className="text-sm font-medium">Client Satisfaction</div>
              </div>
              <div>
                <div className="text-3xl font-bold" data-count="500">0</div>
                <div className="text-sm font-medium">Cases Handled</div>
              </div>
              <div>
                <div className="text-3xl font-bold" data-count="18">0</div>
                <div className="text-sm font-medium">Years Experience</div>
              </div>
              <div>
                <div className="text-3xl font-bold" data-count="10">0</div>
                <div className="text-sm font-medium">Practice Areas</div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Team */}
        <section id="team" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Our Team</h2>
              <p className="text-gray-300">Dedicated professionals committed to your success</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: 'James Mwangi', title: 'Managing Partner', color: 'from-blue-500 to-blue-700' },
                { name: 'Grace Wanjiku', title: 'Senior Advocate', color: 'from-green-500 to-green-700' },
                { name: 'Peter Kamau', title: 'Litigation Expert', color: 'from-purple-500 to-purple-700' },
              ].map((member, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center hover:bg-white/10 transition-all">
                  <div className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-br ${member.color} rounded-full flex items-center justify-center text-2xl font-bold text-white`}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                  <p className="text-gray-300">{member.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-16 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Client Testimonials</h2>
              <p className="text-gray-300">Hear what our clients have to say</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { text: 'Nanyuki Law Firm handled my case with professionalism and care. I was kept informed every step of the way.', name: 'David Kimani', rating: 5 },
                { text: 'Exceptional service and outstanding results. I highly recommend their legal team.', name: 'Jane Achieng', rating: 5 },
                { text: 'They fought for my rights and achieved a favorable outcome. Truly dedicated professionals.', name: 'Samuel Mutua', rating: 4 },
              ].map((testimonial, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4 italic">"{testimonial.text}"</p>
                  <div className="font-semibold">{testimonial.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-12 text-black">
              <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-lg mb-8 opacity-90">
                Join hundreds of satisfied clients who have trusted Nanyuki Law Firm
                with their legal needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={onEnterApp}
                  className="bg-black text-white text-lg py-6 px-8 hover:bg-gray-800"
                >
                  Create Your Account
                </Button>
                <Button
                  variant="outline"
                  onClick={onEnterApp}
                  className="border-black text-black text-lg py-6 px-8 hover:bg-black hover:text-white"
                >
                  Sign In to Portal
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Footer */}
        <footer id="contact" className="py-12 bg-black/30 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
              <div>
                <h3 className="text-lg font-semibold mb-4">Address</h3>
                <p className="text-gray-300">Nanyuki Town, Laikipia County<br />Kenya</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Phone</h3>
                <p className="text-gray-300">+254 700 100 000</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Email</h3>
                <p className="text-gray-300">info@nanyukilaw.com</p>
              </div>
            </div>
            <div className="mt-8 text-center text-gray-400">
              &copy; 2024 Nanyuki Law Firm. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};