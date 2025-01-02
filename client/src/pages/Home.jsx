import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

export default function Home() {
  return (
    <div className="px-4 py-12 max-w-2xl mx-auto">
      {/* Carousel */}
      <div className="mb-8">
        <Carousel
          showArrows={true}
          showThumbs={false}
          infiniteLoop={true}
          autoPlay={true}
          interval={5000}
          dynamicHeight={true}
        > 
          <div>
            <img src="https://placehold.co/600x400/png" alt="Slide 1" />
          </div>
          <div>
            <img src="https://placehold.co/600x400/png" alt="Slide 2" />
          </div>
          <div>
            <img src="https://placehold.co/600x400/png" alt="Slide 3" />
          </div>
        </Carousel>
      </div>

      {/* Description */}
      <p className="mb-4 text-slate-700">
        This is a full-stack web application built with the MERN (MongoDB,
        Express, React, Node.js) stack. It includes authentication features that
        allow users to sign up, log in, and log out, and provides access to
        protected routes only for authenticated users.
      </p>
      <p className="mb-4 text-slate-700">
        The front-end of the application is built with React and uses React
        Router for client-side routing. The back-end is built with Node.js and
        Express, and uses MongoDB as the database. Authentication is implemented
        using JSON Web Tokens (JWT).
      </p>
      <p className="mb-4 text-slate-700">
        This application is intended as a starting point for building full-stack
        web applications with authentication using the MERN stack. Feel free to
        use it as a template for your own projects!
      </p>
    </div>
  );
}
