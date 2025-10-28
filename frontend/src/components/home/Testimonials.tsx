
import React from 'react';
import StarIcon from '../icons/StarIcon';

const testimonials = [
  {
    name: 'Alex Johnson',
    quote: 'The PC builder was a breeze to use! I got my dream gaming rig delivered in just a few days. The performance is insane!',
    rating: 5,
    avatar: 'https://placehold.co/100x100/e0e7ff/4338ca?text=AJ',
  },
  {
    name: 'Samantha Lee',
    quote: 'Incredible selection of components and the best prices I could find online. Their customer support was also super helpful.',
    rating: 5,
    avatar: 'https://placehold.co/100x100/e0e7ff/4338ca?text=SL',
  },
  {
    name: 'Mike Davis',
    quote: 'My go-to store for all my hardware needs. Fast shipping and everything always arrives perfectly packaged.',
    rating: 5,
    avatar: 'https://placehold.co/100x100/e0e7ff/4338ca?text=MD',
  },
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">What Our Customers Say</h2>
          <p className="text-gray-600 mt-2">We're trusted by thousands of builders and gamers.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <img src={testimonial.avatar} alt={testimonial.name} className="w-14 h-14 rounded-full" />
                <div className="ml-4">
                  <p className="font-semibold text-gray-800">{testimonial.name}</p>
                  <div className="flex mt-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <blockquote className="text-gray-600 italic">"{testimonial.quote}"</blockquote>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
