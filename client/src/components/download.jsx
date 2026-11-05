import React from "react";

const Download = () => {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto flex flex-col md:flex-row items-center">
        {/* Text Section */}
        <div className="w-full md:w-1/2 text-center md:text-left px-4">
          <h2 className="text-green-800 font-bold text-4xl mb-4">
            One click away coffee! <br />
            Fast and easy with extra benefits
          </h2>
          <p className="text-gray-700 text-lg mb-4">
            Enjoy the best coffee experience, promos, and many more! <br />
            Order ahead in our app and skip the queue. <br />
            Isn’t it easy?
          </p>
          <p className="font-semibold text-lg mb-4">Get the App</p>
          <div className="flex justify-center md:justify-start space-x-4">
            <a href="#" target="_blank" rel="noopener noreferrer">
              <img
                src="https://via.placeholder.com/150x50?text=Google+Play"
                alt="Google Play"
                className="h-12"
              />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <img
                src="https://via.placeholder.com/150x50?text=App+Store"
                alt="App Store"
                className="h-12"
              />
            </a>
          </div>
        </div>

        {/* Image Section */}
        <div className="w-full md:w-1/2 mt-8 md:mt-0 relative px-4">
          <div className="relative">
            <div className="absolute top-10 left-6 w-80 h-80 bg-green-300 rounded-full -z-10"></div>
            <img
              src="https://via.placeholder.com/300x600?text=Mockup+1"
              alt="Mobile App Mockup"
              className="rounded-lg shadow-lg"
            />
            <img
              src="https://via.placeholder.com/300x600?text=Mockup+2"
              alt="Mobile App Mockup"
              className="absolute top-10 left-40 w-2/5 rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Download;
