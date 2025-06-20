import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  console.log('=== TEST ROUTE HIT ===');
  res.json({ message: 'Test route is working!' });
});

export default router; 