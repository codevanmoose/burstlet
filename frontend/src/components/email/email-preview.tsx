'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { 
  Monitor, 
  Smartphone, 
  Copy, 
  Send,
  ExternalLink,
  Clock,
  Eye,
  MousePointer
} from 'lucide-react';
import { EmailTemplate } from '@/data/email-sequences';
import { toast } from 'react-hot-toast';

interface EmailPreviewProps {
  email: EmailTemplate;
  isOpen: boolean;
  onClose: () => void;
}

export function EmailPreview({ email, isOpen, onClose }: EmailPreviewProps) {
  const handleCopyHTML = () => {
    // In production, this would copy the full HTML
    toast.success('Email HTML copied to clipboard');
  };

  const handleSendTest = () => {
    // In production, this would send a test email
    toast.success('Test email sent to your inbox');
  };

  // Convert markdown-style content to HTML preview
  const renderEmailContent = (content: string) => {
    return content
      .split('\n\n')
      .map((paragraph, i) => {
        // Handle CTAs
        if (paragraph.includes('{{cta}}')) {
          return (
            <div key={i} className="text-center my-6">
              <a
                href={email.cta.url}
                className="inline-block px-8 py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                {email.cta.text}
              </a>
            </div>
          );
        }
        
        // Handle bold text
        const boldText = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Handle headers
        if (paragraph.startsWith('#')) {
          return (
            <h3 key={i} className="text-xl font-bold mb-4" dangerouslySetInnerHTML={{ __html: boldText }} />
          );
        }
        
        // Handle lists
        if (paragraph.includes('- ')) {
          const items = paragraph.split('\n').filter(line => line.startsWith('- '));
          return (
            <ul key={i} className="list-disc list-inside space-y-2 mb-4">
              {items.map((item, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: item.substring(2) }} />
              ))}
            </ul>
          );
        }
        
        // Regular paragraph
        return (
          <p key={i} className="mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: boldText }} />
        );
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{email.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {email.delay ? `${email.delay}h delay` : 'Immediate'}
                </Badge>
                {email.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyHTML}>
                <Copy className="h-3 w-3 mr-1" />
                Copy HTML
              </Button>
              <Button size="sm" onClick={handleSendTest}>
                <Send className="h-3 w-3 mr-1" />
                Send Test
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="desktop" className="flex-1">
          <div className="px-6">
            <TabsList>
              <TabsTrigger value="desktop" className="gap-2">
                <Monitor className="h-4 w-4" />
                Desktop
              </TabsTrigger>
              <TabsTrigger value="mobile" className="gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile
              </TabsTrigger>
              <TabsTrigger value="metrics">
                Metrics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="desktop" className="h-full overflow-auto p-6 pt-4">
            <div className="max-w-2xl mx-auto">
              {/* Email Header */}
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
                <div className="text-center mb-6">
                  <div className="inline-block p-3 bg-purple-100 rounded-lg mb-4">
                    <span className="text-2xl font-bold text-purple-600">B</span>
                  </div>
                  <h1 className="text-2xl font-bold">Burstlet</h1>
                </div>
                
                {/* Subject Line */}
                <div className="border-b pb-4 mb-4">
                  <p className="text-sm text-gray-500">Subject</p>
                  <p className="font-semibold">{email.subject}</p>
                </div>
                
                {/* Preheader */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600">{email.preheader}</p>
                </div>
                
                {/* Email Body */}
                <div className="text-gray-700">
                  {renderEmailContent(email.content)}
                </div>
                
                {/* Footer */}
                <div className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
                  <p className="mb-2">Burstlet Inc. | 123 Creator Street, San Francisco, CA 94105</p>
                  <p>
                    <a href="#" className="text-purple-600 hover:underline">Unsubscribe</a>
                    {' • '}
                    <a href="#" className="text-purple-600 hover:underline">Update Preferences</a>
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mobile" className="h-full overflow-auto p-6 pt-4">
            <div className="max-w-sm mx-auto">
              <div className="bg-white rounded-lg shadow-sm border">
                {/* Mobile Email View */}
                <div className="p-4">
                  <div className="text-center mb-4">
                    <div className="inline-block p-2 bg-purple-100 rounded-lg mb-2">
                      <span className="text-xl font-bold text-purple-600">B</span>
                    </div>
                    <h1 className="text-xl font-bold">Burstlet</h1>
                  </div>
                  
                  <div className="border-b pb-3 mb-3">
                    <p className="text-xs text-gray-500">Subject</p>
                    <p className="font-medium text-sm">{email.subject}</p>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    {renderEmailContent(email.content)}
                  </div>
                  
                  <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                    <p>© Burstlet Inc.</p>
                    <p className="mt-1">
                      <a href="#" className="text-purple-600">Unsubscribe</a>
                      {' • '}
                      <a href="#" className="text-purple-600">Preferences</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="h-full overflow-auto p-6 pt-4">
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Expected Performance</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Eye className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold">45-65%</p>
                    <p className="text-sm text-muted-foreground">Open Rate</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <MousePointer className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">20-35%</p>
                    <p className="text-sm text-muted-foreground">Click Rate</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold">10-25%</p>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Best Practices Applied</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Personalization</p>
                      <p className="text-sm text-muted-foreground">
                        Uses recipient's name and behavior data
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Clear CTA</p>
                      <p className="text-sm text-muted-foreground">
                        Single, prominent call-to-action button
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Mobile Optimized</p>
                      <p className="text-sm text-muted-foreground">
                        Responsive design for all devices
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Social Proof</p>
                      <p className="text-sm text-muted-foreground">
                        Includes success stories and testimonials
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Add missing imports
import { CheckCircle2, DollarSign } from 'lucide-react';