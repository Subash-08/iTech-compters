import React from 'react';
import { Shield, Settings, AlertCircle, Clock, FileText } from 'lucide-react';

const WarrantyPolicy = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Warranty Policy</h1>
          <p className="text-lg text-gray-600">Comprehensive protection for your iTech Computers products</p>
        </div>

        {/* Introduction */}
        <div className="mb-10">
          <p className="text-gray-700 leading-relaxed">
            At iTech Computers, we stand behind the quality of our products with comprehensive warranty coverage. 
            This policy outlines the warranty terms, conditions, and procedures to ensure your complete satisfaction 
            and peace of mind.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-10">
          {/* Standard Warranty Coverage */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Standard Warranty Coverage</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center space-x-3 mb-4">
                  <Settings className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Computer Hardware</h3>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Desktop PCs & Workstations: 3 years</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Laptops: 2 years</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Monitors: 3 years</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center space-x-3 mb-4">
                  <Settings className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Peripherals & Components</h3>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Keyboards & Mice: 1 year</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr=2 flex-shrink-0"></div>
                    <span className="text-gray-700">Storage Devices: 2 years</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Power Supplies: 2-3 years</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* What's Covered */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What's Covered Under Warranty</h2>
            <div className="bg-gray-50 rounded-xl p-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Manufacturing defects in materials and workmanship</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Hardware component failures under normal usage</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt=2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Performance issues consistent with product specifications</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">Dead-on-arrival (DOA) products reported within 7 days</span>
                </li>
              </ul>
            </div>
          </section>

          {/* What's Not Covered */}
          <section>
            <div className="flex items-start space-x-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">What's Not Covered</h2>
                <div className="mt-4 space-y-3">
                  <p className="text-gray-700">• Damage caused by accidents, drops, liquid spills, or power surges</p>
                  <p className="text-gray-700">• Issues resulting from improper installation, maintenance, or unauthorized modifications</p>
                  <p className="text-gray-700">• Normal wear and tear, cosmetic damage, or consumable parts</p>
                  <p className="text-gray-700">• Software issues, viruses, or operating system problems</p>
                  <p className="text-gray-700">• Products with removed or tampered serial numbers</p>
                  <p className="text-gray-700">• Damage from environmental factors (extreme temperatures, moisture, etc.)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Warranty Claim Process */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Warranty Claim Process</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Support</h3>
                  <p className="text-gray-700">
                    Report the issue to our support team via phone, email, or WhatsApp. Provide your invoice 
                    number and product serial number.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Technical Diagnosis</h3>
                  <p className="text-gray-700">
                    Our technical team will diagnose the issue and determine if it's covered under warranty. 
                    You may be asked to provide photos/videos of the issue.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-blue-600">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Resolution</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li><strong>Repair:</strong> Faulty parts will be repaired or replaced</li>
                    <li><strong>Replacement:</strong> If repair is not feasible, product will be replaced</li>
                    <li><strong>Service Time:</strong> Typical repair time is 7-14 working days</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section className="bg-amber-50 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Important Notes</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-amber-600 mt-1" />
                <p className="text-gray-700">
                  <strong>Warranty Period:</strong> Starts from the date of purchase as shown on your invoice.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-amber-600 mt-1" />
                <p className="text-gray-700">
                  <strong>Documentation:</strong> Always retain your original purchase invoice and warranty card.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-1" />
                <p className="text-gray-700">
                  <strong>Service Charges:</strong> Out-of-warranty repairs are available at standard service rates.
                </p>
              </div>
            </div>
          </section>

          {/* Extended Warranty */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Extended Warranty Options</h2>
            <div className="bg-blue-50 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                Extend your peace of mind with our extended warranty plans available for most products:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">+1 Year</div>
                  <p className="text-sm text-gray-600">Extended Coverage</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">+2 Years</div>
                  <p className="text-sm text-gray-600">Premium Coverage</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">On-site</div>
                  <p className="text-sm text-gray-600">Service Available</p>
                </div>
              </div>
              <p className="text-gray-700 mt-4 text-sm">
                Contact our sales team for pricing and availability of extended warranty options.
              </p>
            </div>
          </section>

          {/* Contact Support */}
          <section className="bg-gray-50 rounded-xl p-6 mt-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Warranty Support</h2>
            <div className="space-y-6">
              <div>
                <p className="text-gray-700 mb-3">
                  For warranty claims or inquiries, please contact our dedicated support team:
                </p>
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-semibold text-gray-900">iTech Computers Warranty Department</p>
                  <div className="mt-3 space-y-2">
                    <p className="text-gray-700">📞 Phone / WhatsApp: <strong>6382928973</strong></p>
                    <p className="text-gray-700">📧 Email: <strong>itechcomputersno7@gmail.com</strong></p>
                  </div>
                  <p className="text-gray-700 mt-3">
                    <strong>Address:</strong> iTech Computers, RBT Mall, Meyyanur Bypass Rd, opp. to iplanet, 
                    Meyyanur, Salem, Tamil Nadu 636004
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-700 italic">
                  At iTech Computers, we're committed to ensuring your complete satisfaction. 
                  Our warranty policy is designed to provide you with reliable protection and 
                  exceptional service throughout your ownership experience.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default WarrantyPolicy;