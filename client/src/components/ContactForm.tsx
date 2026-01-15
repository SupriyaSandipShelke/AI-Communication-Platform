import { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => void;
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  company?: string;
  phone?: string;
}

export default function ContactForm({ onSubmit }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    company: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, you would send this to your backend
      if (onSubmit) {
        onSubmit(formData);
      }

      // For demo purposes, we'll just show success
      setSubmitStatus('success');
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          company: '',
          phone: ''
        });
        setSubmitStatus('idle');
      }, 3000);

    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const inputStyle = (hasError: boolean) => ({
    width: '100%',
    padding: '16px',
    borderRadius: '8px',
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(255,255,255,0.3)'}`,
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
  });

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500'
  };

  const errorStyle = {
    color: '#ef4444',
    fontSize: '12px',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  if (submitStatus === 'success') {
    return (
      <div style={{
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center'
      }}>
        <CheckCircle size={48} color="#10b981" style={{ marginBottom: '16px' }} />
        <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '8px' }}>
          Message Sent Successfully!
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
          Thank you for contacting us. We'll get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Your full name"
            style={inputStyle(!!errors.name)}
            disabled={isSubmitting}
          />
          {errors.name && (
            <div style={errorStyle}>
              <AlertCircle size={12} />
              {errors.name}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="your.email@example.com"
            style={inputStyle(!!errors.email)}
            disabled={isSubmitting}
          />
          {errors.email && (
            <div style={errorStyle}>
              <AlertCircle size={12} />
              {errors.email}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>
            Company
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
            placeholder="Your company name"
            style={inputStyle(false)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label style={labelStyle}>
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            style={inputStyle(false)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>
          Subject *
        </label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => handleInputChange('subject', e.target.value)}
          placeholder="What's this about?"
          style={inputStyle(!!errors.subject)}
          disabled={isSubmitting}
        />
        {errors.subject && (
          <div style={errorStyle}>
            <AlertCircle size={12} />
            {errors.subject}
          </div>
        )}
      </div>

      <div>
        <label style={labelStyle}>
          Message *
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          placeholder="Tell us more about your inquiry..."
          rows={6}
          style={{
            ...inputStyle(!!errors.message),
            resize: 'vertical',
            minHeight: '120px'
          }}
          disabled={isSubmitting}
        />
        {errors.message && (
          <div style={errorStyle}>
            <AlertCircle size={12} />
            {errors.message}
          </div>
        )}
      </div>

      {submitStatus === 'error' && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          color: '#ef4444',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          Failed to send message. Please try again or contact us directly.
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          padding: '16px 24px',
          background: isSubmitting ? 'rgba(74, 222, 128, 0.5)' : '#4ade80',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!isSubmitting) {
            e.currentTarget.style.background = '#22c55e';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSubmitting) {
            e.currentTarget.style.background = '#4ade80';
          }
        }}
      >
        {isSubmitting ? (
          <>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Sending...
          </>
        ) : (
          <>
            <Send size={20} />
            Send Message
          </>
        )}
      </button>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
}