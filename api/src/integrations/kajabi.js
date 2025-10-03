/**
 * Kajabi Integration
 *
 * Automatically creates CertNode receipts for Kajabi events:
 * - offer.purchased → transaction receipt
 * - member.logged_in → operations receipt
 * - course.completed → content receipt
 * - course.progress → content receipt
 *
 * Setup in Kajabi:
 * Settings → Webhooks → Add Webhook
 * URL: https://certnode.io/api/integrations/kajabi
 * Secret: Your CertNode API key
 */

const { createReceipt, findParentReceipt } = require('./index');

/**
 * Map Kajabi events to CertNode receipt structure
 */
async function handleKajabiWebhook(event, apiKey, enterpriseId) {
  const { type, data } = event;

  switch (type) {
    case 'offer.purchased':
      return await handleOfferPurchased(data, apiKey, enterpriseId);

    case 'member.logged_in':
      return await handleMemberLogin(data, apiKey, enterpriseId);

    case 'course.completed':
      return await handleCourseCompleted(data, apiKey, enterpriseId);

    case 'course.progress':
      return await handleCourseProgress(data, apiKey, enterpriseId);

    case 'assessment.submitted':
      return await handleAssessmentSubmitted(data, apiKey, enterpriseId);

    case 'form.submitted':
      return await handleFormSubmitted(data, apiKey, enterpriseId);

    default:
      console.log(`Unhandled Kajabi event: ${type}`);
      return null;
  }
}

async function handleOfferPurchased(data, apiKey, enterpriseId) {
  // Create transaction receipt for payment
  return await createReceipt({
    apiKey,
    domain: 'transaction',
    type: 'kajabi-purchase',
    data: {
      kajabi_order_id: data.id,
      offer_id: data.offer_id,
      offer_name: data.offer_name,
      amount: data.amount,
      currency: data.currency || 'USD',
      customer_email: data.member?.email,
      customer_name: data.member?.name,
      payment_date: data.created_at,
      payment_method: data.payment_method,
      external_id: data.id // For linking future events
    },
    parentIds: []
  });
}

async function handleMemberLogin(data, apiKey, enterpriseId) {
  // Find the original purchase receipt to link to
  const parentReceipt = await findParentReceipt(enterpriseId, data.member_id);

  return await createReceipt({
    apiKey,
    domain: 'operations',
    type: 'kajabi-login',
    data: {
      member_id: data.member_id,
      member_email: data.member?.email,
      login_timestamp: data.timestamp || new Date().toISOString(),
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      session_id: data.session_id
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

async function handleCourseCompleted(data, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, data.member_id);

  return await createReceipt({
    apiKey,
    domain: 'content',
    type: 'kajabi-course-completed',
    data: {
      member_id: data.member_id,
      member_email: data.member?.email,
      course_id: data.course_id,
      course_name: data.course_name,
      completion_date: data.completed_at,
      total_lessons: data.total_lessons,
      completion_percentage: 100
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

async function handleCourseProgress(data, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, data.member_id);

  return await createReceipt({
    apiKey,
    domain: 'content',
    type: 'kajabi-lesson-viewed',
    data: {
      member_id: data.member_id,
      member_email: data.member?.email,
      course_id: data.course_id,
      lesson_id: data.lesson_id,
      lesson_name: data.lesson_name,
      progress_percentage: data.progress_percentage,
      watch_time_seconds: data.watch_time_seconds,
      completed: data.completed,
      timestamp: data.timestamp || new Date().toISOString()
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

async function handleAssessmentSubmitted(data, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, data.member_id);

  return await createReceipt({
    apiKey,
    domain: 'content',
    type: 'kajabi-assessment-submitted',
    data: {
      member_id: data.member_id,
      assessment_id: data.assessment_id,
      assessment_name: data.assessment_name,
      score: data.score,
      passed: data.passed,
      submitted_at: data.submitted_at
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

async function handleFormSubmitted(data, apiKey, enterpriseId) {
  const parentReceipt = await findParentReceipt(enterpriseId, data.member_id);

  return await createReceipt({
    apiKey,
    domain: 'operations',
    type: 'kajabi-form-submitted',
    data: {
      form_id: data.form_id,
      form_name: data.form_name,
      member_email: data.member?.email,
      responses: data.responses,
      submitted_at: data.submitted_at
    },
    parentIds: parentReceipt ? [parentReceipt.id] : []
  });
}

module.exports = {
  handleKajabiWebhook
};
