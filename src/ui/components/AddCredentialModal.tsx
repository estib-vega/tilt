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
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAddCredentialMutation, useListCredentialProviders } from '@/model/api/credentials';
import type { CredentialService } from '@api/model/credentials';
import type { JSX } from 'react';
import React from 'react';
import { Plus } from 'lucide-react';

export default function AddCredentialModal(): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [service, setService] = React.useState<CredentialService | null>(null);
  const [secret, setSecret] = React.useState('');
  const addMutation = useAddCredentialMutation();
  const { data: credentialProviders } = useListCredentialProviders();

  const availableServices = React.useMemo(() => {
    const configuredServices = new Set(credentialProviders);
    const allServices: CredentialService[] = ['openai', 'anthropic'];
    return allServices.filter((service) => !configuredServices.has(service));
  }, [credentialProviders]);

  const handleAdd = async () => {
    if (!service || !secret) return;
    await addMutation.mutateAsync({ service: service, secret });
    setService(null);
    setSecret('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={availableServices.length === 0}
        >
          add credential
          <Plus />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>add credential</DialogTitle>
          <DialogDescription>
            add a new credential for a service. the secret will be stored securely.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="service" className="text-sm font-medium">
              service
            </label>
            <Select onValueChange={(value) => setService(value as CredentialService)}>
              <SelectTrigger id="service" className="w-full">
                <SelectValue placeholder="select a service" />
              </SelectTrigger>
              <SelectContent>
                {availableServices.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="secret" className="text-sm font-medium">
              secret
            </label>
            <Input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="enter api key or secret"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            cancel
          </Button>
          <Button onClick={handleAdd} disabled={!service || !secret}>
            add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
