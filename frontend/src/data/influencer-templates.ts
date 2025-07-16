// Influencer Outreach Templates
// Personalized templates for reaching out to different influencer tiers and niches

export interface InfluencerTemplate {
  id: string;
  name: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'linkedin';
  followerRange: string;
  niche: string;
  subject?: string; // For email/LinkedIn
  message: string;
  followUp?: string;
  offerType: 'free_account' | 'commission' | 'flat_fee' | 'equity';
  estimatedResponseRate: number;
  variables: string[]; // Variables to replace in template
}

export const influencerTemplates: InfluencerTemplate[] = [
  // MICRO-INFLUENCERS (10K-100K followers) - Highest engagement rates
  {
    id: 'micro-tiktok-creator',
    name: 'TikTok Micro-Creator Outreach',
    platform: 'tiktok',
    followerRange: '10K-100K',
    niche: 'content_creation',
    message: `Hey {{name}}! 👋

Just watched your {{recent_video}} - the editing is fire! 🔥

I noticed you spend hours creating content. What if you could make viral videos in just 2 minutes?

I'm from Burstlet, an AI tool that's helping creators like {{similar_creator}} get millions of views with zero filming.

Want to try it free for 6 months? You'd also get:
- 50% commission on anyone who signs up with your code
- Early access to new features
- Direct line to our team

Down to chat? Here's a 1-min demo: {{demo_link}}

- {{your_name}}`,
    followUp: `Hey {{name}}! Following up on my message about Burstlet.

{{similar_creator}} just hit 5M views using our MrBeast template. Want me to show you how they did it?

Still offering 6 months free + commissions 💰`,
    offerType: 'commission',
    estimatedResponseRate: 25,
    variables: ['name', 'recent_video', 'similar_creator', 'demo_link', 'your_name']
  },
  {
    id: 'instagram-reels-creator',
    name: 'Instagram Reels Creator',
    platform: 'instagram',
    followerRange: '20K-150K',
    niche: 'lifestyle',
    message: `Hi {{name}}! 

Your recent reel about {{topic}} was genius - especially the {{specific_detail}} part!

I run growth at Burstlet, where we help creators make viral content without filming. Our users are getting 10x more views with 90% less work.

For creators with your engagement rates, we're offering:
✅ Lifetime Pro account (worth $2,400/year)
✅ $100 per 10 signups from your audience
✅ Custom templates based on YOUR top content

Interested? I can show you how {{competitor}} grew from 50K to 500K using Burstlet.

Best,
{{your_name}}`,
    offerType: 'commission',
    estimatedResponseRate: 20,
    variables: ['name', 'topic', 'specific_detail', 'competitor', 'your_name']
  },

  // MACRO-INFLUENCERS (100K-1M followers)
  {
    id: 'youtube-shorts-star',
    name: 'YouTube Shorts Creator',
    platform: 'youtube',
    followerRange: '100K-1M',
    niche: 'entertainment',
    subject: 'Partnership Opportunity - Help Your Audience Create Viral Content Like You',
    message: `Hi {{name}},

Huge fan of your Shorts! Your {{viral_video}} with {{view_count}} views was incredible.

I'm {{your_name}}, Head of Creator Partnerships at Burstlet. We're an AI platform that helps people create viral videos like yours - without any filming or editing.

We'd love to partner with you:

**What You Get:**
- $5,000 upfront partnership fee
- $50 per customer from your audience (avg creator makes $2-3K/month)
- Co-branded templates based on YOUR viral formulas
- Feature in our app as "{{name}}'s Style"

**What We Need:**
- 1 dedicated video showing Burstlet
- 3 story posts over 30 days
- Your input on template creation (1 hour call)

Our last partnership with {{similar_creator}} drove 2,000+ signups in the first week.

Can we schedule a 15-minute call this week? Here's my calendar: {{calendar_link}}

Best,
{{your_name}}
Head of Creator Partnerships, Burstlet`,
    offerType: 'flat_fee',
    estimatedResponseRate: 15,
    variables: ['name', 'viral_video', 'view_count', 'your_name', 'similar_creator', 'calendar_link']
  },

  // BUSINESS INFLUENCERS
  {
    id: 'linkedin-thought-leader',
    name: 'LinkedIn Business Influencer',
    platform: 'linkedin',
    followerRange: '50K-500K',
    niche: 'business',
    subject: 'How AI is Revolutionizing Content Creation for Businesses',
    message: `Hi {{name}},

Your post about {{recent_topic}} resonated deeply - especially your point about {{key_insight}}.

I'm building Burstlet to solve a problem you highlighted: businesses need more video content but lack resources.

We help companies create professional videos in 2 minutes using AI, at 1/100th the cost of traditional production.

Given your influence in the {{industry}} space, I'd love to offer you:
- Exclusive lifetime access to our Enterprise plan
- Revenue share on any business referrals (typically $500-2000 per company)
- Co-hosting opportunity for our "AI in Business" webinar series

A few notable companies using Burstlet: {{company_examples}}

Worth a quick call? I'm free {{availability}}.

Best regards,
{{your_name}}
CEO & Co-founder, Burstlet`,
    offerType: 'commission',
    estimatedResponseRate: 30,
    variables: ['name', 'recent_topic', 'key_insight', 'industry', 'company_examples', 'availability', 'your_name']
  },

  // MEGA-INFLUENCERS (1M+ followers)
  {
    id: 'mega-influencer-equity',
    name: 'Mega Influencer Equity Deal',
    platform: 'tiktok',
    followerRange: '1M+',
    niche: 'any',
    subject: 'Equity Partnership Opportunity - Join Burstlet as Strategic Advisor',
    message: `Dear {{name}},

Your content has redefined what's possible on social media. {{specific_achievement}} was groundbreaking.

I'm {{your_name}}, CEO of Burstlet. We're democratizing your superpower - creating viral content - through AI.

I'd like to discuss a strategic partnership:

**Equity Package:**
- 0.5% equity stake (potential value: $5M+ at our Series A valuation)
- $25,000 signing bonus
- Monthly advisor fee: $5,000
- Revenue share on all referrals

**Your Involvement:**
- Monthly 1-hour advisory calls
- Quarterly content featuring Burstlet
- Co-create "{{name}} Mode" in our app
- Speaking slot at our creator summit

MrBeast's team is already testing our platform. {{other_mega_influencer}} just signed on as an advisor.

This is bigger than a sponsorship - it's about building the future of content creation together.

Available for a call this week? My assistant can work around your schedule: {{assistant_email}}

Excited to connect,
{{your_name}}
CEO & Founder, Burstlet

P.S. Check out what we built inspired by your {{famous_series}} series: {{demo_link}}`,
    offerType: 'equity',
    estimatedResponseRate: 10,
    variables: ['name', 'specific_achievement', 'your_name', 'other_mega_influencer', 'assistant_email', 'famous_series', 'demo_link']
  },

  // NICHE SPECIALISTS
  {
    id: 'education-creator',
    name: 'Educational Content Creator',
    platform: 'youtube',
    followerRange: '25K-250K',
    niche: 'education',
    message: `Hi {{name}}!

Your tutorial on {{topic}} was brilliant - the way you explained {{concept}} finally made it click for me!

I'm reaching out because Burstlet could help you create 10x more educational content without the filming hassle.

Special offer for edu-creators like you:
📚 Free "Educator Pro" account forever
💰 $2 per student who signs up (teachers typically earn $500-2000/month)
🎓 Co-create educational templates with your teaching style
🏆 "{{name}} Certified" badge for your students' content

We're partnering with top educators to democratize knowledge sharing. {{other_educator}} is already creating 5 videos daily with Burstlet!

Quick 10-min demo? I can show you our "Explain Like I'm 5" template that's getting millions of views.

Cheers,
{{your_name}}
Education Partnerships, Burstlet`,
    offerType: 'free_account',
    estimatedResponseRate: 35,
    variables: ['name', 'topic', 'concept', 'other_educator', 'your_name']
  },

  // EMERGING CREATORS
  {
    id: 'rising-star',
    name: 'Rising Star Program',
    platform: 'tiktok',
    followerRange: '5K-20K',
    niche: 'any',
    message: `Hey {{name}}! 🌟

Saw your {{recent_video}} blow up - {{view_count}} views is insane for a newer creator!

You've got that special sauce, and I think Burstlet could help you grow even faster.

We're launching our "Rising Stars" program:
🚀 1 year free access (worth $1,200)
📈 Mentorship from creators with 1M+ followers
💎 Early access to viral trends and templates
🤝 Collab opportunities with other rising stars

Only accepting 50 creators this month. You in?

Hit me back and I'll fast-track your application!

- {{your_name}}
Burstlet Rising Stars Program`,
    offerType: 'free_account',
    estimatedResponseRate: 40,
    variables: ['name', 'recent_video', 'view_count', 'your_name']
  }
];

// Helper functions
export const getTemplatesByPlatform = (platform: string) => {
  return influencerTemplates.filter(t => t.platform === platform);
};

export const getTemplatesByFollowerRange = (min: number, max: number) => {
  return influencerTemplates.filter(t => {
    const range = t.followerRange.toLowerCase();
    if (range.includes('k')) {
      const numbers = range.match(/\d+/g);
      if (numbers) {
        const minRange = parseInt(numbers[0]) * 1000;
        const maxRange = numbers[1] ? parseInt(numbers[1]) * 1000 : minRange * 10;
        return min >= minRange && max <= maxRange;
      }
    }
    return false;
  });
};

export const personalizeTemplate = (template: InfluencerTemplate, variables: Record<string, string>) => {
  let personalizedMessage = template.message;
  let personalizedFollowUp = template.followUp;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    personalizedMessage = personalizedMessage.replace(regex, value);
    if (personalizedFollowUp) {
      personalizedFollowUp = personalizedFollowUp.replace(regex, value);
    }
  });
  
  return {
    ...template,
    message: personalizedMessage,
    followUp: personalizedFollowUp
  };
};