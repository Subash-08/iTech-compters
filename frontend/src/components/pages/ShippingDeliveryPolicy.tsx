import React from 'react';
import { Truck, Package, Clock, AlertTriangle } from 'lucide-react';

const ShippingDeliveryPolicy = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping & Delivery Policy</h1>
        </div>

        {/* Introduction */}
        <div className="mb-10">
          <p className="text-gray-700 leading-relaxed">
            At iTech Computers, we are committed to ensuring your orders are delivered promptly, 
            safely, and efficiently.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-10">
          {/* Delivery Charges */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Delivery Charges</h2>
            <div className="bg-gray-50 rounded-xl p-6">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                  <span className="text-gray-700">
                    <strong>Free delivery</strong> is available on all orders with a total value of ₹1,000 or above.
                  </span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                  <span className="text-gray-700">
                    A flat delivery fee of <strong>₹50</strong> will apply to orders below ₹1,000.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Shipping Partners */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Shipping Partners</h2>
            <p className="text-gray-700 mb-4">
              We partner with reliable and professional courier services, including:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Professional Couriers</h3>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">ST Couriers</h3>
                </div>
              </div>
            </div>
            <p className="text-gray-700 mt-4">
              These trusted logistics providers help ensure timely and secure delivery across regions.
            </p>
          </section>

          {/* Order Processing */}
          <section>
            <div className="flex items-start space-x-3 mb-4">
              <Clock className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Order Processing & Dispatch</h2>
                <div className="mt-4 space-y-3">
                  <p className="text-gray-700">
                    • All orders are typically processed and dispatched within <strong>1–2 working days</strong> 
                    following order confirmation and payment.
                  </p>
                  <p className="text-gray-700">
                    • Once shipped, you will receive a <strong>tracking ID and link via WhatsApp</strong>, 
                    allowing you to monitor your shipment in real-time.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Delivery Timelines */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Estimated Delivery Timelines</h2>
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Within Tamil Nadu</h3>
                  <p className="text-gray-700">Estimated delivery within <strong>2–4 working days</strong>.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Other South Indian locations</h3>
                  <p className="text-gray-700">
                    Delivery may take <strong>3–6 working days</strong>, depending on the destination 
                    PIN code and courier service availability.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Transit Issues */}
          <section>
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Transit Damage or Delays</h2>
                <p className="text-gray-700 mt-3">
                  We take extensive care in packaging your order to ensure it reaches you in perfect condition.
                </p>
                <p className="text-gray-700 mt-3">
                  In the unlikely event of:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1 mt-2">
                  <li>Transit damage</li>
                  <li>Missing items</li>
                  <li>Unexpected delivery delays</li>
                </ul>
                <p className="text-gray-700 mt-3">
                  Please notify our support team <strong>within 24 hours of delivery</strong>. 
                  Timely reporting helps us take immediate action with the courier and initiate appropriate resolution.
                </p>
              </div>
            </div>
          </section>

          {/* Support Section */}
          <section className="bg-blue-50 rounded-xl p-6 mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Delivery Support</h2>
            <p className="text-gray-700 mb-6">
              For any questions or issues related to your shipment, you may contact our support team:
            </p>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="font-semibold text-gray-900">Contact Information</p>
                <div className="mt-3 space-y-2">
                  <p className="text-gray-700">📞 Phone / WhatsApp: <strong>6382928973</strong></p>
                  <p className="text-gray-700">📧 Email: <strong>itechcomputersno7@gmail.com</strong></p>
                </div>
                <p className="text-gray-700 mt-3">
                  <strong>Address:</strong> iTech Computers, RBT Mall, Meyyanur Bypass Rd, opp. to iplanet, 
                  Meyyanur, Salem, Tamil Nadu 636004
                </p>
              </div>
              
              <p className="text-gray-700">
                Our customer service representatives are available during business hours to assist you 
                with delivery tracking, issue resolution, or order status updates.
              </p>
              
              <div className="pt-4 border-t border-blue-100">
                <p className="text-gray-700 italic">
                  Thank you for choosing iTech Computers. We appreciate your trust and are committed 
                  to delivering excellence at every step.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShippingDeliveryPolicy;