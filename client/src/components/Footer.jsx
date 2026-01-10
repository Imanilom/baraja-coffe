import React from "react";
import { FaYoutube, FaTwitter, FaInstagram, FaLinkedin, FaPhoneAlt, FaWhatsapp } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-100 py-8 text-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Logo and Copyright */}
        <div className="flex flex-col items-start">
          <img
            src="https://placehold.co/120x40/png"
            alt="Baraja Coffee Logo"
            className="mb-4"
          />
          <p className="text-sm">© 2023 Baraja Coffee, All Rights Reserved</p>
        </div>

        {/* Customer Center */}
        <div>
          <h5 className="font-semibold text-lg mb-2">Customer Center</h5>
          <p className="text-sm">
            Cirebon<br />
            Jl. Kedrunan No.11, Kesenden,<br />
            Kec. Kejaksan, Kota Cirebon,<br />
            Jawa Barat
          </p>
          <p className="text-sm mt-2 flex items-center">
            <FaPhoneAlt size={16} className="mr-4" />
            0856-2323-231
          </p>
        </div>

        {/* Consumer Complaints */}
        <div>
          <h5 className="font-semibold text-lg mb-2">
            Consumer Complaints Service Contact Information
          </h5>
          <p className="text-sm">
            Directorate General of Consumer Protection and Trade Compliance, Ministry of Trade of the Republic of Indonesia
          </p>
          <p className="text-sm mt-2 flex items-center">
            <FaWhatsapp size={24} className="mr-4" />
            Ditjen PKTN: 0853-1111-1010
          </p>
        </div>
      </div>

      {/* Social Media Icons */}
      <div className="mt-6 text-center">
        <div className="flex justify-center space-x-4">
          <a href="#" className="text-gray-600 hover:text-green-600">
            <FaYoutube size={24} />
          </a>
          <a href="#" className="text-gray-600 hover:text-green-600">
            <FaTwitter size={24} />
          </a>
          <a href="#" className="text-gray-600 hover:text-green-600">
            <FaInstagram size={24} />
          </a>
          <a href="#" className="text-gray-600 hover:text-green-600">
            <FaLinkedin size={24} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;