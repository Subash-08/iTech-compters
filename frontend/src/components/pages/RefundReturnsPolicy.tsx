import React from 'react';
import { RefreshCw, AlertCircle, Clock, CheckCircle } from 'lucide-react';

const RefundReturnsPolicy = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Refund & Returns Policy</h1>
        </div>

        {/* Introduction */}
        <div className="mb-10">
          <p className="text-gray-700 leading-relaxed">
            At iTech Computers, we are committed to providing our customers with high-quality products 
            and reliable services. We understand that, on occasion, a return or refund may be necessary. 
            This policy outlines the terms under which returns, exchanges, and refunds will be accepted.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-10">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. General Return Policy</h2>
            <p className="text-gray-700 mb-4">
              You may be eligible to return or exchange a product under the following conditions:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>The product delivered is damaged, defective, or not in conformity with the order placed.</li>
              <li>A wrong item or incomplete shipment was received.</li>
              <li>The issue is reported to us within 24 hours of receipt, supported with photographic/video evidence.</li>
              <li>The product is returned unused, in original condition, and accompanied by all original packaging, accessories, manuals, warranty cards, and the invoice.</li>
            </ul>
          </section>

          {/* Section 2 - Non-Returnable Items */}
          <section>
            <div className="flex items-start space-x-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">2. Non-Returnable Items</h2>
                <p className="text-gray-700 mt-2">
                  Returns or refunds will not be accepted under the following circumstances:
                </p>
              </div>
            </div>
            
            <ul className="list-disc pl-9 text-gray-700 space-y-2">
              <li>Products damaged due to improper handling, electrical surges, liquid exposure, physical damage, or unauthorized modifications.</li>
              <li>Software licenses opened or used accessories, consumables, or OEM-packaged products.</li>
              <li>Custom-built desktops, configured on customer request, unless a verified hardware defect exists.</li>
              <li>Items returned without original packaging, barcode/serial numbers, or invoice.</li>
              <li>Return requests initiated after 24 hours from delivery, except where covered under manufacturer warranty.</li>
            </ul>
          </section>

          {/* Section 3 - Return Process */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Return Process</h2>
            <p className="text-gray-700 mb-6">To initiate a return, please follow the steps below:</p>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Our Support Team</h3>
                  <p className="text-gray-700">
                    Notify us via phone, WhatsApp, or email within 24 hours of product receipt. 
                    Include your invoice number and clear evidence of the issue.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Assessment & Authorization</h3>
                  <p className="text-gray-700">
                    Our technical support team will assess the request. If eligible, a return or exchange authorization will be issued.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-blue-600">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Return Logistics</h3>
                  <p className="text-gray-700">
                    Products may be returned to our store or, where applicable, collected via our logistics partners. 
                    Customers are responsible for safely packing the return items unless instructed otherwise.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-blue-600">4</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Inspection & Resolution</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>For approved replacements, the new item will be dispatched after verification.</li>
                    <li>For approved refunds, the amount will be credited to the original mode of payment within 7–10 business days after inspection.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 - Cancellation Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cancellation Policy</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-3">
              <li>Order cancellations are accepted only before the order is processed or dispatched.</li>
              <li>Once dispatched, cancellations are not permitted, and the transaction will be governed by this Return Policy.</li>
              <li>Custom or special-order items (e.g., high-performance PCs, enterprise-grade hardware) are strictly non-cancellable once the order is confirmed.</li>
            </ul>
          </section>

          {/* Section 5 - Refund Timelines */}
          <section>
            <div className="flex items-start space-x-3 mb-4">
              <Clock className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">5. Refund Timelines</h2>
                <p className="text-gray-700 mt-2">
                  Refunds, once approved, are typically processed within 7 to 10 working days. 
                  Processing time may vary depending on the payment gateway, bank, or mode of payment originally used.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 - Customer Support */}
          <section className="bg-blue-50 rounded-xl p-6 mt-8">
            <div className="flex items-start space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Customer Support</h2>
                <p className="text-gray-700 mt-2">
                  For any queries or to initiate a return, please contact:
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="font-semibold text-gray-900">iTech Computers</p>
                <p className="text-gray-700 mt-1">📞 Phone / WhatsApp: +91 63829 28973</p>
                <p className="text-gray-700">📧 Email: itechcomputersno7@gmail.com</p>
                <p className="text-gray-700 mt-2">
                  iTech Computers, RBT Mall, Meyyanur Bypass Rd, opp. to iplanet, 
                  Meyyanur, Salem, Tamil Nadu 636004
                </p>
              </div>
              
              <p className="text-gray-700 italic">
                We appreciate your trust in iTech Computers and remain committed to ensuring your 
                satisfaction throughout your experience with us.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RefundReturnsPolicy;