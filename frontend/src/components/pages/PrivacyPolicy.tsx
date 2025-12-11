import React from 'react';
import { Shield, Lock, Mail, Phone, MapPin } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className=" mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        </div>

        {/* Introduction */}
        <div className="mb-10">
          <p className="text-gray-700 leading-relaxed">
            At ITech Computers, we are committed to safeguarding the privacy and personal data of our customers, 
            partners, and visitors. This Privacy Policy outlines the types of information we collect, how it is used, 
            and the measures we take to protect it in compliance with applicable data protection laws.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-10">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Scope of the Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              This Privacy Policy applies to all personal information collected through our website, 
              in-store transactions, mobile communication (e.g., WhatsApp), email correspondence, 
              and any other interaction with iTech Computers.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="text-gray-700 mb-4">We may collect the following types of information:</p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">a. Personal Identifiable Information (PII):</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Full name</li>
                  <li>Contact number</li>
                  <li>Email address</li>
                  <li>Billing and shipping address</li>
                  <li>Purchase history and transaction details</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">b. Technical & Device Information:</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>IP address</li>
                  <li>Browser type and version</li>
                  <li>Device type and operating system</li>
                  <li>Usage data, including page views and site navigation behavior</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">c. Communications Data:</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Correspondence via phone, email, WhatsApp, or website forms</li>
                  <li>Feedback, inquiries, and service requests</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Purpose of Data Collection</h2>
            <p className="text-gray-700 mb-3">Your data is collected for legitimate business purposes, including but not limited to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Fulfilling product orders and service requests</li>
              <li>Processing payments and generating invoices</li>
              <li>Sending order confirmations and shipment tracking details</li>
              <li>Providing customer support and responding to queries</li>
              <li>Improving website functionality and user experience</li>
              <li>Marketing and promotional communication (only with your explicit consent)</li>
              <li>Compliance with applicable legal and regulatory obligations</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Legal Basis for Processing</h2>
            <p className="text-gray-700 mb-3">
              We process your personal data based on one or more of the following grounds:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Contractual necessity</strong> – to fulfil a purchase or service agreement</li>
              <li><strong>Consent</strong> – for marketing or optional communications</li>
              <li><strong>Legal compliance</strong> – to meet tax, warranty, and statutory obligations</li>
              <li><strong>Legitimate interest</strong> – to improve our services and enhance customer experience</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-3">
              We do not sell, rent, or trade your personal information. However, we may share data with the 
              following third parties under strict confidentiality and data protection obligations:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Authorized courier and logistics partners for delivery services</li>
              <li>Payment gateways and banking institutions for transaction processing</li>
              <li>IT service providers for website hosting, analytics, and technical support</li>
              <li>Government authorities or regulators as required under applicable law</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Protection & Security</h2>
            <p className="text-gray-700 mb-3">
              We implement a combination of physical, administrative, and technical security measures to 
              safeguard your information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Secure Socket Layer (SSL) encryption for all online transactions</li>
              <li>Access-controlled servers and restricted personnel access</li>
              <li>Regular data backups and vulnerability scans</li>
              <li>Monitoring for unauthorized access and cyber threats</li>
            </ul>
            <p className="text-gray-700 mt-3">
              Despite our best efforts, no data transmission or storage system can be guaranteed 100% secure. 
              However, we are committed to acting swiftly in the event of any data breach.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700">
              We retain your personal data only for as long as necessary to fulfil the purposes outlined 
              in this Policy or as required by applicable laws (e.g., tax or warranty obligations).
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights</h2>
            <p className="text-gray-700 mb-3">Subject to applicable law, you have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Access, review, and update your personal information</li>
              <li>Request correction or deletion of inaccurate data</li>
              <li>Withdraw consent at any time (where processing is based on consent)</li>
              <li>Object to or restrict processing in certain circumstances</li>
              <li>Request a copy of your personal data in a commonly used format</li>
            </ul>
            <p className="text-gray-700 mt-3">
              To exercise any of the above rights, please contact us using the details below.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies & Tracking Technologies</h2>
            <p className="text-gray-700 mb-3">Our website uses cookies and other tracking technologies to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Enhance website functionality</li>
              <li>Analyze website usage and traffic patterns</li>
              <li>Provide personalized content and marketing</li>
            </ul>
            <p className="text-gray-700 mt-3">
              You may choose to disable cookies via your browser settings, although this may limit certain features.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Third-Party Websites</h2>
            <p className="text-gray-700">
              Our website may contain links to third-party sites. iTech Computers is not responsible for 
              the privacy practices or content of such external websites. We encourage you to review their 
              privacy policies separately.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700">
              iTech Computers reserves the right to update or modify this Privacy Policy at any time. 
              Any material changes will be posted on this page with a revised effective date. 
              We recommend reviewing this page periodically.
            </p>
          </section>

          {/* Section 12 - Contact */}
          <section className="bg-blue-50 rounded-xl p-6 mt-12">
            <div className="flex items-start space-x-3 mb-4">
              <Lock className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">12. Contact Us</h2>
                <p className="text-gray-700">
                  For any questions, requests, or concerns related to this Privacy Policy or the handling 
                  of your personal data, please contact:
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">itechcomputersno7@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                <Phone className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Phone / WhatsApp</p>
                  <p className="font-medium">9876543210</p>
                </div>
              </div>

              <div className="md:col-span-2 flex items-start space-x-3 p-3 bg-white rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">
                    iTech Computers, RBT Mall, Meyyanur Bypass Rd, opp. to iplanet, 
                    Meyyanur, Salem, Tamil Nadu 636004
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;