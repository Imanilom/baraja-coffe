import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Lenis from '@studio-freight/lenis';
import '../style/Home.css';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    AOS.init({ once: true, duration: 1000 });
    
    const handleScroll = () => {
      const navbar = document.getElementById('navbar-container');
      if (window.scrollY > 100) {
        setScrolled(true);
        if (navbar) navbar.style.transform = 'translateY(-100%)';
      } else {
        setScrolled(false);
        if (navbar) navbar.style.transform = 'translateY(0)';
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    const lenis = new Lenis();
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="font-cleveland overflow-x-hidden bg-beige text-army">
      {/* Navbar */}
      <nav 
        id="navbar-container"
        className="fixed left-0 top-0 z-50 w-full transition-all duration-500"
        style={{ 
          backgroundColor: scrolled ? 'rgba(245, 245, 220, 0.9)' : 'transparent',
          backdropFilter: scrolled ? 'blur(10px)' : 'none'
        }}
      >
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <a href="#" className="text-3xl font-bold text-army">
            Baraja Coffee
          </a>
          
          <button 
            className="md:hidden text-3xl text-army"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
          
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block`}>
            <ul className="flex flex-col md:flex-row items-center gap-8 text-xl">
              {['Home', 'Menu', 'About', 'Contact'].map((item) => (
                <li key={item}>
                  <a 
                    href="#" 
                    className="hover:text-army-dark transition-colors text-army"
                  >
                    {item}
                  </a>
                </li>
              ))}
              <button className="border-2 border-army px-6 py-2 rounded-full hover:bg-army hover:text-beige transition-all text-army">
                Book Table
              </button> 
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen hero-section flex items-center">
        <div className="container mx-auto px-6 py-20">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2" data-aos="fade-right">
              <h1 className="text-5xl lg:text-6xl font-bold mb-8 leading-tight text-army">
                Crafting Perfection in Every Cup
              </h1>
              <p className="text-xl mb-8 lg:pr-20 text-army">
                Discover the art of specialty coffee at Baraja. We source the finest beans and 
                craft each cup with precision and passion.
              </p>
              <div className="flex gap-4">
                <button className="border-2 border-army px-8 py-3 rounded-full hover:bg-beige transition-all text-army">
                  Explore Menu
                </button>
                <button className="border-2 border-army px-8 py-3 rounded-full hover:bg-beige transition-all text-army">
                  Our Story
                </button>
              </div>
            </div>
            
            <div className="lg:w-1/2 relative" data-aos="fade-left">
              <img 
                src="https://placehold.co/600x400/png " 
                alt="Coffee" 
                className="rounded-2xl shadow-xl float-animation"
              />
              <div className="absolute -bottom-6 -right-6 bg-army text-beige p-4 rounded-lg shadow-lg">
                <span className="text-2xl">⭐ 4.9</span>
                <p className="text-sm">Rated Excellence</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-army text-beige">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 relative" data-aos="fade-up">
              <img 
                src="https://placehold.co/600x400/png " 
                alt="Coffee Shop" 
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -left-6 -top-6 bg-beige text-army p-6 rounded-xl shadow-md">
                <h3 className="text-3xl font-bold">25+ Years</h3>
                <p>Experience</p>
              </div>
            </div>

            <div className="lg:w-1/2" data-aos="fade-down">
              <h2 className="text-4xl lg:text-5xl font-bold mb-8">
                Our Journey in Coffee Excellence
              </h2>
              <p className="text-xl mb-8">
                Since 1998, Beanery has been dedicated to perfecting the art of coffee. 
                From bean selection to brewing techniques, we obsess over every detail.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-12">
                <div className="about-badge p-6 rounded-xl bg-white text-army">
                  <h3 className="text-2xl font-bold mb-3">100% Organic</h3>
                  <p>Ethically sourced beans from sustainable farms</p>
                </div>
                <div className="about-badge p-6 rounded-xl bg-white text-army">
                  <h3 className="text-2xl font-bold mb-3">Award Winning</h3>
                  <p>2023 Best Coffee Experience Award</p>
                </div>
              </div>

              <button className="bg-beige text-army px-8 py-3 rounded-full hover:bg-beige-dark transition-all">
                Meet Our Team
              </button>
            </div>
          </div>
        </div>
      </section>

      

      {/* Menu Section */}
      <section className="py-20 bg-beige">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-16 text-army" data-aos="fade-down">
            Signature Brews
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div 
                key={item}
                className="coffee-card p-6 rounded-2xl bg-white text-army"
                data-aos="zoom-in"
              >
                <img 
                  src={`https://placehold.co/600x400/png `} 
                  alt="Coffee" 
                  className="rounded-xl mb-4 h-48 w-full object-cover"
                />
                <h3 className="text-2xl font-bold mb-2">Special Brew {item}</h3>
                <p className="mb-4">Rich, aromatic blend with notes of dark chocolate</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">$4.99</span>
                  <button className="bg-army text-beige px-4 py-2 rounded-full hover:bg-army-dark">
                    Order Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-army text-beige py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-4">Baraja Cofee </h3>
              <p className="opacity-80">Crafting coffee experiences since 2077</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {['About Us', 'Our Menu', 'Locations', 'Careers'].map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:opacity-100 transition-opacity text-beige">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Contact</h4>
              <p className="mb-2">123 Coffee Street</p>
              <p className="mb-2">hello@beanery.com</p>
              <p>(555) 123-4567</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Follow Us</h4>
              <div className="flex gap-4">
                {['facebook', 'instagram', 'twitter'].map((social) => (
                  <a 
                    key={social} 
                    href="#" 
                    className="text-2xl hover:opacity-100 transition-opacity text-beige"
                  >
                    <i className={`fab fa-${social}`}></i>
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          <div className="border-t border-beige border-opacity-20 pt-8 text-center">
            <p className="opacity-80">
              © 2024 Beanery. All rights reserved. Crafted with ❤️ and ☕
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}