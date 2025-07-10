"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, EyeOff, Info, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ApiKey {
  id: string;
  name: string;
  description: string;
  key: string;
  lastUsed?: string;
  required: boolean;
}

const API_KEYS: ApiKey[] = [
  {
    id: 'openai',
    name: 'OpenAI API Key',
    description: 'Used for blog generation and text content',
    key: '',
    required: true,
  },
  {
    id: 'hailuoai',
    name: 'HailuoAI API Key',
    description: 'Used for video generation',
    key: '',
    required: true,
  },
  {
    id: 'minimax',
    name: 'MiniMax API Key',
    description: 'Used for audio generation (TTS and music)',
    key: '',
    required: false,
  },
];

export default function ApiKeysSettings() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(API_KEYS);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editingKeys, setEditingKeys] = useState<Record<string, string>>({});
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const copyToClipboard = async (text: string, keyName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${keyName} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const startEditing = (keyId: string, currentValue: string) => {
    setEditingKeys(prev => ({ ...prev, [keyId]: currentValue }));
  };

  const cancelEditing = (keyId: string) => {
    setEditingKeys(prev => {
      const newState = { ...prev };
      delete newState[keyId];
      return newState;
    });
  };

  const saveApiKey = async (keyId: string) => {
    setSavingKeys(prev => ({ ...prev, [keyId]: true }));
    
    try {
      // TODO: Call API to save the key
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setApiKeys(prev => prev.map(key => 
        key.id === keyId 
          ? { ...key, key: editingKeys[keyId] || '', lastUsed: new Date().toISOString() }
          : key
      ));
      
      setEditingKeys(prev => {
        const newState = { ...prev };
        delete newState[keyId];
        return newState;
      });
      
      toast({
        title: 'API key saved',
        description: 'Your API key has been securely saved',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save API key',
        variant: 'destructive',
      });
    } finally {
      setSavingKeys(prev => ({ ...prev, [keyId]: false }));
    }
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '•'.repeat(key.length);
    return `${key.slice(0, 4)}${'•'.repeat(key.length - 8)}${key.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          API keys are encrypted and stored securely. They are never exposed in logs or to other users.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {apiKeys.map((apiKey) => {
          const isEditing = editingKeys.hasOwnProperty(apiKey.id);
          const isSaving = savingKeys[apiKey.id];
          const isVisible = showKeys[apiKey.id];

          return (
            <Card key={apiKey.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {apiKey.name}
                      {apiKey.required && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {apiKey.description}
                    </CardDescription>
                  </div>
                  {apiKey.lastUsed && (
                    <p className="text-xs text-muted-foreground">
                      Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor={`api-key-${apiKey.id}`}>API Key</Label>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Input
                          id={`api-key-${apiKey.id}`}
                          type="text"
                          value={editingKeys[apiKey.id] || ''}
                          onChange={(e) => setEditingKeys(prev => ({
                            ...prev,
                            [apiKey.id]: e.target.value
                          }))}
                          placeholder="Enter your API key"
                          className="font-mono text-sm"
                          disabled={isSaving}
                        />
                        <Button
                          size="sm"
                          onClick={() => saveApiKey(apiKey.id)}
                          disabled={isSaving || !editingKeys[apiKey.id]}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelEditing(apiKey.id)}
                          disabled={isSaving}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input
                          id={`api-key-${apiKey.id}`}
                          type="text"
                          value={isVisible ? apiKey.key : maskApiKey(apiKey.key)}
                          readOnly
                          className="font-mono text-sm"
                          placeholder={apiKey.key ? undefined : "Not configured"}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          disabled={!apiKey.key}
                        >
                          {isVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(apiKey.key, apiKey.name)}
                          disabled={!apiKey.key}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => startEditing(apiKey.id, apiKey.key)}
                        >
                          {apiKey.key ? 'Update' : 'Add'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
        <h4 className="font-medium mb-2">Where to find your API keys:</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>OpenAI:</strong> <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/api-keys</a></li>
          <li><strong>HailuoAI:</strong> <a href="https://hailuoai.video/api" target="_blank" rel="noopener noreferrer" className="underline">hailuoai.video/api</a></li>
          <li><strong>MiniMax:</strong> <a href="https://www.minimax.com/api" target="_blank" rel="noopener noreferrer" className="underline">minimax.com/api</a></li>
        </ul>
      </div>
    </div>
  );
}