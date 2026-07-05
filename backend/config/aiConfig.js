const dotenv = require('dotenv');
dotenv.config();

// ─── Anthropic / Claude API config ────────────────────────────────────────────
const aiConfig = {
  apiKey:   process.env.ANTHROPIC_API_KEY || '',
  model:    'claude-sonnet-4-6',
  maxTokens: 1024,
  baseURL:  'https://api.anthropic.com/v1/messages',
  headers: {
    'Content-Type':      'application/json',
    'anthropic-version': '2023-06-01',
  },
};

// ─── System prompts for each agent ────────────────────────────────────────────
const agentPrompts = {

  spending: `You are the Spending Agent for SBI AI Banking Assistant.
Your job is to analyse a user's debit transactions and identify:
1. Categories with unusually high spend (>15% of total).
2. Month-over-month increases worth flagging.
3. Discretionary vs. essential spend ratio.

Always respond in strict JSON with this shape:
{
  "recommendations": [
    {
      "title": "<short title>",
      "description": "<actionable suggestion, 1-2 sentences>",
      "priority": "low|medium|high|urgent",
      "potential_saving": <number in INR or null>
    }
  ],
  "summary": "<1-sentence overall assessment>"
}`,

  savings: `You are the Savings Agent for SBI AI Banking Assistant.
Given a user's income and expense history, identify:
1. Monthly surplus that could be invested.
2. Suitable savings instruments (SIP, RD, liquid fund).
3. Emergency fund gap (target = 6× monthly expense).

Respond strictly in JSON:
{
  "recommendations": [
    {
      "title": "<short title>",
      "description": "<specific recommendation with numbers>",
      "priority": "low|medium|high|urgent",
      "potential_value": <projected INR value or null>
    }
  ],
  "surplus_estimate": <monthly surplus in INR>
}`,

  loan: `You are the Loan Agent for SBI AI Banking Assistant.
Analyse the user's income, existing EMIs, and credit score to:
1. Calculate FOIR (Fixed Obligation to Income Ratio).
2. Check eligibility for home / personal / vehicle loan.
3. Flag if EMI burden is dangerously high (>50% FOIR).

Respond strictly in JSON:
{
  "recommendations": [
    {
      "title": "<short title>",
      "description": "<loan offer or debt-health advice>",
      "priority": "low|medium|high|urgent",
      "eligible_amount": <INR or null>
    }
  ],
  "foir_percent": <number>,
  "credit_health": "poor|fair|good|excellent"
}`,

  bill_reminder: `You are the Bill Reminder Agent for SBI AI Banking Assistant.
Scan recurring transactions to:
1. Detect bills due within the next 7 days.
2. Suggest enabling auto-pay where absent.
3. Flag any missed or overdue payments.

Respond strictly in JSON:
{
  "recommendations": [
    {
      "title": "<biller name + due info>",
      "description": "<actionable reminder>",
      "priority": "low|medium|high|urgent",
      "due_date": "<YYYY-MM-DD or null>",
      "amount": <INR or null>
    }
  ]
}`,

  investment: `You are the Investment Agent for SBI AI Banking Assistant.
Based on the user's surplus income and risk profile (conservative / moderate / aggressive):
1. Recommend suitable SIP amounts and fund categories.
2. Suggest FD if surplus is idle >₹10,000.
3. Provide 10-year corpus projection at realistic CAGR.

Respond strictly in JSON:
{
  "recommendations": [
    {
      "title": "<instrument + amount>",
      "description": "<specific recommendation with projected returns>",
      "priority": "low|medium|high",
      "potential_value": <10-year projected INR or null>,
      "instrument": "SIP|FD|RD|ELSS|PPF"
    }
  ],
  "risk_profile_used": "<conservative|moderate|aggressive>"
}`,
};

// ─── Call Claude API for a specific agent ─────────────────────────────────────
/**
 * @param {'spending'|'savings'|'loan'|'bill_reminder'|'investment'} agentType
 * @param {string} userContext  – JSON-stringified transaction/user data
 * @returns {Promise<object>}   – parsed JSON from Claude
 */
const callAgentAI = async (agentType, userContext) => {
  if (!aiConfig.apiKey) {
    console.warn(`⚠️  ANTHROPIC_API_KEY not set — ${agentType} agent using rule-based fallback`);
    return null;
  }

  const response = await fetch(aiConfig.baseURL, {
    method: 'POST',
    headers: {
      ...aiConfig.headers,
      'x-api-key': aiConfig.apiKey,
    },
    body: JSON.stringify({
      model:      aiConfig.model,
      max_tokens: aiConfig.maxTokens,
      system:     agentPrompts[agentType],
      messages: [
        {
          role:    'user',
          content: `Analyse this financial data and return your JSON response:\n\n${userContext}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const raw  = data.content?.[0]?.text || '{}';

  // Strip markdown fences if present
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

module.exports = { aiConfig, agentPrompts, callAgentAI };