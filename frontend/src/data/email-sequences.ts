// Email Marketing Sequences for Burstlet
// Automated sequences for conversion, retention, and growth

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  content: string;
  cta: {
    text: string;
    url: string;
  };
  delay?: number; // hours after trigger
  tags: string[];
}

export interface EmailSequence {
  id: string;
  name: string;
  description: string;
  trigger: 'signup' | 'trial_start' | 'first_video' | 'payment' | 'inactive' | 'churn';
  emails: EmailTemplate[];
  expectedConversion: number; // percentage
}

export const emailSequences: EmailSequence[] = [
  // WELCOME SERIES - Convert trials to paid (40% conversion target)
  {
    id: 'welcome-series',
    name: 'Welcome & Onboarding Series',
    description: '5-email series to convert trial users to paid subscribers',
    trigger: 'signup',
    expectedConversion: 40,
    emails: [
      {
        id: 'welcome-1',
        name: 'Welcome to Burstlet',
        subject: '🎬 Your first viral video awaits (+ surprise inside)',
        preheader: 'Create your first video in 60 seconds',
        content: `Hi {{firstName}},

Welcome to Burstlet! 🚀

You're about to join thousands of creators making viral content with AI. But first, I have a surprise for you...

**🎁 Your Welcome Gift: 3 Extra Video Credits**
(Already added to your account!)

Here's how to create your first viral video in 60 seconds:

1. Click the button below
2. Choose the "MrBeast Challenge" template (95% viral rate!)
3. Click generate
4. Watch the magic happen ✨

{{cta}}

Fun fact: Sarah M. created her first video with Burstlet and got 2.3M views on TikTok. Her secret? She used our viral templates.

Ready to go viral?

-Jake
CEO & Founder, Burstlet

P.S. Your trial includes 5 free videos. Most creators use them all on day 1 because they're addicted to the results 😄`,
        cta: {
          text: 'Create My First Video',
          url: '/dashboard/generate'
        },
        delay: 0,
        tags: ['welcome', 'onboarding', 'conversion']
      },
      {
        id: 'welcome-2',
        name: 'Success Story',
        subject: 'How Mike went from 1K to 100K followers in 30 days',
        preheader: 'His secret? One simple template...',
        content: `Hey {{firstName}},

Quick story for you:

Mike was stuck at 1,000 followers for months. Creating content was exhausting - filming, editing, posting... 

Then he discovered Burstlet's "Satisfying Loop" template.

**The result? 100K followers in 30 days.**

Here's exactly what he did:
- Generated 3 videos daily (6 minutes total)
- Used our viral templates exclusively  
- Posted consistently at peak times
- Total cost: $45

Want to see the exact template he used?

{{cta}}

I'm sharing this because I want YOU to have the same success. 

The templates are proven. The AI is powerful. All you need to do is press generate.

Talk soon,
Jake

P.S. I noticed you haven't created your first video yet. The average Burstlet user sees results within 48 hours of their first post. Just saying 😉`,
        cta: {
          text: 'Show Me The Template',
          url: '/dashboard/generate?template=satisfying-loop'
        },
        delay: 24,
        tags: ['success-story', 'social-proof', 'conversion']
      },
      {
        id: 'welcome-3',
        name: 'Feature Spotlight',
        subject: '🤯 You can schedule 30 videos in 10 minutes',
        preheader: 'Set it and forget it',
        content: `{{firstName}}, this changes everything...

Most creators burn out because content creation never stops.

But what if you could create a month of content in 10 minutes?

**Here's how Burstlet's bulk generation works:**

1. Choose your templates
2. Set quantity (up to 30)
3. Click "Generate All"
4. Schedule across all platforms
5. Go live your life 🏖️

Jessica L. uses this every Sunday. She spends 10 minutes creating content for the entire week, then focuses on her business.

Her results? 5M+ views per month on autopilot.

{{cta}}

Plus, with our scheduling feature, you can:
- Post at optimal times automatically
- Maintain consistency without effort
- Cross-post to all platforms instantly
- Track everything from one dashboard

The best part? This is included in every plan.

-Jake

P.S. Your trial has {{remainingCredits}} videos left. Many users upgrade just for unlimited bulk generation. Worth considering?`,
        cta: {
          text: 'Try Bulk Generation',
          url: '/dashboard/generate?feature=bulk'
        },
        delay: 72,
        tags: ['feature', 'automation', 'conversion']
      },
      {
        id: 'welcome-4',
        name: 'Urgency + Social Proof',
        subject: '{{firstName}}, your trial ends in 3 days',
        preheader: 'Don't lose your viral momentum',
        content: `Hey {{firstName}},

Real talk - your trial ends in 3 days.

I wanted to share what other creators discovered after upgrading:

"I was skeptical about paying $29/month. Now I make $3K/month from brand deals thanks to my Burstlet-grown audience." - Emma K.

"The ROI is insane. I spend $29, create content that would cost $5,000 with editors." - David R.

"My videos get 10x more views with Burstlet templates. It pays for itself with one viral video." - Lisa T.

**Your stats so far:**
- Videos created: {{videosCreated}}
- Total views: {{totalViews}}
- Best performing: {{bestVideo}}
- Potential reach: {{potentialReach}}

At this rate, you could hit {{projectedFollowers}} followers in 90 days.

But only if you keep the momentum going...

{{cta}}

Special offer: Upgrade now and get 30% off your first 3 months with code TRIAL30.

Don't let your viral moment pass.

-Jake

P.S. After your trial, you lose access to:
- Viral templates library
- Bulk generation
- Multi-platform posting
- Analytics dashboard

Is saving $29 worth losing all that?`,
        cta: {
          text: 'Secure My Discount',
          url: '/dashboard/billing?code=TRIAL30'
        },
        delay: 96,
        tags: ['urgency', 'social-proof', 'conversion']
      },
      {
        id: 'welcome-5',
        name: 'Last Chance',
        subject: '⏰ 24 hours left (+ exclusive bonus)',
        preheader: 'CEO personal offer inside',
        content: `{{firstName}},

Your trial expires tomorrow.

I don't want to see you leave, so I'm making you an offer I've never made before:

**Upgrade in the next 24 hours and get:**
- 50% off for 6 months (save $87)
- 100 bonus video credits
- 1-on-1 strategy call with our growth team
- Early access to new features

Use code: LASTCHANCE50

{{cta}}

Look, I built Burstlet because I was tired of seeing talented creators struggle with content creation.

You've already created {{videosCreated}} videos. You've seen the potential.

Don't go back to the old way of doing things.

This offer expires when your trial does. No extensions.

-Jake
CEO, Burstlet

P.S. If price is the only concern, reply to this email. I might have something for you.`,
        cta: {
          text: 'Claim 50% Off Now',
          url: '/dashboard/billing?code=LASTCHANCE50'
        },
        delay: 144,
        tags: ['urgency', 'exclusive', 'final-conversion']
      }
    ]
  },

  // ABANDONED VIDEO RECOVERY - 25% recovery rate
  {
    id: 'abandoned-video',
    name: 'Abandoned Video Recovery',
    description: 'Recover users who started but didn\'t finish video creation',
    trigger: 'first_video',
    expectedConversion: 25,
    emails: [
      {
        id: 'abandoned-1',
        name: 'Video Waiting',
        subject: '🎬 Your video is 90% complete!',
        preheader: 'One click to finish',
        content: `Hey {{firstName}},

You were SO close!

Your {{templateName}} video is sitting at 90% complete. All it needs is one final click.

I'd hate to see you miss out on potential millions of views because of a technical hiccup.

{{cta}}

If you ran into any issues, just reply to this email. I personally read every response and will help you out.

-Jake

P.S. Fun fact: Videos created with the {{templateName}} template average {{avgViews}} views. Your video could be next!`,
        cta: {
          text: 'Complete My Video',
          url: '/dashboard/generate?resume=true'
        },
        delay: 2,
        tags: ['recovery', 'abandoned', 'helpful']
      }
    ]
  },

  // WEEKLY ENGAGEMENT - Keep users active
  {
    id: 'weekly-trends',
    name: 'Weekly Viral Trends',
    description: 'Weekly email with trending templates and tips',
    trigger: 'payment',
    expectedConversion: 15,
    emails: [
      {
        id: 'weekly-1',
        name: 'Weekly Trends',
        subject: '🔥 This week\'s viral formula (87M views)',
        preheader: 'Plus: New template alert',
        content: `Happy Monday {{firstName}}!

The numbers are in, and this week's viral champion is...

**"AI Breaks Reality" Template**
- 87M total views
- 12% engagement rate  
- Works best on: TikTok

Here's why it's working:
1. Starts normal (hooks viewers)
2. Gradually gets weird (maintains attention)
3. Snaps back to reality (shareable moment)

{{cta}}

**🆕 New Template Alert: "Infinite Money Glitch"**

This one's controversial but EFFECTIVE. It reveals legal "life hacks" that save money. Early adopters seeing 5M+ views.

**📊 Your Weekly Stats:**
- Videos created: {{weeklyVideos}}
- Total views: {{weeklyViews}} 
- Best performer: {{bestWeeklyVideo}}
- Viral coefficient: {{viralCoeff}}

**🎯 Pro Tip of the Week:**
Post at 6 PM EST on Tuesdays. Our data shows 47% higher engagement vs other times.

Keep creating!
-The Burstlet Team`,
        cta: {
          text: 'Try This Week\'s Template',
          url: '/dashboard/generate?template=ai-breaks-reality'
        },
        delay: 168,
        tags: ['engagement', 'weekly', 'trends']
      }
    ]
  },

  // WIN-BACK CAMPAIGN - Re-engage churned users
  {
    id: 'win-back',
    name: 'Win-Back Campaign',
    description: 'Re-engage users who cancelled or became inactive',
    trigger: 'churn',
    expectedConversion: 18,
    emails: [
      {
        id: 'winback-1',
        name: 'We Miss You',
        subject: '{{firstName}}, your audience misses you',
        preheader: 'Plus: What\'s new at Burstlet',
        content: `Hey {{firstName}},

It's been a while! Your last video was {{daysSinceLastVideo}} days ago.

Your audience is probably wondering where you went...

Since you've been gone, we've added:
- 15 new viral templates
- TikTok Live integration
- AI voice cloning
- 10x faster generation

But here's the real reason I'm reaching out...

**We analyzed your old videos and found something interesting:**

Your content style is perfect for our new "Story Time" template. Users are getting 10M+ views with it.

Want to give it a try? Here's a special welcome back offer:

**70% off for 2 months + 200 bonus credits**
Code: COMEBACK70

{{cta}}

No pressure, but your competition is using Burstlet to dominate your niche. Just saying.

-Jake

P.S. {{competitorName}} grew from {{competitorBefore}} to {{competitorAfter}} followers while you were away. Time to catch up?`,
        cta: {
          text: 'Claim Welcome Back Offer',
          url: '/dashboard/billing?code=COMEBACK70'
        },
        delay: 168,
        tags: ['win-back', 'reactivation', 'special-offer']
      },
      {
        id: 'winback-2',
        name: 'Success Story Follow-up',
        subject: 'From 0 to 1M followers after coming back',
        preheader: 'True story inside',
        content: `{{firstName}},

Quick story about someone just like you:

Marcus quit creating content for 3 months. Burned out. Frustrated. Sound familiar?

Then he came back to Burstlet with a new approach:
- 1 video per day
- Only used templates
- No overthinking

Result? 1M followers in 60 days.

His secret: He stopped trying to be perfect and let the templates do the work.

Your comeback could be even bigger.

Last chance for 70% off: COMEBACK70

{{cta}}

-Jake

P.S. The creator economy is worth $104B now. There's never been a better time to return.`,
        cta: {
          text: 'Start My Comeback',
          url: '/dashboard/billing?code=COMEBACK70'
        },
        delay: 336,
        tags: ['win-back', 'story', 'final-attempt']
      }
    ]
  },

  // REFERRAL ACTIVATION - Turn users into advocates
  {
    id: 'referral-activation',
    name: 'Referral Program Activation',
    description: 'Encourage users to refer friends',
    trigger: 'payment',
    expectedConversion: 30,
    emails: [
      {
        id: 'referral-1',
        name: 'Earn Free Months',
        subject: '🎁 Give 3 months, get 3 months FREE',
        preheader: 'Limited time referral bonus',
        content: `{{firstName}}, you're crushing it!

Your videos have {{totalViews}} total views. That's incredible!

Want to know what's even better? Getting Burstlet for FREE.

**For the next 48 hours only:**
- Give friends 3 months free (usually 1)
- Get 3 months free yourself (usually 1)
- Stack unlimited rewards

Your unique code: {{referralCode}}
Your referral link: {{referralLink}}

{{cta}}

Sarah M. referred 8 friends last month. She won't pay for Burstlet until 2026.

Smart creators build together. Who will you invite?

-Jake

P.S. This 3-for-3 deal ends Thursday at midnight. After that, it's back to 1 month rewards.`,
        cta: {
          text: 'Share & Earn Now',
          url: '/dashboard/referrals'
        },
        delay: 168,
        tags: ['referral', 'engagement', 'retention']
      }
    ]
  }
];

// Helper functions
export const getSequenceByTrigger = (trigger: string) => {
  return emailSequences.find(s => s.trigger === trigger);
};

export const personalizeEmail = (email: EmailTemplate, userData: Record<string, any>) => {
  let personalizedContent = email.content;
  let personalizedSubject = email.subject;
  
  // Replace all variables in content and subject
  Object.entries(userData).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    personalizedContent = personalizedContent.replace(regex, String(value));
    personalizedSubject = personalizedSubject.replace(regex, String(value));
  });
  
  // Update CTA URL with user params if needed
  const ctaUrl = email.cta.url.includes('?') 
    ? `${email.cta.url}&userId=${userData.userId}`
    : `${email.cta.url}?userId=${userData.userId}`;
  
  return {
    ...email,
    content: personalizedContent,
    subject: personalizedSubject,
    cta: {
      ...email.cta,
      url: ctaUrl
    }
  };
};

// Calculate optimal send time based on user timezone and behavior
export const getOptimalSendTime = (userTimezone: string, userActivity: any[]) => {
  // Analyze when user is most active
  // Default to 10 AM in user's timezone if no data
  return new Date(); // Simplified for now
};