import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  MessageSquare, 
  Users, 
  Clock, 
  Star,
  TrendingUp,
  Filter,
  Eye,
  ThumbsUp,
  MessageCircle
} from 'lucide-react';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  category: string;
  tags: string[];
  createdAt: Date;
  replies: number;
  views: number;
  likes: number;
  isPinned: boolean;
  isAnswered: boolean;
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  postCount: number;
  color: string;
}

export default function Forum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  useEffect(() => {
    loadForumData();
  }, []);

  const loadForumData = () => {
    // Demo categories
    const demoCategories: ForumCategory[] = [
      {
        id: 'general',
        name: 'General Discussion',
        description: 'General topics about AI and communication',
        icon: '💬',
        postCount: 156,
        color: '#3b82f6'
      },
      {
        id: 'technical',
        name: 'Technical Support',
        description: 'Get help with technical issues',
        icon: '🔧',
        postCount: 89,
        color: '#ef4444'
      },
      {
        id: 'features',
        name: 'Feature Requests',
        description: 'Suggest new features and improvements',
        icon: '💡',
        postCount: 67,
        color: '#f59e0b'
      },
      {
        id: 'showcase',
        name: 'Project Showcase',
        description: 'Share your amazing projects',
        icon: '🚀',
        postCount: 43,
        color: '#10b981'
      },
      {
        id: 'tutorials',
        name: 'Tutorials & Guides',
        description: 'Learn from community tutorials',
        icon: '📚',
        postCount: 78,
        color: '#8b5cf6'
      }
    ];

    // Demo posts
    const demoPosts: ForumPost[] = [
      {
        id: '1',
        title: 'How to integrate voice recognition with custom AI models?',
        content: 'I\'m trying to integrate voice recognition capabilities with my custom AI model. Has anyone successfully implemented this? Looking for best practices and code examples.',
        author: 'alex_dev',
        authorAvatar: '👨‍💻',
        category: 'technical',
        tags: ['voice-recognition', 'ai-models', 'integration'],
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        replies: 12,
        views: 156,
        likes: 8,
        isPinned: false,
        isAnswered: true
      },
      {
        id: '2',
        title: '🎉 New AI Assistant Features Released!',
        content: 'We\'ve just released major updates to the AI Assistant including voice controls, better priority detection, and enhanced customization options. Check out the changelog!',
        author: 'commhub_team',
        authorAvatar: '🏢',
        category: 'general',
        tags: ['announcement', 'features', 'update'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        replies: 24,
        views: 342,
        likes: 45,
        isPinned: true,
        isAnswered: false
      },
      {
        id: '3',
        title: 'Building a customer support bot - lessons learned',
        content: 'After 6 months of building and deploying a customer support bot, here are the key lessons I learned. Hope this helps others starting similar projects.',
        author: 'sarah_builder',
        authorAvatar: '👩‍🔬',
        category: 'showcase',
        tags: ['customer-support', 'bot-building', 'lessons-learned'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
        replies: 18,
        views: 289,
        likes: 32,
        isPinned: false,
        isAnswered: false
      },
      {
        id: '4',
        title: 'Feature Request: Multi-language support for priority detection',
        content: 'It would be great to have priority detection work with multiple languages. Currently it seems optimized for English. Any plans for this?',
        author: 'global_user',
        authorAvatar: '🌍',
        category: 'features',
        tags: ['multi-language', 'priority-detection', 'internationalization'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
        replies: 7,
        views: 123,
        likes: 15,
        isPinned: false,
        isAnswered: false
      },
      {
        id: '5',
        title: 'Complete Guide: Setting up AI Communication Platform',
        content: 'A comprehensive step-by-step guide for setting up the AI Communication Platform from scratch. Includes installation, configuration, and best practices.',
        author: 'tutorial_master',
        authorAvatar: '🎓',
        category: 'tutorials',
        tags: ['setup', 'guide', 'beginner-friendly'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
        replies: 31,
        views: 567,
        likes: 89,
        isPinned: false,
        isAnswered: false
      }
    ];

    setCategories(demoCategories);
    setPosts(demoPosts);
  };

  const filteredPosts = posts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'popular':
          return b.likes - a.likes;
        case 'replies':
          return b.replies - a.replies;
        case 'views':
          return b.views - a.views;
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link 
              to="/" 
              style={{ 
                color: 'white', 
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 style={{ 
                color: 'white', 
                fontSize: '2.5rem', 
                fontWeight: 'bold', 
                margin: 0 
              }}>
                Community Forum
              </h1>
              <p style={{ 
                color: 'rgba(255,255,255,0.8)', 
                margin: 0,
                fontSize: '1.1rem'
              }}>
                Connect, share, and learn with the community
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowNewPostForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: '#4ade80',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#22c55e';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#4ade80';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Plus size={20} />
            New Post
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <Users size={32} color="#4ade80" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>5,247</div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Members</div>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <MessageSquare size={32} color="#f59e0b" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>1,432</div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Discussions</div>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <TrendingUp size={32} color="#8b5cf6" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>89%</div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Solved Rate</div>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <Clock size={32} color="#ef4444" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>2.4h</div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Avg Response</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px' }}>
          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Search */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ position: 'relative' }}>
                <Search 
                  size={20} 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.6)'
                  }}
                />
                <input
                  type="text"
                  placeholder="Search discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 44px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Categories */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>
                Categories
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: selectedCategory === 'all' ? 'rgba(255,255,255,0.2)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== 'all') {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== 'all') {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span>📋 All Categories</span>
                  <span style={{ fontSize: '12px', opacity: 0.8 }}>
                    {posts.length}
                  </span>
                </button>
                
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      background: selectedCategory === category.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory !== category.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory !== category.id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <span>{category.icon} {category.name}</span>
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>
                      {category.postCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>
                Sort By
              </h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="latest">Latest Posts</option>
                <option value="popular">Most Popular</option>
                <option value="replies">Most Replies</option>
                <option value="views">Most Views</option>
              </select>
            </div>
          </div>

          {/* Main Content */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden'
          }}>
            {/* Posts Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{ color: 'white', fontSize: '20px', margin: 0 }}>
                Discussions ({filteredPosts.length})
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={16} color="rgba(255,255,255,0.6)" />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                  {selectedCategory === 'all' ? 'All Categories' : 
                   categories.find(c => c.id === selectedCategory)?.name}
                </span>
              </div>
            </div>

            {/* Posts List */}
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredPosts.map(post => (
                <div
                  key={post.id}
                  style={{
                    padding: '20px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {post.isPinned && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#f59e0b',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      📌 PINNED
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0
                    }}>
                      {post.authorAvatar}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <h3 style={{
                          color: 'white',
                          fontSize: '18px',
                          margin: 0,
                          fontWeight: '600'
                        }}>
                          {post.title}
                        </h3>
                        {post.isAnswered && (
                          <div style={{
                            background: '#10b981',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}>
                            ✓ SOLVED
                          </div>
                        )}
                      </div>
                      
                      <p style={{
                        color: 'rgba(255,255,255,0.8)',
                        margin: '0 0 12px 0',
                        lineHeight: '1.5',
                        fontSize: '14px'
                      }}>
                        {post.content.length > 150 ? 
                          post.content.substring(0, 150) + '...' : 
                          post.content
                        }
                      </p>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        {post.tags.map(tag => (
                          <span
                            key={tag}
                            style={{
                              background: 'rgba(59, 130, 246, 0.2)',
                              color: '#60a5fa',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              border: '1px solid rgba(59, 130, 246, 0.3)'
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.6)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span>by {post.author}</span>
                          <span>{getTimeAgo(post.createdAt)}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ThumbsUp size={14} />
                            <span>{post.likes}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MessageCircle size={14} />
                            <span>{post.replies}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={14} />
                            <span>{post.views}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredPosts.length === 0 && (
                <div style={{
                  padding: '48px',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.6)'
                }}>
                  <MessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No discussions found</h3>
                  <p>Try adjusting your search or category filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPostForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#1f2937' }}>Create New Post</h2>
              <button
                onClick={() => setShowNewPostForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Enter your post title..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Category
                </label>
                <select style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Content
                </label>
                <textarea
                  placeholder="Write your post content..."
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="ai, tutorial, help..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#4ade80',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Create Post
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewPostForm(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}