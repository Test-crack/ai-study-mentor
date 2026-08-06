import React, { useState } from 'react';
import {
  User, Mail, Phone, MessageSquare,
  CheckCircle, X, UserRound, ArrowLeft, AlertCircle
} from 'lucide-react';
import testcrackLogo from '@/assets/testcrack-logo.svg';

interface FormData {
  name: string;
  email: string;
  whatsapp: string;
  enquiry: string;
}

// We use this to keep track of which fields have errors
interface FormErrors {
  name?: string;
  email?: string;
  whatsapp?: string;
  enquiry?: string;
}

const Contactpage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    whatsapp: '',
    enquiry: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showAlert, setShowAlert] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // 1. Name Validation (at least 3 chars)
    if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters long.';
      isValid = false;
    }

    // 2. Email Validation (standard regex pattern)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
      isValid = false;
    }

    // 3. STRICT WhatsApp Validation (exactly 10 digits)
    // This removes everything except numbers to count them
    const digitCount = formData.whatsapp.replace(/\D/g, '').length;
    if (digitCount !== 10) {
      newErrors.whatsapp = 'Please enter exactly 10 digits for your WhatsApp number.';
      isValid = false;
    }

    // 4. Enquiry Validation (at least 15 chars)
    if (formData.enquiry.trim().length < 15) {
      newErrors.enquiry = 'Please provide a bit more detail (minimum 15 characters).';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear the error for this specific field as the user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Run our custom validation before doing anything else
    if (validateForm()) {
      console.log('Form is valid! Submitting:', formData);
      
      // Show the success alert
      setShowAlert(true);
      
      // Clear the form
      setFormData({ name: '', email: '', whatsapp: '', enquiry: '' });
      setErrors({});
    } else {
      console.log('Form has errors, submission blocked.');
    }
  };

  const handleGoBack = () => {
    window.location.href = '/'; 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-teal-50 pt-28 pb-12 px-4 sm:px-6 lg:px-8 font-sans flex flex-col items-center">
      
     {/* Navigation */}
<nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transform-gpu">
  {/* Changed max-w-7xl mx-auto to w-full */}
  <div className="w-full px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      
      {/* Logo Section - Now stays at the far left */}
      <div className="flex items-center space-x-2">
        <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain" />
        <span className="text-xl font-bold text-brand-teal-700">
          TestCrack
        </span>
      </div>

    
      
    </div>
  </div>
</nav>

      <div className="w-full max-w-lg">
        
        {/* TOP BAR: BACK BUTTON */}
        <div className="mb-6">
          <button 
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-teal-700 border border-slate-200 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-brand-teal-800  hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-brand-teal-500 focus:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Landing Page
          </button>
        </div>

        {/* MAIN FORM CARD */}
        <div className="w-full bg-white rounded-3xl shadow-2xl shadow-brand-teal-500/10 overflow-hidden border border-slate-100/50">
          <div className="bg-gradient-to-br from-brand-teal-600 to-brand-teal-800 px-8 py-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
            
            <h2 className="text-3xl font-extrabold text-white tracking-tight relative z-10">
              Get in Touch
            </h2>
            <p className="mt-3 text-brand-teal-100 text-sm max-w-xs mx-auto relative z-10">
              Fill out the form below and our team will get back to you shortly.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="px-8 py-8 space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 ${errors.name ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`block w-full pl-11 pr-3 py-3 border bg-slate-50 rounded-xl outline-none transition-all sm:text-sm ${
                    errors.name 
                      ? 'border-red-400 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                      : 'border-slate-200 focus:bg-white focus:ring-2 focus:ring-brand-teal-600 focus:border-brand-teal-600'
                  }`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${errors.email ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-11 pr-3 py-3 border bg-slate-50 rounded-xl outline-none transition-all sm:text-sm ${
                    errors.email 
                      ? 'border-red-400 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                      : 'border-slate-200 focus:bg-white focus:ring-2 focus:ring-brand-teal-600 focus:border-brand-teal-600'
                  }`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.email}
                </p>
              )}
            </div>

            {/* WhatsApp Field */}
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-semibold text-slate-700 mb-1.5">
                WhatsApp Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className={`h-5 w-5 ${errors.whatsapp ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input
                  type="tel"
                  name="whatsapp"
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className={`block w-full pl-11 pr-3 py-3 border bg-slate-50 rounded-xl outline-none transition-all sm:text-sm ${
                    errors.whatsapp 
                      ? 'border-red-400 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                      : 'border-slate-200 focus:bg-white focus:ring-2 focus:ring-brand-teal-600 focus:border-brand-teal-600'
                  }`}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              {errors.whatsapp && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.whatsapp}
                </p>
              )}
            </div>

            {/* Enquiry Field */}
            <div>
              <label htmlFor="enquiry" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Your Enquiry
              </label>
              <div className="relative">
                <div className="absolute top-3.5 left-3.5 pointer-events-none">
                  <MessageSquare className={`h-5 w-5 ${errors.enquiry ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <textarea
                  name="enquiry"
                  id="enquiry"
                  rows={4}
                  value={formData.enquiry}
                  onChange={handleChange}
                  className={`block w-full pl-11 pr-3 py-3 border bg-slate-50 rounded-xl outline-none transition-all sm:text-sm resize-none ${
                    errors.enquiry 
                      ? 'border-red-400 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                      : 'border-slate-200 focus:bg-white focus:ring-2 focus:ring-brand-teal-600 focus:border-brand-teal-600'
                  }`}
                  placeholder="How can we help you?"
                />
              </div>
              {errors.enquiry && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.enquiry}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-brand-teal-200 text-sm font-bold text-white bg-brand-teal-600 hover:bg-brand-teal-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal-500 transition-all duration-200"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>

      {/* RESPONSIVE CUSTOM ALERT BOX (MODAL) */}
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowAlert(false)}
          />
          
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full relative z-10 transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowAlert(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-1 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex flex-col items-center text-center mt-2">
              <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mb-5 border-[6px] border-green-100/50">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Thank you for reaching out. We have received your enquiry and will get back to you via email or WhatsApp shortly.
              </p>
              <button
                onClick={() => setShowAlert(false)}
                className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Contactpage;