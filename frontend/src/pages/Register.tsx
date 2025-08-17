import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // If user is already authenticated, redirect to /home
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    navigate('/home', { replace: true });
    return null;
  }

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      setIsLoading(true);
      await api.post('/auth/register', values);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative">
      {/* Radial Gradient Background */}
      <div className="absolute inset-0 -z-10" style={{background: "radial-gradient(120% 120% at 50% 90%, #fff 40%, #a78bfa 100%)"}} />
      <Card className="w-full max-w-md rounded-3xl bg-white/90 shadow-2xl p-6 md:p-10 border-0">
        <CardHeader>
          <h2 className="text-3xl font-extrabold text-purple-700 text-center mb-2 tracking-tight">Create an Account</h2>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-700 font-semibold">Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Choose a username" {...field} className="rounded-xl border-purple-200 focus:ring-2 focus:ring-purple-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-700 font-semibold">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} className="rounded-xl border-purple-200 focus:ring-2 focus:ring-purple-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-700 font-semibold">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Choose a password" {...field} className="rounded-xl border-purple-200 focus:ring-2 focus:ring-purple-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md transition" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Register'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-purple-600 hover:underline font-semibold">Login</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;