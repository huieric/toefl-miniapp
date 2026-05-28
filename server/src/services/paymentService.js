/**
 * 支付服务
 * 订单生成、微信支付回调处理（模拟）、订阅状态更新
 */
const db = require('../config/db');
const membershipService = require('./membershipService');

/**
 * 生成唯一订单号
 * @returns {string} 格式: TOEFL + yyyyMMddHHmmss + 6位随机
 */
function generateOrderNo() {
  const now = new Date();
  const datePart = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `TOEFL${datePart}${randomPart}`;
}

/**
 * 获取套餐价格
 */
function getPlanPrice(planType) {
  const prices = {
    monthly: 29.90,
    quarterly: 79.90,
    yearly: 299.00,
  };
  return prices[planType] || 29.90;
}

/**
 * 获取套餐天数
 */
function getPlanDays(planType) {
  const days = {
    monthly: 30,
    quarterly: 90,
    yearly: 365,
  };
  return days[planType] || 30;
}

/**
 * 创建订单
 * @param {number} userId
 * @param {string} planType - monthly/quarterly/yearly
 * @returns {{ orderId, orderNo, amount, planType }}
 */
async function createOrder(userId, planType) {
  const amount = getPlanPrice(planType);
  const orderNo = generateOrderNo();

  const result = await db.query(
    `INSERT INTO orders (user_id, order_no, plan_type, amount, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING id, order_no, plan_type, amount, status, created_at`,
    [userId, orderNo, planType, amount]
  );

  return result.rows[0];
}

/**
 * 处理支付回调（模拟微信支付）
 * 生产环境中需验证微信支付签名的回调
 */
async function handlePaymentCallback(orderNo, transactionId = null) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 查找并更新订单
    const orderResult = await client.query(
      `UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP
       WHERE order_no = $1 AND status = 'pending'
       RETURNING id, user_id, plan_type, amount`,
      [orderNo]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, message: '订单不存在或已处理' };
    }

    const order = orderResult.rows[0];

    // 计算订阅有效期
    const durationDays = getPlanDays(order.plan_type);

    // 创建/更新订阅
    await client.query(
      `INSERT INTO subscriptions (user_id, order_id, plan_type, start_date, end_date, status)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '${durationDays} days', 'active')
       ON CONFLICT DO NOTHING`,
      [order.user_id, order.id, order.plan_type]
    );

    // 更新用户会员状态
    await client.query(
      `UPDATE users SET membership = 'premium' WHERE id = $1`,
      [order.user_id]
    );

    await client.query('COMMIT');

    return {
      success: true,
      orderId: order.id,
      orderNo,
      planType: order.plan_type,
      amount: order.amount,
      durationDays,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * 获取用户订单列表
 */
async function getUserOrders(userId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const [countResult, ordersResult] = await Promise.all([
    db.query('SELECT COUNT(*)::int FROM orders WHERE user_id = $1', [userId]),
    db.query(
      `SELECT id, order_no, plan_type, amount, status, paid_at, created_at
       FROM orders WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
  ]);

  return {
    list: ordersResult.rows,
    total: countResult.rows[0].count,
    page,
    limit,
  };
}

module.exports = {
  generateOrderNo,
  getPlanPrice,
  getPlanDays,
  createOrder,
  handlePaymentCallback,
  getUserOrders,
};
