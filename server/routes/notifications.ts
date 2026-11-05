import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const notifications = db.notifications.find();
    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error fetching notifications' });
  }
});

// PUT /api/notifications/mark-all-read
router.put('/mark-all-read', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    db.notifications.markAllRead();
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error updating notifications' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const updated = db.notifications.findByIdAndUpdate(req.params.id, { isRead: true });
    if (!updated) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }
    res.json({ success: true, notification: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error updating notification' });
  }
});

export default router;
