// Viral Content Templates for Burstlet
// Pre-made templates to help users create viral content instantly

export interface ContentTemplate {
  id: string;
  name: string;
  category: 'video' | 'blog' | 'social';
  platform?: 'youtube' | 'tiktok' | 'instagram' | 'twitter';
  description: string;
  tags: string[];
  viral_score: number; // 0-100
  estimated_views: string;
  prompt: string;
  audio?: {
    type: 'music' | 'tts';
    style?: string;
    voice?: string;
  };
  thumbnail_style?: string;
  example_url?: string;
}

export const viralTemplates: ContentTemplate[] = [
  // VIDEO TEMPLATES - TikTok/YouTube Shorts Focus
  {
    id: 'mrBeast-challenge',
    name: 'MrBeast Style Challenge',
    category: 'video',
    platform: 'youtube',
    description: 'Create an epic challenge video with high stakes and surprising twists',
    tags: ['challenge', 'viral', 'entertainment', 'surprise'],
    viral_score: 95,
    estimated_views: '1M-10M',
    prompt: 'Create a video showing someone attempting an impossible challenge with $1000 on the line. Start with "I bet you can\'t..." hook, show 3 failed attempts building tension, then reveal an unexpected trick that makes it possible. End with celebration and money reveal.',
    audio: {
      type: 'music',
      style: 'epic_orchestral_buildup'
    },
    thumbnail_style: 'shocked_face_with_money'
  },
  {
    id: 'satisfying-loop',
    name: 'Oddly Satisfying Loop',
    category: 'video',
    platform: 'tiktok',
    description: 'Mesmerizing visual loops that viewers watch repeatedly',
    tags: ['satisfying', 'loop', 'asmr', 'relaxing'],
    viral_score: 88,
    estimated_views: '500K-5M',
    prompt: 'Create a perfectly looping video of colorful liquid being poured into geometric shapes, with each pour creating a rainbow effect. The loop should be seamless and hypnotic, lasting exactly 15 seconds.',
    audio: {
      type: 'music',
      style: 'ambient_asmr'
    }
  },
  {
    id: 'before-after-transformation',
    name: '24-Hour Transformation',
    category: 'video',
    platform: 'instagram',
    description: 'Dramatic before/after reveals that shock viewers',
    tags: ['transformation', 'beforeafter', 'shocking', 'motivation'],
    viral_score: 92,
    estimated_views: '2M-8M',
    prompt: 'Show a messy room/space/project in terrible condition. Fast-forward timelapse of cleaning and organizing with satisfying moments highlighted. Reveal stunning final result with dramatic music drop. Include text overlay: "24 hours later..."',
    audio: {
      type: 'music',
      style: 'cinematic_reveal'
    }
  },
  {
    id: 'ai-breaks-reality',
    name: 'AI Breaks Reality',
    category: 'video',
    platform: 'tiktok',
    description: 'Mind-bending AI visuals that make viewers question reality',
    tags: ['ai', 'mindblowing', 'tech', 'future'],
    viral_score: 90,
    estimated_views: '1M-5M',
    prompt: 'Create a video where everyday objects morph into impossible shapes using AI. Start normal, then gradually make reality "glitch" - walls become liquid, gravity reverses, objects multiply infinitely. End with everything snapping back to normal.',
    audio: {
      type: 'music',
      style: 'glitch_electronic'
    }
  },
  {
    id: 'speed-facts',
    name: '60-Second Mind Blow',
    category: 'video',
    platform: 'youtube',
    description: 'Rapid-fire facts that blow viewers minds',
    tags: ['education', 'facts', 'mindblowing', 'learning'],
    viral_score: 85,
    estimated_views: '500K-3M',
    prompt: 'Present 10 unbelievable but true facts in 60 seconds with visual representations. Each fact should be more shocking than the last. Use countdown timer and fast transitions. End with "Follow for more mind-blowing facts daily!"',
    audio: {
      type: 'tts',
      voice: 'energetic_male'
    }
  },

  // BLOG TEMPLATES - SEO Optimized
  {
    id: 'ultimate-guide-2025',
    name: 'Ultimate Guide Template',
    category: 'blog',
    description: 'Comprehensive guides that rank #1 on Google',
    tags: ['seo', 'guide', 'evergreen', 'authority'],
    viral_score: 82,
    estimated_views: '50K-500K monthly',
    prompt: 'Write "The Ultimate Guide to [TOPIC] in 2025" with: 1) Hook addressing main pain point 2) Table of contents 3) 10 detailed sections with subheadings 4) Actionable tips in each section 5) Visual break suggestions 6) FAQ section 7) Conclusion with CTA. Target 3000+ words.',
    example_url: 'https://example.com/ultimate-guide-template'
  },
  {
    id: 'controversy-breakdown',
    name: 'Drama Explained',
    category: 'blog',
    description: 'Break down trending controversies for massive traffic',
    tags: ['trending', 'drama', 'news', 'viral'],
    viral_score: 94,
    estimated_views: '100K-1M in 48 hours',
    prompt: 'Write "[CELEBRITY/BRAND] Drama Explained: Everything You Need to Know" with: Timeline of events, Key players involved, Screenshots/evidence summary, Public reactions, Expert opinions, What happens next, Update section for new developments.',
    example_url: 'https://example.com/drama-template'
  },
  {
    id: 'ai-tool-comparison',
    name: 'AI Tools Showdown',
    category: 'blog',
    description: 'Compare trending AI tools for high-intent traffic',
    tags: ['ai', 'comparison', 'tools', 'tech'],
    viral_score: 87,
    estimated_views: '25K-250K monthly',
    prompt: 'Write "[TOOL1] vs [TOOL2] vs [TOOL3]: Which AI Tool Wins in 2025?" Include: Feature comparison table, Pricing breakdown, Use case scenarios, Pros/cons lists, Speed tests, Quality examples, Winner declaration, Affiliate links section.',
    example_url: 'https://example.com/ai-comparison-template'
  },

  // SOCIAL MEDIA TEMPLATES
  {
    id: 'twitter-thread-story',
    name: 'Viral Thread Story',
    category: 'social',
    platform: 'twitter',
    description: 'Compelling story threads that get 10K+ retweets',
    tags: ['thread', 'story', 'viral', 'engagement'],
    viral_score: 91,
    estimated_views: '1M-10M impressions',
    prompt: 'Write a 10-tweet thread: "I just discovered something about [TOPIC] that changes everything 🧵" Each tweet should end with a cliffhanger. Include surprising revelation in tweet 7, actionable advice in tweet 9, and CTA in tweet 10.',
    example_url: 'https://twitter.com/example/thread'
  },
  {
    id: 'instagram-carousel-tips',
    name: 'Swipeable Tips Carousel',
    category: 'social',
    platform: 'instagram',
    description: 'Educational carousels that get saved and shared',
    tags: ['carousel', 'tips', 'education', 'valuable'],
    viral_score: 86,
    estimated_views: '100K-1M reach',
    prompt: 'Create 10-slide carousel: "10 [TOPIC] Hacks That Will Change Your Life" Slide 1: Bold hook with problem statement. Slides 2-9: One tip per slide with visual description. Slide 10: Summary and "Save this post!" CTA.',
    example_url: 'https://instagram.com/p/example'
  },
  {
    id: 'tiktok-text-reveal',
    name: 'Text Message Drama',
    category: 'social',
    platform: 'tiktok',
    description: 'Dramatic text conversations that keep viewers hooked',
    tags: ['drama', 'texts', 'storytime', 'reveal'],
    viral_score: 93,
    estimated_views: '2M-20M views',
    prompt: 'Create a video showing dramatic text conversation with plot twist. Start with "I can\'t believe my [PERSON] sent me this..." Show texts one by one with suspenseful music. Build to shocking revelation. End with "Part 2?" to drive engagement.',
    audio: {
      type: 'music',
      style: 'suspense_buildup'
    }
  },
  {
    id: 'motivation-reel',
    name: 'Monday Motivation Hit',
    category: 'social',
    platform: 'instagram',
    description: 'Motivational content that gets shared every Monday',
    tags: ['motivation', 'monday', 'inspiration', 'mindset'],
    viral_score: 84,
    estimated_views: '500K-2M reach',
    prompt: 'Create motivational reel: Start with relatable struggle, show transformation montage with powerful music, overlay text with short powerful phrases, end with "You\'ve got this. Happy Monday 💪" Include trending motivational audio.',
    audio: {
      type: 'music',
      style: 'motivational_epic'
    }
  },

  // SPECIAL HIGH-VIRAL TEMPLATES
  {
    id: 'breaking-news-style',
    name: 'Breaking News Generator',
    category: 'video',
    description: 'News-style videos about anything that grab attention',
    tags: ['news', 'breaking', 'urgent', 'attention'],
    viral_score: 96,
    estimated_views: '5M-50M',
    prompt: 'Create breaking news style video about [MUNDANE TOPIC]. Use news graphics, urgent music, "BREAKING:" text overlays. Present ordinary information as shocking discovery. Include "expert" commentary and viewer reactions. End with "More updates to follow."',
    audio: {
      type: 'music',
      style: 'news_urgent'
    }
  },
  {
    id: 'infinite-money-glitch',
    name: 'Life Hack Money Saver',
    category: 'video',
    platform: 'tiktok',
    description: 'Money-saving "glitches" that viewers must try',
    tags: ['money', 'hack', 'savings', 'lifehack'],
    viral_score: 97,
    estimated_views: '10M-100M',
    prompt: 'Reveal "infinite money glitch" (legal life hack): Show everyday expensive problem, reveal simple solution that saves hundreds, demonstrate step-by-step, show shocked reactions, calculate yearly savings. Title: "The [COMPANY] doesn\'t want you to know this..."',
    audio: {
      type: 'music',
      style: 'discovery_revelation'
    }
  }
];

// Helper function to get templates by category
export const getTemplatesByCategory = (category: 'video' | 'blog' | 'social') => {
  return viralTemplates.filter(t => t.category === category);
};

// Helper function to get top viral templates
export const getTopViralTemplates = (limit: number = 5) => {
  return [...viralTemplates].sort((a, b) => b.viral_score - a.viral_score).slice(0, limit);
};

// Helper function to get platform-specific templates
export const getTemplatesByPlatform = (platform: string) => {
  return viralTemplates.filter(t => t.platform === platform);
};

// Helper function to search templates by tags
export const searchTemplatesByTags = (tags: string[]) => {
  return viralTemplates.filter(t => 
    tags.some(tag => t.tags.includes(tag.toLowerCase()))
  );
};