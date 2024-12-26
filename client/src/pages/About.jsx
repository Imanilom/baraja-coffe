import React from 'react';
import { Link } from 'react-scroll';

export default function About() {
  return (
    <div className="px-4 py-12 max-w-6xl mx-auto">
      {/* Header Section with Navigation */}
      <nav className="flex justify-center space-x-4 mb-8">
        <Link
          to="our-story"
          smooth={true}
          duration={500}
          className="cursor-pointer text-slate-800 hover:text-green-500"
        >
          Our Story
        </Link>
        <Link
          to="our-environment"
          smooth={true}
          duration={500}
          className="cursor-pointer text-slate-800 hover:text-green-500"
        >
          Our Environment
        </Link>
        <Link
          to="our-team"
          smooth={true}
          duration={500}
          className="cursor-pointer text-slate-800 hover:text-green-500"
        >
          Our Team
        </Link>
      </nav>

      {/* Section 1: Our Story */}
      <section
        id="our-story"
        className="flex flex-col md:flex-row items-center mb-16 scroll-mt-16"
      >
        <div className="flex-1 p-4">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Our Story</h2>
          <p className="text-slate-700">
            Discover the journey of our brand from humble beginnings to where we
            are today. We focus on delivering the best experiences to our
            customers.
          </p>
        </div>
        <img
          src="https://placehold.co/600x400"
          alt="Our Story"
          className="flex-1 rounded-md"
        />
      </section>

      {/* Section 2: Our Environment */}
      <section
        id="our-environment"
        className="flex flex-col md:flex-row items-center mb-16 scroll-mt-16"
      >
        <img
          src="https://placehold.co/600x400"
          alt="Our Environment"
          className="flex-1 rounded-md"
        />
        <div className="flex-1 p-4">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Our Environment
          </h2>
          <p className="text-slate-700">
            Learn about our sustainable practices and how we care for the
            environment. We are committed to reducing our carbon footprint.
          </p>
        </div>
      </section>

      {/* Section 3: Our Team */}
      <section
        id="our-team"
        className="flex flex-col md:flex-row items-center mb-16 scroll-mt-16"
      >
        <div className="flex-1 p-4">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Our Team</h2>
          <p className="text-slate-700">
            Meet the amazing people behind our success. Each member of our team
            brings unique talents to the table, making everything possible.
          </p>
        </div>
        <img
          src="https://placehold.co/600x400"
          alt="Our Team"
          className="flex-1 rounded-md"
        />
      </section>
    </div>
  );
}
