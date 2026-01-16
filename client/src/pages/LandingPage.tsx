import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ContactForm from '../components/ContactForm';
import { 
  MessageSquare, 
  Users, 
  Zap, 
  Shield, 
  Globe, 
  Smartphone,
  ChevronDown,
  Menu,
  X,
  Star,
  ArrowRight,
  Play,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const navigate = useNavigate();

  const useCases = [
    {
      title: "Team Communication",
      description: "Real-time messaging for teams with group chat capabilities",
      icon: "👥",
      features: ["Group Chats", "Real-time Messaging", "Member Management"]
    },
    {
      title: "Project Collaboration", 
      description: "Coordinate projects with instant communication",
      icon: "💼",
      features: ["Message History", "Typing Indicators", "Online Status"]
    },
    {
      title: "Customer Support",
      description: "Provide instant support with AI-powered assistance",
      icon: "🎧",
      features: ["AI Chatbot", "Priority Inbox", "Smart Analytics"]
    },
    {
      title: "Social Networking",
      description: "Connect with friends and family instantly",
      icon: "🌐",
      features: ["Status Updates", "Group Forums", "Voice Messages"]
    }
  ];

  const platforms = [
    {
      name: "Real-time Messaging",
      description: "WebSocket-powered instant communication",
      icon: "⚡",
      features: ["Instant Delivery", "Read Receipts", "Typing Indicators"]
    },
    {
      name: "Group Management",
      description: "Create and manage group conversations",
      icon: "👥",
      features: ["Add/Remove Members", "Admin Controls", "Group Profiles"]
    },
    {
      name: "AI Assistant",
      description: "Intelligent chatbot for automated responses",
      icon: "🤖",
      features: ["Smart Replies", "Context Awareness", "24/7 Availability"]
    },
    {
      name: "Analytics Dashboard",
      description: "Track communication patterns and insights",
      icon: "📊",
      features: ["Message Analytics", "Priority Inbox", "Custom Reports"]
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "₹0",
      description: "Perfect for individuals and small teams",
      features: [
        "Unlimited messages",
        "Group chats",
        "Real-time messaging",
        "AI chatbot assistant",
        "Message history",
        "Community support"
      ],
      popular: false
    },
    {
      name: "Pro",
      price: "₹499/month",
      description: "For growing businesses and teams",
      features: [
        "Everything in Free",
        "Priority inbox",
        "Advanced analytics",
        "Voice messages",
        "Custom themes",
        "Priority support",
        "Export data"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Everything in Pro",
        "On-premise deployment",
        "Custom integrations",
        "Dedicated support",
        "SLA guarantee",
        "Custom branding",
        "Advanced security"
      ],
      popular: false
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Navigation Header */}
      <nav style={{
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={32} color="white" />
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            CommHub
          </h1>
        </div>

        {/* Desktop Navigation */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '32px',
          '@media (max-width: 768px)': { display: 'none' }
        }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'usecases' ? null : 'usecases')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '8px 0'
              }}
            >
              Use Cases <ChevronDown size={16} />
            </button>
            {activeDropdown === 'usecases' && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                padding: '16px',
                minWidth: '300px',
                zIndex: 1000
              }}>
                {useCases.map((useCase, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '20px' }}>{useCase.icon}</span>
                      <h4 style={{ margin: 0, color: '#1f2937' }}>{useCase.title}</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                      {useCase.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'platform' ? null : 'platform')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '8px 0'
              }}
            >
              Platform <ChevronDown size={16} />
            </button>
            {activeDropdown === 'platform' && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                padding: '16px',
                minWidth: '300px',
                zIndex: 1000
              }}>
                {platforms.map((platform, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '20px' }}>{platform.icon}</span>
                      <h4 style={{ margin: 0, color: '#1f2937' }}>{platform.name}</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                      {platform.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <a href="#pricing" style={{ color: 'white', textDecoration: 'none', fontSize: '16px' }}>
            Pricing
          </a>
          <a href="#forum" style={{ color: 'white', textDecoration: 'none', fontSize: '16px' }}>
            Forum
          </a>
          <a href="#contact" style={{ color: 'white', textDecoration: 'none', fontSize: '16px' }}>
            Contact us
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to="/login"
            style={{
              padding: '8px 24px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.3)',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            SIGN IN
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              '@media (max-width: 768px)': { display: 'block' }
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: 0,
          right: 0,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          padding: '24px',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <a href="#usecases" style={{ color: '#1f2937', textDecoration: 'none', fontSize: '18px' }}>
              Use Cases
            </a>
            <a href="#platform" style={{ color: '#1f2937', textDecoration: 'none', fontSize: '18px' }}>
              Platform
            </a>
            <a href="#pricing" style={{ color: '#1f2937', textDecoration: 'none', fontSize: '18px' }}>
              Pricing
            </a>
            <a href="#forum" style={{ color: '#1f2937', textDecoration: 'none', fontSize: '18px' }}>
              Forum
            </a>
            <a href="#contact" style={{ color: '#1f2937', textDecoration: 'none', fontSize: '18px' }}>
              Contact us
            </a>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section style={{
        padding: '80px 24px',
        textAlign: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '24px',
          lineHeight: '1.1'
        }}>
          AI-Powered <span style={{ color: '#4ade80' }}>Real-Time</span><br />
          <span style={{ color: '#4ade80' }}>Communication</span> Platform
        </h1>
        
        <div style={{
          width: '4px',
          height: '60px',
          background: '#4ade80',
          margin: '0 auto 24px'
        }} />
        
        <p style={{
          fontSize: '1.5rem',
          color: 'rgba(255,255,255,0.9)',
          marginBottom: '16px'
        }}>
          WhatsApp-like messaging with intelligent AI assistance
        </p>
        
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(45deg, #f59e0b, #d97706)',
          padding: '8px 16px',
          borderRadius: '20px',
          marginBottom: '48px'
        }}>
          <span style={{ color: 'white', fontWeight: 'bold' }}>
            ⭐ Modern • Fast • Intelligent
          </span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginBottom: '80px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '16px 32px',
              background: '#4ade80',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Get Started <ArrowRight size={20} />
          </button>
          
          <button
            onClick={() => setShowDemoModal(true)}
            style={{
              padding: '16px 32px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Play size={20} /> Watch Demo
          </button>
        </div>

        {/* Feature Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginTop: '80px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
            transition: 'transform 0.3s, box-shadow 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(74, 222, 128, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #4ade80, #22c55e)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px',
              boxShadow: '0 8px 24px rgba(74, 222, 128, 0.4)'
            }}>
              💬
            </div>
            <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '16px', fontWeight: 'bold' }}>
              Real-Time Messaging
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
              Instant message delivery with WebSocket technology. See typing indicators, read receipts, and online status in real-time.
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
            transition: 'transform 0.3s, box-shadow 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(245, 158, 11, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)'
            }}>
              🤖
            </div>
            <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '16px', fontWeight: 'bold' }}>
              AI-Powered Assistant
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
              Intelligent chatbot that understands context and provides smart responses. Get instant help and automated assistance 24/7.
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
            transition: 'transform 0.3s, box-shadow 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px',
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)'
            }}>
              📊
            </div>
            <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '16px', fontWeight: 'bold' }}>
              Smart Analytics
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
              Track communication patterns with beautiful charts. Priority inbox automatically identifies important messages.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="usecases" style={{
        padding: '80px 24px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            Perfect For Every Team
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            marginBottom: '64px',
            maxWidth: '600px',
            margin: '0 auto 64px'
          }}>
            From small teams to large organizations, CommHub adapts to your communication needs
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            {useCases.map((useCase, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '32px',
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'transform 0.3s, box-shadow 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  {useCase.icon}
                </div>
                <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '16px' }}>
                  {useCase.title}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '24px', lineHeight: '1.6' }}>
                  {useCase.description}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {useCase.features.map((feature, idx) => (
                    <li key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'rgba(255,255,255,0.9)',
                      marginBottom: '8px'
                    }}>
                      <CheckCircle size={16} color="#4ade80" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section id="platform" style={{
        padding: '80px 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            Powerful Features
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            marginBottom: '64px',
            maxWidth: '600px',
            margin: '0 auto 64px'
          }}>
            Everything you need for modern team communication
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px'
          }}>
            {platforms.map((platform, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '32px',
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center',
                transition: 'transform 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  {platform.icon}
                </div>
                <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '16px' }}>
                  {platform.name}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '24px' }}>
                  {platform.description}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' }}>
                  {platform.features.map((feature, idx) => (
                    <li key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'rgba(255,255,255,0.9)',
                      marginBottom: '8px'
                    }}>
                      <CheckCircle size={16} color="#4ade80" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{
        padding: '80px 24px',
        background: 'rgba(255,255,255,0.05)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            Simple, Transparent Pricing
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            marginBottom: '64px',
            maxWidth: '600px',
            margin: '0 auto 64px'
          }}>
            Choose the plan that's right for your team
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {pricingPlans.map((plan, index) => (
              <div key={index} style={{
                background: plan.popular ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '40px',
                border: plan.popular ? '2px solid #4ade80' : '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center',
                position: 'relative',
                transition: 'transform 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#4ade80',
                    color: 'white',
                    padding: '8px 24px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    Most Popular
                  </div>
                )}
                
                <h3 style={{ color: 'white', fontSize: '28px', marginBottom: '8px' }}>
                  {plan.name}
                </h3>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#4ade80', marginBottom: '8px' }}>
                  {plan.price}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '32px' }}>
                  {plan.description}
                </p>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', textAlign: 'left' }}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      color: 'rgba(255,255,255,0.9)',
                      marginBottom: '12px',
                      fontSize: '16px'
                    }}>
                      <CheckCircle size={20} color="#4ade80" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: plan.popular ? '#4ade80' : 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = plan.popular ? '#22c55e' : 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = plan.popular ? '#4ade80' : 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {plan.price === 'Free' ? 'Get Started Free' : plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Forum Section */}
      <section id="forum" style={{
        padding: '80px 24px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '16px'
          }}>
            Join Our Community
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '48px',
            lineHeight: '1.6'
          }}>
            Connect with developers, share ideas, and get help from our vibrant community of users building amazing communication experiences.
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>👥</div>
              <h4 style={{ color: 'white', marginBottom: '8px', fontSize: '24px', fontWeight: 'bold' }}>2,500+</h4>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>Active Users</p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>💬</div>
              <h4 style={{ color: 'white', marginBottom: '8px', fontSize: '24px', fontWeight: 'bold' }}>50,000+</h4>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>Messages Sent</p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚡</div>
              <h4 style={{ color: 'white', marginBottom: '8px', fontSize: '24px', fontWeight: 'bold' }}>99.9%</h4>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>Uptime</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/forum')}
            style={{
              padding: '16px 32px',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#7c3aed';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#8b5cf6';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Join the Forum
          </button>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{
        padding: '80px 24px',
        background: 'rgba(255,255,255,0.05)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: '64px'
          }}>
            Contact Us
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '48px'
          }}>
            <div>
              <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '24px' }}>
                Get in Touch
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: '#4ade80',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    📧
                  </div>
                  <div>
                    <p style={{ color: 'white', margin: 0, fontWeight: '500' }}>Email</p>
                    <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>support@commhub.ai</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: '#4ade80',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    📞
                  </div>
                  <div>
                    <p style={{ color: 'white', margin: 0, fontWeight: '500' }}>Phone</p>
                    <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>+1 (555) 123-4567</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: '#4ade80',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    📍
                  </div>
                  <div>
                    <p style={{ color: 'white', margin: 0, fontWeight: '500' }}>Address</p>
                    <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                      123 AI Street, Tech City, TC 12345
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <ContactForm onSubmit={(data) => {
                console.log('Contact form submitted:', data);
                // In a real app, you would send this to your backend API
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '48px 24px 24px',
        borderTop: '1px solid rgba(255,255,255,0.2)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            <MessageSquare size={32} color="white" />
            <h3 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              CommHub
            </h3>
          </div>
          
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '24px', fontSize: '16px' }}>
            Empowering teams with intelligent, real-time communication
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <a href="#" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Terms of Service</a>
            <a href="#" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Documentation</a>
            <a href="#" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>API</a>
          </div>
          
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>
            © 2025 CommHub. All rights reserved. Built with ❤️ by Supriya Sandip Shelke
          </p>
        </div>
      </footer>

      {/* Demo Modal */}
      {showDemoModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px',
          overflowY: 'auto'
        }}
        onClick={() => setShowDemoModal(false)}
        >
          <div style={{
            background: 'white',
            borderRadius: '24px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowDemoModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(0,0,0,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
                zIndex: 10
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
            >
              <XCircle size={24} color="#374151" />
            </button>

            {/* Modal Content */}
            <div style={{ padding: '48px' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <div style={{
                  display: 'inline-flex',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '16px',
                  marginBottom: '24px'
                }}>
                  <Play size={40} color="white" />
                </div>
                <h2 style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '16px'
                }}>
                  Welcome to CommHub Demo
                </h2>
                <p style={{
                  fontSize: '18px',
                  color: '#6b7280',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  Learn how to use CommHub in just a few minutes. Follow these step-by-step guides to get started.
                </p>
              </div>

              {/* Demo Steps */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                {/* Step 1 */}
                <div style={{
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  borderRadius: '16px',
                  padding: '32px',
                  border: '2px solid #667eea'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}>
                      1
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                      Sign Up & Sign In
                    </h3>
                  </div>
                  <p style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.6', marginBottom: '16px' }}>
                    Getting started with CommHub is easy:
                  </p>
                  <ul style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.8', paddingLeft: '24px' }}>
                    <li>Click the <strong>"Get Started"</strong> button on the homepage</li>
                    <li>Choose <strong>"Sign Up"</strong> if you're a new user or <strong>"Sign In"</strong> if you already have an account</li>
                    <li>For quick access, try one of our <strong>Demo Users</strong> (no password required!)</li>
                    <li>After successful login, you'll be redirected to your Dashboard</li>
                  </ul>
                </div>

                {/* Step 2 */}
                <div style={{
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  borderRadius: '16px',
                  padding: '32px',
                  border: '2px solid #4ade80'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}>
                      2
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                      Navigate the Dashboard
                    </h3>
                  </div>
                  <p style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.6', marginBottom: '16px' }}>
                    Your Dashboard is your command center:
                  </p>
                  <ul style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.8', paddingLeft: '24px' }}>
                    <li>View <strong>message statistics</strong> (Total, High Priority, Medium, Low)</li>
                    <li>Read your <strong>daily AI summary</strong> of conversations</li>
                    <li>Access quick links to Messages, Priority Inbox, Analytics, Groups, and Settings</li>
                    <li>Chat with the <strong>AI Assistant</strong> for instant help</li>
                  </ul>
                </div>

                {/* Step 3 */}
                <div style={{
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  borderRadius: '16px',
                  padding: '32px',
                  border: '2px solid #f59e0b'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}>
                      3
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                      Send Messages
                    </h3>
                  </div>
                  <p style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.6', marginBottom: '16px' }}>
                    Real-time messaging made simple:
                  </p>
                  <ul style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.8', paddingLeft: '24px' }}>
                    <li>Go to <strong>Messages</strong> from the sidebar menu</li>
                    <li>Select a conversation or create a new one</li>
                    <li>Type your message and press Enter or click Send</li>
                    <li>See <strong>typing indicators</strong> when others are typing</li>
                    <li>Get <strong>read receipts</strong> (✓✓) when messages are read</li>
                    <li>View <strong>online/offline status</strong> of contacts</li>
                  </ul>
                </div>

                {/* Step 4 */}
                <div style={{
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  borderRadius: '16px',
                  padding: '32px',
                  border: '2px solid #8b5cf6'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}>
                      4
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                      Use AI-Powered Features
                    </h3>
                  </div>
                  <p style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.6', marginBottom: '16px' }}>
                    Leverage intelligent automation:
                  </p>
                  <ul style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.8', paddingLeft: '24px' }}>
                    <li><strong>AI Chatbot:</strong> Ask questions and get instant answers on your Dashboard</li>
                    <li><strong>Priority Inbox:</strong> Automatically identifies important messages</li>
                    <li><strong>Smart Analytics:</strong> View communication patterns with beautiful charts</li>
                    <li><strong>Daily Summaries:</strong> Get AI-generated summaries of your conversations</li>
                    <li><strong>Auto-Reply:</strong> Set up automated responses for common queries</li>
                  </ul>
                </div>

                {/* Step 5 */}
                <div style={{
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  borderRadius: '16px',
                  padding: '32px',
                  border: '2px solid #ef4444'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}>
                      5
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                      Manage Conversations & Settings
                    </h3>
                  </div>
                  <p style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.6', marginBottom: '16px' }}>
                    Customize your experience:
                  </p>
                  <ul style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.8', paddingLeft: '24px' }}>
                    <li><strong>Groups:</strong> Create and manage group conversations with multiple members</li>
                    <li><strong>Settings:</strong> Customize themes, notifications, and preferences</li>
                    <li><strong>Analytics:</strong> Track message volume, response times, and engagement</li>
                    <li><strong>Priority Inbox:</strong> Filter, search, and manage important messages</li>
                    <li><strong>Profile:</strong> Update your profile information and avatar</li>
                  </ul>
                </div>
              </div>

              {/* CTA Button */}
              <div style={{ textAlign: 'center', marginTop: '48px' }}>
                <button
                  onClick={() => {
                    setShowDemoModal(false);
                    navigate('/login');
                  }}
                  style={{
                    padding: '16px 48px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Get Started Now →
                </button>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginTop: '16px'
                }}>
                  Ready to experience CommHub? Sign up in seconds!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}