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
  CheckCircle
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navigate = useNavigate();

  const useCases = [
    {
      title: "Customer Support",
      description: "AI-powered customer service with instant responses",
      icon: "🎧",
      features: ["24/7 Availability", "Multi-language Support", "Smart Routing"]
    },
    {
      title: "Sales & Marketing", 
      description: "Engage prospects with intelligent conversations",
      icon: "💼",
      features: ["Lead Qualification", "Product Recommendations", "Follow-up Automation"]
    },
    {
      title: "Team Collaboration",
      description: "Enhanced internal communication and productivity",
      icon: "👥",
      features: ["Priority Detection", "Smart Notifications", "Task Management"]
    },
    {
      title: "Education & Training",
      description: "Interactive learning experiences with AI tutors",
      icon: "🎓",
      features: ["Personalized Learning", "Progress Tracking", "Interactive Quizzes"]
    }
  ];

  const platforms = [
    {
      name: "Web Platform",
      description: "Full-featured web application",
      icon: "🌐",
      features: ["Real-time Chat", "Voice Integration", "Analytics Dashboard"]
    },
    {
      name: "Mobile Apps",
      description: "iOS and Android applications",
      icon: "📱",
      features: ["Push Notifications", "Offline Mode", "Touch Optimized"]
    },
    {
      name: "API Integration",
      description: "RESTful APIs for custom integration",
      icon: "🔌",
      features: ["Webhook Support", "SDK Available", "Rate Limiting"]
    },
    {
      name: "Enterprise Solutions",
      description: "On-premise and cloud deployments",
      icon: "🏢",
      features: ["SSO Integration", "Custom Branding", "Dedicated Support"]
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for individuals and small teams",
      features: [
        "Up to 100 messages/month",
        "Basic AI responses",
        "Web platform access",
        "Community support"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$29/month",
      description: "For growing businesses and teams",
      features: [
        "Up to 10,000 messages/month",
        "Advanced AI features",
        "Voice integration",
        "Priority support",
        "Analytics dashboard",
        "API access"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Unlimited messages",
        "Custom AI training",
        "On-premise deployment",
        "24/7 dedicated support",
        "Custom integrations",
        "SLA guarantee"
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
          Conversational <span style={{ color: '#4ade80' }}>AI</span><br />
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
          Real-time Perception and Action Abilities
        </p>
        
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(45deg, #f59e0b, #d97706)',
          padding: '8px 16px',
          borderRadius: '20px',
          marginBottom: '48px'
        }}>
          <span style={{ color: 'white', fontWeight: 'bold' }}>
            ⭐ Rated #1 by Developers
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
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#4ade80',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px'
            }}>
              🎭
            </div>
            <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '16px' }}>
              Role-play AI Avatars
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
              Create intelligent AI characters with unique personalities and conversation abilities
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#f59e0b',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px'
            }}>
              🥽
            </div>
            <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '16px' }}>
              XR Training Simulations
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
              Immersive training experiences with AI-powered virtual reality environments
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#8b5cf6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px'
            }}>
              🌍
            </div>
            <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '16px' }}>
              Social Worlds and Gaming
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
              Build interactive social experiences and gaming environments with AI companions
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
            marginBottom: '64px'
          }}>
            Use Cases
          </h2>
          
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
            marginBottom: '64px'
          }}>
            Platform
          </h2>
          
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
            marginBottom: '64px'
          }}>
            Pricing
          </h2>
          
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
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = plan.popular ? '#4ade80' : 'rgba(255,255,255,0.2)';
                  }}
                >
                  {plan.price === 'Free' ? 'Get Started' : plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
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
            marginBottom: '32px'
          }}>
            Community Forum
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '48px',
            lineHeight: '1.6'
          }}>
            Join our vibrant community of developers, creators, and AI enthusiasts. 
            Share ideas, get help, and collaborate on amazing projects.
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
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>👥</div>
              <h4 style={{ color: 'white', marginBottom: '8px' }}>5,000+</h4>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>Active Members</p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>💬</div>
              <h4 style={{ color: 'white', marginBottom: '8px' }}>10,000+</h4>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>Discussions</p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🚀</div>
              <h4 style={{ color: 'white', marginBottom: '8px' }}>500+</h4>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>Projects Shared</p>
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
          
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '24px' }}>
            Building the future of conversational AI communication
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
            © 2024 CommHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}