/**
 * 会员/支付模块路由
 * /api/membership/*
 */
const express = require('express');
const { auth } = require('../middleware/auth');
const membershipService = require('../services/membershipService');
const paymentService = require('../services/paymentService');

const router = express.Router();

// GET /api/membership/plans - 获取会员套餐列表
router.get('/plans', (_req, res) => {
  try {
    const plans = membershipService.getPlanList();
    res.json({ code: 200, data: plans });
  } catch (err) {
    console.error('[Membership] 获取套餐失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/membership/create-order - 创建订单
router.post('/create-order', auth, async (req, res) => {
  try {
    const { planType } = req.body;

    if (!['monthly', 'quarterly', 'yearly'].includes(planType)) {
      return res.status(400).json({ code: 400, message: '无效的套餐类型' });
    }

    const order = await paymentService.createOrder(req.user.id, planType);

    res.json({
      code: 200,
      data: {
        orderId: order.id,
        orderNo: order.order_no,
        planType: order.plan_type,
        amount: parseFloat(order.amount),
        status: order.status,
        createdAt: order.created_at,
        // 模拟支付：前端可调用 /api/membership/simulate-pay 完成支付
        simulatePayUrl: `/api/membership/simulate-pay?orderNo=${order.order_no}`,
      },
    });
  } catch (err) {
    console.error('[Membership] 创建订单失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/membership/simulate-pay - 模拟支付（开发/测试用）
router.post('/simulate-pay', auth, async (req, res) => {
  try {
    const { orderNo } = req.body.orderNo ? req.body : req.query;

    if (!orderNo) {
      return res.status(400).json({ code: 400, message: '缺少订单号' });
    }

    const result = await paymentService.handlePaymentCallback(orderNo);

    if (!result.success) {
      return res.status(400).json({ code: 400, message: result.message });
    }

    res.json({
      code: 200,
      message: '支付成功',
      data: {
        orderNo: result.orderNo,
        planType: result.planType,
        amount: result.amount,
        durationDays: result.durationDays,
      },
    });
  } catch (err) {
    console.error('[Membership] 模拟支付失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/membership/callback - 微信支付回调（模拟）
// 生产环境：微信 POST 到该接口，需验证签名
router.get('/callback', async (req, res) => {
  try {
    const { orderNo, transactionId } = req.query;

    if (!orderNo) {
      return res.status(400).json({ code: 400, message: '缺少订单号' });
    }

    const result = await paymentService.handlePaymentCallback(orderNo, transactionId);

    if (!result.success) {
      return res.status(400).json({ code: 400, message: result.message });
    }

    // 微信要求返回 SUCCESS 格式
    res.set('Content-Type', 'text/xml');
    res.send(`
      <xml>
        <return_code><![CDATA[SUCCESS]]></return_code>
        <return_msg><![CDATA[OK]]></return_msg>
      </xml>
    `);
  } catch (err) {
    console.error('[Membership] 支付回调失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/membership/callback - 微信支付回调 POST（生产）
router.post('/callback', async (req, res) => {
  try {
    // 生产环境需验证微信签名
    const { orderNo } = req.body;
    if (!orderNo) {
      res.set('Content-Type', 'text/xml');
      return res.send(`<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[缺少参数]]></return_msg></xml>`);
    }

    await paymentService.handlePaymentCallback(orderNo);

    res.set('Content-Type', 'text/xml');
    res.send(`
      <xml>
        <return_code><![CDATA[SUCCESS]]></return_code>
        <return_msg><![CDATA[OK]]></return_msg>
      </xml>
    `);
  } catch (err) {
    console.error('[Membership] 支付回调POST失败:', err);
    res.set('Content-Type', 'text/xml');
    res.send(`<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[服务器错误]]></return_msg></xml>`);
  }
});

// GET /api/membership/my-subscription - 获取我的订阅信息
router.get('/my-subscription', auth, async (req, res) => {
  try {
    const [membership, quota, subscription, orders] = await Promise.all([
      membershipService.getUserMembership(req.user.id),
      membershipService.getRemainingQuota(req.user.id),
      membershipService.getActiveSubscription(req.user.id),
      paymentService.getUserOrders(req.user.id, 1, 5),
    ]);

    res.json({
      code: 200,
      data: {
        membership: membership.membership,
        level: membership.level,
        targetScore: membership.targetScore,
        examDate: membership.examDate,
        quota: quota,
        subscription: subscription,
        recentOrders: orders.list,
      },
    });
  } catch (err) {
    console.error('[Membership] 获取订阅信息失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// GET /api/membership/usage-limit - 获取今日剩余免费额度
router.get('/usage-limit', auth, async (req, res) => {
  try {
    const quota = await membershipService.getRemainingQuota(req.user.id);
    res.json({ code: 200, data: quota });
  } catch (err) {
    console.error('[Membership] 获取额度失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// POST /api/membership/cancel - 取消订阅
router.post('/cancel', auth, async (req, res) => {
  try {
    await membershipService.cancelSubscription(req.user.id);
    res.json({ code: 200, message: '订阅已取消' });
  } catch (err) {
    console.error('[Membership] 取消订阅失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
