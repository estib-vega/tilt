import { createModelMutaion } from '@/model/api/model';
import type { Model, ModelProvider } from '@api/ai/model';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Plus } from 'lucide-react';

export default function AddModelDialog() {
  const [open, setOpen] = React.useState(false);
  const [provider, setProvider] = React.useState<ModelProvider>('ollama');
  const [name, setName] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [baseUrl, setBaseUrl] = React.useState('');

  const mutation = createModelMutaion();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const model: Model = {
      provider,
      name,
      apiKey: apiKey || null,
      baseUrl: baseUrl || null,
    };

    mutation.mutate(model, {
      onError: (error) => {
        console.error('Failed to add model:', error);
      },
      onSuccess: () => {
        setOpen(false);
        setName('');
        setApiKey('');
        setBaseUrl('');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          add model
          <Plus />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>add a new model</DialogTitle>
            <DialogDescription>configure a new AI model to use in your chats.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="provider" className="text-sm font-medium">
                provider
              </label>
              <Select
                value={provider}
                onValueChange={(value) => setProvider(value as 'openai' | 'ollama')}
              >
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="ollama">Ollama</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                model name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., gpt-5, llama3"
                required
                autoCorrect="off"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-sm font-medium">
                API key (optional)
              </label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="your API key"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="baseUrl" className="text-sm font-medium">
                base URL (optional)
              </label>
              <Input
                id="baseUrl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="custom API endpoint"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="cursor-pointer">
              {mutation.isPending ? 'adding...' : 'add model'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
