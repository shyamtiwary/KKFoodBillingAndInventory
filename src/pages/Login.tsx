import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, UserPlus } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const { login, register, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.isApproved) {
        navigate('/', { replace: true });
      } else {
        toast({
          title: 'Account Pending',
          description: 'Your account is waiting for admin approval.',
          variant: 'default',
        });
      }
    }
  }, [user, isLoading, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegister) {
      const result = await register(email, password, name);
      if (result.success) {
        toast({
          title: 'Registration successful',
          description: result.message,
        });
        setIsRegister(false);
      } else {
        toast({
          title: 'Registration failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } else {
      const result = await login(email, password);

      if (result.success) {
        toast({
          title: 'Login successful',
          description: 'Welcome back!',
        });
        navigate('/');
      } else {
        toast({
          title: 'Login failed',
          description: result.message || 'Invalid email or password',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              {isRegister ? <UserPlus className="h-6 w-6 text-primary" /> : <LogIn className="h-6 w-6 text-primary" />}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isRegister ? 'Create Account' : 'KK Foods Login'}
          </CardTitle>
          <CardDescription>
            {isRegister
              ? 'Enter your details to request access'
              : 'Enter your credentials to access the system'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email / Username</Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              {isRegister ? 'Register' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-primary hover:underline"
            >
              {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register here'}
            </button>
          </div>


        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
