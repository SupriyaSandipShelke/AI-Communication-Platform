import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Users, Plus, Search, MoreVertical, Shield, UserPlus, UserMinus, VolumeX, Lock, Edit3, Trash2, Eye, EyeOff } from 'lucide-react';
import '../styles/chatMessage.css';

interface GroupMember {
  id: string;
  userId: string;
  name: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  isOnline: boolean;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  memberCount: number;
  creatorId: string;
  isLocked: boolean;
  settings: {
    allowInvites: boolean;
    muteNotifications: boolean;
    isPrivate: boolean;
  };
  createdAt: Date;
  members: GroupMember[];
}

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    console.log('Making API call to:', url, 'with token:', token ? 'present' : 'missing');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    
    console.log('API response status:', response.status);
    
    if (response.status === 401) {
      console.log('Unauthorized, redirecting to login');
      window.location.href = '/login';
      return null;
    }
    
    const data = await response.json();
    console.log('API response data:', data);
    return data;
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      console.log('Loading groups...');
      
      const data = await apiCall('/api/whatsapp/groups');
      console.log('Groups API response:', data);
      
      if (data && data.success) {
        const transformedGroups = data.groups.map((group: any) => ({
          id: group.id,
          name: group.group_name || group.contact_name || group.name,
          description: group.description || group.last_message,
          memberCount: group.member_count || 1,
          creatorId: group.user_id,
          isLocked: false,
          settings: {
            allowInvites: true,
            muteNotifications: false,
            isPrivate: false
          },
          createdAt: new Date(group.created_at),
          members: group.member_names ? group.member_names.split(',').map((name: string, index: number) => ({
            id: `member_${index}`,
            userId: `user_${index}`,
            name: name.trim(),
            role: index === 0 ? 'admin' : 'member',
            joinedAt: new Date(group.created_at),
            isOnline: Math.random() > 0.5
          })) : [{
            id: 'creator',
            userId: group.user_id,
            name: 'You',
            role: 'admin' as const,
            joinedAt: new Date(group.created_at),
            isOnline: true
          }]
        }));
        
        console.log('Transformed groups:', transformedGroups);
        setGroups(transformedGroups);
      } else {
        console.log('No groups found or API call failed');
        setGroups([]);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.members.some(member => 
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleCreateGroup = async (formData: FormData) => {
    try {
      const groupName = formData.get('name') as string;
      const groupDescription = formData.get('description') as string;
      
      console.log('Creating group:', { name: groupName, description: groupDescription });
      
      if (!groupName || !groupName.trim()) {
        alert('Please enter a group name');
        return;
      }
      
      const data = await apiCall('/api/whatsapp/groups/create', {
        method: 'POST',
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription?.trim() || '',
          participants: [] // Start with empty participants, can add later
        })
      });
      
      console.log('Group creation response:', data);
      
      if (data && data.success) {
        setShowCreateModal(false);
        loadGroups(); // Reload groups
        alert(`Group "${groupName}" created successfully!`);
      } else {
        alert('Failed to create group: ' + (data?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group. Please try again.');
    }
  };

  const toggleGroupLock = async (groupId: string) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, isLocked: !group.isLocked } 
        : group
    ));
  };

  const promoteToAdmin = async (groupId: string, memberId: string) => {
    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          members: group.members.map(member =>
            member.id === memberId ? { ...member, role: 'admin' } : member
          )
        };
      }
      return group;
    }));
  };

  const demoteToMember = async (groupId: string, memberId: string) => {
    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          members: group.members.map(member =>
            member.id === memberId ? { ...member, role: 'member' } : member
          )
        };
      }
      return group;
    }));
  };

  const muteMember = async (groupId: string, memberId: string) => {
    // In a real app, this would call an API
    console.log(`Muting member ${memberId} in group ${groupId}`);
  };

  const removeMember = async (groupId: string, memberId: string) => {
    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          members: group.members.filter(member => member.id !== memberId),
          memberCount: group.memberCount - 1
        };
      }
      return group;
    }));
  };

  return (
    <Layout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                Groups
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: 0 }}>
                Manage your group chats and teams
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '12px 20px',
                background: 'var(--bubble-sent)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '500'
              }}
            >
              <Plus size={18} />
              New Group
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Groups List */}
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px', 
            color: 'var(--text-secondary)' 
          }}>
            Loading groups...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px', 
            color: 'var(--text-secondary)' 
          }}>
            <Users size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No groups found</h3>
            <p>Create your first group to start collaborating with your team</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                style={{
                  background: 'var(--bg-primary)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedGroup(group)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'var(--bubble-sent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <Users size={20} />
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                        {group.name}
                      </h3>
                    </div>
                    
                    {group.description && (
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0' }}>
                        {group.description}
                      </p>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                      <span>{group.memberCount} members</span>
                      {group.isLocked && <Lock size={12} />}
                      {group.settings.isPrivate && <EyeOff size={12} />}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Show group menu
                    }}
                    style={{
                      padding: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      borderRadius: '6px'
                    }}
                    title="Group options"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>

                {/* Members preview */}
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Members
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {group.members.slice(0, 5).map((member) => (
                      <div
                        key={member.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          background: 'var(--bg-secondary)',
                          borderRadius: '16px',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: member.isOnline ? '#10b981' : '#9ca3af'
                        }} />
                        {member.name}
                        {member.role === 'admin' && <Shield size={10} color="#f59e0b" />}
                      </div>
                    ))}
                    {group.members.length > 5 && (
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        +{group.members.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Group actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link
                    to={`/messages?groupId=${group.id}`}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: 'none',
                      borderRadius: '8px',
                      textAlign: 'center',
                      textDecoration: 'none',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Chat
                  </Link>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroupLock(group.id);
                    }}
                    style={{
                      padding: '8px 12px',
                      background: group.isLocked ? '#fef3c7' : 'var(--bg-secondary)',
                      color: group.isLocked ? '#f59e0b' : 'var(--text-secondary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    title={group.isLocked ? 'Unlock group' : 'Lock group'}
                  >
                    {group.isLocked ? <Lock size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '24px',
              width: '400px',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-medium)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '20px' }}>
              Create New Group
            </h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateGroup(new FormData(e.target as HTMLFormElement));
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Group Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Enter group name"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  placeholder="Enter group description"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: 'var(--bubble-sent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Details Modal */}
      {selectedGroup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
          onClick={() => setSelectedGroup(null)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '24px',
              width: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-medium)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                  {selectedGroup.name}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0' }}>
                  {selectedGroup.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  <span>{selectedGroup.memberCount} members</span>
                  {selectedGroup.isLocked && <Lock size={12} />}
                  {selectedGroup.settings.isPrivate && <EyeOff size={12} />}
                </div>
              </div>
              
              <button
                onClick={() => setSelectedGroup(null)}
                style={{
                  padding: '8px',
                  border: 'none',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            {/* Group Settings */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
                Group Settings
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Allow Invites</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Let members invite others</div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                    <input
                      type="checkbox"
                      checked={selectedGroup.settings.allowInvites}
                      onChange={() => {
                        setGroups(prev => prev.map(g => 
                          g.id === selectedGroup.id 
                            ? { ...g, settings: { ...g.settings, allowInvites: !g.settings.allowInvites } } 
                            : g
                        ));
                      }}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: selectedGroup.settings.allowInvites ? 'var(--bubble-sent)' : 'var(--bg-secondary)',
                      transition: '.4s',
                      borderRadius: '24px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: '3px',
                        bottom: '3px',
                        background: 'white',
                        transition: '.4s',
                        borderRadius: '50%',
                        transform: selectedGroup.settings.allowInvites ? 'translateX(22px)' : 'translateX(0)'
                      }} />
                    </span>
                  </label>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Mute Notifications</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Turn off notifications for this group</div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                    <input
                      type="checkbox"
                      checked={selectedGroup.settings.muteNotifications}
                      onChange={() => {
                        setGroups(prev => prev.map(g => 
                          g.id === selectedGroup.id 
                            ? { ...g, settings: { ...g.settings, muteNotifications: !g.settings.muteNotifications } } 
                            : g
                        ));
                      }}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: selectedGroup.settings.muteNotifications ? 'var(--bubble-sent)' : 'var(--bg-secondary)',
                      transition: '.4s',
                      borderRadius: '24px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: '3px',
                        bottom: '3px',
                        background: 'white',
                        transition: '.4s',
                        borderRadius: '50%',
                        transform: selectedGroup.settings.muteNotifications ? 'translateX(22px)' : 'translateX(0)'
                      }} />
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Members List */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                  Members ({selectedGroup.members.length})
                </h3>
                <button
                  style={{
                    padding: '6px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <UserPlus size={14} />
                  Add
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedGroup.members.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--bubble-sent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px'
                      }}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                          {member.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {member.role === 'admin' && <Shield size={10} color="#f59e0b" />}
                          {member.role}
                          {member.isOnline && (
                            <>
                              <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#10b981'
                              }} />
                              Online
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {member.role === 'admin' && member.userId !== 'current-user' && (
                        <button
                          onClick={() => demoteToMember(selectedGroup.id, member.id)}
                          style={{
                            padding: '4px 8px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-medium)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title="Demote to member"
                        >
                          <Edit3 size={12} />
                        </button>
                      )}
                      
                      {member.role === 'member' && (
                        <button
                          onClick={() => promoteToAdmin(selectedGroup.id, member.id)}
                          style={{
                            padding: '4px 8px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-medium)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title="Promote to admin"
                        >
                          <Shield size={12} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => muteMember(selectedGroup.id, member.id)}
                        style={{
                          padding: '4px 8px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-medium)',
                          borderRadius: '6px',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        title="Mute member"
                      >
                        <VolumeX size={12} />
                      </button>
                      
                      <button
                        onClick={() => removeMember(selectedGroup.id, member.id)}
                        style={{
                          padding: '4px 8px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-medium)',
                          borderRadius: '6px',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        title="Remove member"
                      >
                        <UserMinus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}