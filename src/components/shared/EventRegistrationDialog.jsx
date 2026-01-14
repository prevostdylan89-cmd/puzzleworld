import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EventRegistrationDialog({ event, open, onOpenChange }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate registration
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`Successfully registered for ${event?.title}! Check your email for details.`);
    setName('');
    setEmail('');
    setMessage('');
    onOpenChange(false);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#000019] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Join Event</DialogTitle>
          <DialogDescription className="text-white/60">
            Register for {event?.title}. We'll send you all the details via email.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name" className="text-white/70">Full Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="bg-white/5 border-white/10 text-white mt-1"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email" className="text-white/70">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="bg-white/5 border-white/10 text-white mt-1"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="message" className="text-white/70">Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Any special requests or questions..."
              className="bg-white/5 border-white/10 text-white mt-1"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/20 text-white hover:bg-white/5"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Now'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}