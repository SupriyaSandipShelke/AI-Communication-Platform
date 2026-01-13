import { MatrixService } from './MatrixService.js';
import { DatabaseService } from './DatabaseService.js';

export interface GroupMetadata {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  matrixRoomId: string;
  creatorId: string;
  createdAt: Date;
  memberCount: number;
  isLocked: boolean;
  visibility: 'public' | 'private';
  settings: GroupSettings;
}

export interface GroupSettings {
  allowMemberInvites: boolean;
  allowMemberMessages: boolean;
  showReadReceipts: boolean;
  showTypingIndicators: boolean;
  allowReactions: boolean;
  allowFileSharing: boolean;
  maxMembers: number;
}

export interface GroupMember {
  userId: string;
  matrixId: string;
  displayName: string;
  avatar?: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  isMuted: boolean;
  lastSeen?: Date;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  icon?: string;
  visibility?: 'public' | 'private';
  initialMembers?: string[];
  settings?: Partial<GroupSettings>;
}

/**
 * GroupService - WhatsApp-like Group Chat Management
 * 
 * Built on Matrix.org protocol for:
 * - Secure, decentralized group communication
 * - Rich messaging features (typing, reactions, replies)
 * - End-to-end encryption
 * - Scalable architecture
 */
export class GroupService {
  private matrixService: MatrixService;
  private dbService: DatabaseService;
  private groups: Map<string, GroupMetadata> = new Map();
  private groupMembers: Map<string, GroupMember[]> = new Map();

  constructor(matrixService: MatrixService, dbService: DatabaseService) {
    this.matrixService = matrixService;
    this.dbService = dbService;
    this.loadGroups();
  }

  /**
   * Create a new group chat
   */
  async createGroup(creatorId: string, request: CreateGroupRequest): Promise<GroupMetadata> {
    try {
      // Default settings
      const defaultSettings: GroupSettings = {
        allowMemberInvites: true,
        allowMemberMessages: true,
        showReadReceipts: true,
        showTypingIndicators: true,
        allowReactions: true,
        allowFileSharing: true,
        maxMembers: 256,
        ...request.settings,
      };

      // Create Matrix room
      const roomConfig = {
        name: request.name,
        topic: request.description || '',
        visibility: request.visibility === 'public' ? 'public' : 'private',
        preset: request.visibility === 'public' ? 'public_chat' : 'private_chat',
        room_alias_name: this.generateRoomAlias(request.name),
        initial_state: [
          {
            type: 'm.room.avatar',
            content: { url: request.icon || '' },
          },
        ],
      };

      // Create room via Matrix
      const matrixRoom = await this.matrixService.createRoom(roomConfig);

      if (!matrixRoom) {
        throw new Error('Failed to create Matrix room');
      }

      // Create group metadata
      const group: GroupMetadata = {
        id: this.generateGroupId(),
        name: request.name,
        description: request.description,
        icon: request.icon,
        matrixRoomId: matrixRoom.room_id,
        creatorId,
        createdAt: new Date(),
        memberCount: 1,
        isLocked: false,
        visibility: request.visibility || 'private',
        settings: defaultSettings,
      };

      // Store group
      this.groups.set(group.id, group);
      await this.persistGroup(group);

      // Add creator as admin
      const creator: GroupMember = {
        userId: creatorId,
        matrixId: creatorId,
        displayName: await this.getUserDisplayName(creatorId),
        role: 'admin',
        joinedAt: new Date(),
        isMuted: false,
      };

      this.groupMembers.set(group.id, [creator]);
      await this.persistGroupMember(group.id, creator);

      // Invite initial members if provided
      if (request.initialMembers && request.initialMembers.length > 0) {
        for (const memberId of request.initialMembers) {
          await this.addMember(group.id, creatorId, memberId, 'member');
        }
      }

      return group;
    } catch (error: any) {
      console.error('Failed to create group:', error);
      throw new Error(`Group creation failed: ${error.message}`);
    }
  }

  /**
   * Get group by ID
   */
  async getGroup(groupId: string): Promise<GroupMetadata | null> {
    return this.groups.get(groupId) || null;
  }

  /**
   * Get groups for user
   */
  async getUserGroups(userId: string): Promise<GroupMetadata[]> {
    const userGroups: GroupMetadata[] = [];

    for (const [groupId, group] of this.groups.entries()) {
      const members = this.groupMembers.get(groupId) || [];
      const isMember = members.some(m => m.userId === userId);
      
      if (isMember) {
        userGroups.push(group);
      }
    }

    return userGroups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Update group metadata
   */
  async updateGroup(
    groupId: string,
    userId: string,
    updates: Partial<GroupMetadata>
  ): Promise<GroupMetadata> {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user is admin
    if (!await this.isAdmin(groupId, userId)) {
      throw new Error('Only admins can update group settings');
    }

    // Update allowed fields
    if (updates.name) group.name = updates.name;
    if (updates.description !== undefined) group.description = updates.description;
    if (updates.icon !== undefined) group.icon = updates.icon;
    if (updates.isLocked !== undefined) group.isLocked = updates.isLocked;
    if (updates.settings) group.settings = { ...group.settings, ...updates.settings };

    // Update Matrix room
    if (updates.name) {
      await this.matrixService.setRoomName(group.matrixRoomId, updates.name);
    }
    if (updates.description !== undefined) {
      await this.matrixService.setRoomTopic(group.matrixRoomId, updates.description);
    }
    if (updates.icon !== undefined) {
      await this.matrixService.setRoomAvatar(group.matrixRoomId, updates.icon);
    }

    await this.persistGroup(group);
    return group;
  }

  /**
   * Delete group
   */
  async deleteGroup(groupId: string, userId: string): Promise<boolean> {
    const group = this.groups.get(groupId);
    if (!group) {
      return false;
    }

    // Only creator or admin can delete
    if (group.creatorId !== userId && !await this.isAdmin(groupId, userId)) {
      throw new Error('Only creator or admin can delete group');
    }

    // Remove from Matrix (leave room for all members)
    // await this.matrixService.leaveRoom(group.matrixRoomId);

    // Clean up
    this.groups.delete(groupId);
    this.groupMembers.delete(groupId);
    
    // Delete from database
    // await this.dbService.deleteGroup(groupId);

    return true;
  }

  /**
   * Get group members
   */
  async getMembers(groupId: string): Promise<GroupMember[]> {
    return this.groupMembers.get(groupId) || [];
  }

  /**
   * Add member to group
   */
  async addMember(
    groupId: string,
    inviterId: string,
    newMemberId: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<GroupMember> {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Check permissions
    if (!await this.isAdmin(groupId, inviterId) && !group.settings.allowMemberInvites) {
      throw new Error('Only admins can add members to this group');
    }

    // Check if already member
    const members = this.groupMembers.get(groupId) || [];
    if (members.some(m => m.userId === newMemberId)) {
      throw new Error('User is already a member');
    }

    // Check max members
    if (members.length >= group.settings.maxMembers) {
      throw new Error('Group has reached maximum member limit');
    }

    // Invite to Matrix room
    await this.matrixService.inviteToRoom(group.matrixRoomId, newMemberId);

    // Create member object
    const newMember: GroupMember = {
      userId: newMemberId,
      matrixId: newMemberId,
      displayName: await this.getUserDisplayName(newMemberId),
      role,
      joinedAt: new Date(),
      isMuted: false,
    };

    // Add to members list
    members.push(newMember);
    this.groupMembers.set(groupId, members);
    await this.persistGroupMember(groupId, newMember);

    // Update member count
    group.memberCount = members.length;
    await this.persistGroup(group);

    return newMember;
  }

  /**
   * Remove member from group
   */
  async removeMember(groupId: string, adminId: string, memberId: string): Promise<boolean> {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Check if admin
    if (!await this.isAdmin(groupId, adminId)) {
      throw new Error('Only admins can remove members');
    }

    // Prevent removing another admin
    const memberToRemove = await this.getMember(groupId, memberId);
    if (memberToRemove?.role === 'admin' && adminId !== group.creatorId) {
      throw new Error('Only group creator can remove admins');
    }

    // Remove from Matrix room
    await this.matrixService.kickFromRoom(group.matrixRoomId, memberId, 'Removed by admin');

    // Remove from members list
    const members = this.groupMembers.get(groupId) || [];
    const updatedMembers = members.filter(m => m.userId !== memberId);
    this.groupMembers.set(groupId, updatedMembers);

    // Update member count
    group.memberCount = updatedMembers.length;
    await this.persistGroup(group);

    return true;
  }

  /**
   * Member leaves group voluntarily
   */
  async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const members = this.groupMembers.get(groupId) || [];
    const member = members.find(m => m.userId === userId);

    if (!member) {
      throw new Error('User is not a member of this group');
    }

    // Prevent last admin from leaving
    const admins = members.filter(m => m.role === 'admin');
    if (member.role === 'admin' && admins.length === 1) {
      throw new Error('Cannot leave: you are the only admin. Promote another member first.');
    }

    // Leave Matrix room
    await this.matrixService.leaveRoom(group.matrixRoomId);

    // Remove from members list
    const updatedMembers = members.filter(m => m.userId !== userId);
    this.groupMembers.set(groupId, updatedMembers);

    // Update member count
    group.memberCount = updatedMembers.length;
    await this.persistGroup(group);

    return true;
  }

  /**
   * Check if user is admin
   */
  async isAdmin(groupId: string, userId: string): Promise<boolean> {
    const members = this.groupMembers.get(groupId) || [];
    const member = members.find(m => m.userId === userId);
    return member?.role === 'admin';
  }

  /**
   * Get specific member
   */
  async getMember(groupId: string, userId: string): Promise<GroupMember | null> {
    const members = this.groupMembers.get(groupId) || [];
    return members.find(m => m.userId === userId) || null;
  }

  /**
   * Promote member to admin
   */
  async promoteToAdmin(groupId: string, adminId: string, memberId: string): Promise<boolean> {
    if (!await this.isAdmin(groupId, adminId)) {
      throw new Error('Only admins can promote members');
    }

    const members = this.groupMembers.get(groupId) || [];
    const member = members.find(m => m.userId === memberId);

    if (!member) {
      throw new Error('Member not found');
    }

    member.role = 'admin';
    await this.persistGroupMember(groupId, member);

    return true;
  }

  /**
   * Demote admin to member
   */
  async demoteToMember(groupId: string, adminId: string, targetId: string): Promise<boolean> {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Only creator can demote admins
    if (group.creatorId !== adminId) {
      throw new Error('Only group creator can demote admins');
    }

    // Cannot demote creator
    if (targetId === group.creatorId) {
      throw new Error('Cannot demote group creator');
    }

    const members = this.groupMembers.get(groupId) || [];
    const member = members.find(m => m.userId === targetId);

    if (!member) {
      throw new Error('Member not found');
    }

    member.role = 'member';
    await this.persistGroupMember(groupId, member);

    return true;
  }

  /**
   * Mute member
   */
  async muteMember(groupId: string, adminId: string, memberId: string, mute: boolean): Promise<boolean> {
    if (!await this.isAdmin(groupId, adminId)) {
      throw new Error('Only admins can mute members');
    }

    const members = this.groupMembers.get(groupId) || [];
    const member = members.find(m => m.userId === memberId);

    if (!member) {
      throw new Error('Member not found');
    }

    member.isMuted = mute;
    await this.persistGroupMember(groupId, member);

    return true;
  }

  /**
   * Get user display name
   */
  private async getUserDisplayName(userId: string): Promise<string> {
    try {
      // In production, fetch from Matrix or user database
      return userId.split(':')[0].replace('@', '');
    } catch {
      return userId;
    }
  }

  /**
   * Generate room alias from group name
   */
  private generateRoomAlias(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 64);
  }

  /**
   * Generate unique group ID
   */
  private generateGroupId(): string {
    return `grp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Persist group to database
   */
  private async persistGroup(group: GroupMetadata): Promise<void> {
    // In production, save to database
    console.log('Group persisted:', group.id);
  }

  /**
   * Persist group member to database
   */
  private async persistGroupMember(groupId: string, member: GroupMember): Promise<void> {
    // In production, save to database
    console.log('Member persisted:', groupId, member.userId);
  }

  /**
   * Load groups from database
   */
  private async loadGroups(): Promise<void> {
    // In production, load from database
    console.log('Groups loaded:', this.groups.size);
  }
}
