import { Router } from 'express';

export const groupsRouter = Router();

/**
 * Create new group
 * POST /api/groups/create
 * 
 * Body: {
 *   name: string;
 *   description?: string;
 *   icon?: string;
 *   visibility?: 'public' | 'private';
 *   initialMembers?: string[];
 *   settings?: Partial<GroupSettings>;
 * }
 */
groupsRouter.post('/create', async (req, res) => {
  try {
    const userId = (req as any).user?.id || 'demo_user';
    const groupService = req.app.locals.groupService;

    const { name, description, icon, visibility, initialMembers, settings } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Group name is required',
      });
    }

    const group = await groupService.createGroup(userId, {
      name,
      description,
      icon,
      visibility,
      initialMembers,
      settings,
    });

    res.json({
      success: true,
      group,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get user's groups
 * GET /api/groups/my
 */
groupsRouter.get('/my', async (req, res) => {
  try {
    const userId = (req as any).user?.id || 'demo_user';
    const groupService = req.app.locals.groupService;

    const groups = await groupService.getUserGroups(userId);

    res.json({
      success: true,
      groups,
      count: groups.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get group details
 * GET /api/groups/:groupId
 */
groupsRouter.get('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const groupService = req.app.locals.groupService;

    const group = await groupService.getGroup(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
      });
    }

    res.json({
      success: true,
      group,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update group metadata
 * PATCH /api/groups/:groupId
 * 
 * Body: {
 *   name?: string;
 *   description?: string;
 *   icon?: string;
 *   settings?: Partial<GroupSettings>;
 * }
 */
groupsRouter.patch('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = (req as any).user?.id || 'demo_user';
    const groupService = req.app.locals.groupService;

    const updates = req.body;

    const group = await groupService.updateGroup(groupId, userId, updates);

    res.json({
      success: true,
      group,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Delete group
 * DELETE /api/groups/:groupId
 */
groupsRouter.delete('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = (req as any).user?.id || 'demo_user';
    const groupService = req.app.locals.groupService;

    const deleted = await groupService.deleteGroup(groupId, userId);

    res.json({
      success: deleted,
      message: deleted ? 'Group deleted' : 'Failed to delete group',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get group members
 * GET /api/groups/:groupId/members
 */
groupsRouter.get('/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;
    const groupService = req.app.locals.groupService;

    const members = await groupService.getMembers(groupId);

    res.json({
      success: true,
      members,
      count: members.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Add member to group
 * POST /api/groups/:groupId/members/add
 * 
 * Body: {
 *   memberId: string;
 *   role?: 'admin' | 'member';
 * }
 */
groupsRouter.post('/:groupId/members/add', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId, role } = req.body;
    const userId = (req as any).user?.id || 'demo_user';
    const groupService = req.app.locals.groupService;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: 'memberId is required',
      });
    }

    const member = await groupService.addMember(groupId, userId, memberId, role);

    res.json({
      success: true,
      member,
      message: `${member.displayName} added to group`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Remove member from group
 * POST /api/groups/:groupId/members/remove
 * 
 * Body: {
 *   memberId: string;
 * }
 */
groupsRouter.post('/:groupId/members/remove', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const userId = (req as any).user?.id || 'demo_user';
    const groupService = req.app.locals.groupService;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: 'memberId is required',
      });
    }

    const removed = await groupService.removeMember(groupId, userId, memberId);

    res.json({
      success: removed,
      message: removed ? 'Member removed from group' : 'Failed to remove member',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Leave group
 * POST /api/groups/:groupId/leave
 */
groupsRouter.post('/:groupId/leave', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = (req as any).user?.id || 'demo_user';
    const groupService = req.app.locals.groupService;

    const left = await groupService.leaveGroup(groupId, userId);

    res.json({
      success: left,
      message: left ? 'You have left the group' : 'Failed to leave group',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Promote member to admin
 * POST /api/groups/:groupId/admin/promote
 * 
 * Body: {
 *   memberId: string;
 * }
 */
groupsRouter.post('/:groupId/admin/promote', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const userId = (req as any).user?.id || 'demo_user';
    const groupService = req.app.locals.groupService;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        error: 'memberId is required',
      });
    }

    const promoted = await groupService.promoteToAdmin(groupId, userId, memberId);

    res.json({
      success: promoted,
      message: promoted ? 'Member promoted to admin' : 'Failed to promote member',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Demote admin to member
 * POST /api/groups/:groupId/admin/demote
 * 
 * Body: {
 *   adminId: string;
 * }
 */
groupsRouter.post('/:groupId/admin/demote', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminId } = req.body;
    const userId = (req as any).user?.id || 'demo_user';
    const groupService = req.app.locals.groupService;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        error: 'adminId is required',
      });
    }

    const demoted = await groupService.demoteToMember(groupId, userId, adminId);

    res.json({
      success: demoted,
      message: demoted ? 'Admin demoted to member' : 'Failed to demote admin',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Mute/unmute member
 * POST /api/groups/:groupId/admin/mute
 * 
 * Body: {
 *   memberId: string;
 *   mute: boolean;
 * }
 */
groupsRouter.post('/:groupId/admin/mute', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId, mute } = req.body;
    const userId = (req as any).user?.id || 'demo_user';
    const groupService = req.app.locals.groupService;

    if (!memberId || mute === undefined) {
      return res.status(400).json({
        success: false,
        error: 'memberId and mute status required',
      });
    }

    const muted = await groupService.muteMember(groupId, userId, memberId, mute);

    res.json({
      success: muted,
      message: muted 
        ? (mute ? 'Member muted' : 'Member unmuted')
        : 'Failed to update mute status',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Lock/unlock group (read-only mode)
 * POST /api/groups/:groupId/settings
 * 
 * Body: {
 *   isLocked?: boolean;
 *   settings?: Partial<GroupSettings>;
 * }
 */
groupsRouter.post('/:groupId/settings', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = (req as any).user?.id || 'demo_user';
    const groupService = req.app.locals.groupService;

    const updates = req.body;

    const group = await groupService.updateGroup(groupId, userId, updates);

    res.json({
      success: true,
      group,
      message: 'Group settings updated',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get AI group summary
 * GET /api/groups/:groupId/ai/summary?date=YYYY-MM-DD
 */
groupsRouter.get('/:groupId/ai/summary', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { date } = req.query;
    const groupAIService = req.app.locals.groupAIService;

    const targetDate = date ? new Date(date as string) : new Date();

    const summary = await groupAIService.generateDailySummary(groupId, targetDate);

    res.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get AI group insights
 * GET /api/groups/:groupId/ai/insights?days=7
 */
groupsRouter.get('/:groupId/ai/insights', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { days } = req.query;
    const groupAIService = req.app.locals.groupAIService;

    const daysToAnalyze = days ? parseInt(days as string) : 7;

    const insights = await groupAIService.getGroupInsights(groupId, daysToAnalyze);

    res.json({
      success: true,
      insights,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Extract group decisions
 * GET /api/groups/:groupId/ai/decisions
 */
groupsRouter.get('/:groupId/ai/decisions', async (req, res) => {
  try {
    const { groupId } = req.params;
    const groupAIService = req.app.locals.groupAIService;

    const decisions = await groupAIService.extractGroupDecisions(groupId);

    res.json({
      success: true,
      decisions,
      count: decisions.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
