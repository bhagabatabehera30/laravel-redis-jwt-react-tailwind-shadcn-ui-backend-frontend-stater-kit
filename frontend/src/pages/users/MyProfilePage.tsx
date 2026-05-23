import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Upload, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export interface UserFormData {
  id?: number | string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  status: string; // '1' active, '0' inactive
  profile_pic: string;
  password?: string;
  confirm_password?: string;
  gender: string;
  profession: string;
  bio: string;
  role?: string;
}

const emptyUser: MyProfile = {
  first_name: '',
  last_name: '',
  email: '',
  mobile: '',
  status: '1',
  profile_pic: '',
  password: '',
  confirm_password: '',
  gender: '',
  profession: '',
  bio: '',
  role: 'User'
};

const MyProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<UserFormData>(emptyUser);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(isEditMode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Simulate fetching user from backend
    if (isEditMode) {
      setTimeout(() => {
        setFormData({
          id: id,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          mobile: '+1 (555) 123-4567',
          status: '1',
          profile_pic: '',
          password: '',
          confirm_password: '',
          gender: 'male',
          profession: 'Senior Developer',
          bio: 'Expert architect integrating scalable systems.',
          role: 'Admin'
        });
        setIsLoading(false);
      }, 600);
    }
  }, [id, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profile_pic: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name) newErrors.first_name = "First name is required";
    if (!formData.last_name) newErrors.last_name = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.mobile) newErrors.mobile = "Mobile is required";
    
    // Password required on creation, optional on edit
    if (!isEditMode && !formData.password) {
      newErrors.password = "Password is required";
    }
    
    // Check password match if any password is provided
    if (formData.password || formData.confirm_password) {
      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Simulate API POST payload successfully returning
      toast.success(isEditMode ? 'User modified successfully!' : 'User created successfully!');
      setTimeout(() => {
        navigate('/users');
      }, 800);
    } else {
      toast.error('Please correct the validation errors below.');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/users')} className="shrink-0 h-10 w-10 border-2 rounded-full border-slate-200 dark:border-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{isEditMode ? 'Edit Existing User' : 'Register New User'}</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              {isEditMode ? 'Modify specific authorization credentials or profiles locally.' : 'Deploy a completely new structured account credential profile.'}
            </p>
          </div>
        </div>

        <Card className="shadow-lg border-0">
          {isLoading ? (
            <div className="h-96 flex items-center justify-center text-muted-foreground animate-pulse">Loading User Profile...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                 {/* Profile Picture Upload block */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Avatar className="h-32 w-32 border-4 border-background shadow-lg group-hover:shadow-xl transition-shadow">
                      <AvatarImage src={formData.profile_pic} />
                      <AvatarFallback className="bg-primary/10 text-primary text-4xl font-semibold">
                        {formData.first_name?.[0]}{formData.last_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                  <span className="text-sm text-primary font-medium cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>Change Profile Picture</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-8 px-6 md:px-10 pb-10">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
                      <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="John" />
                      {errors.first_name && <p className="text-red-500 text-xs">{errors.first_name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
                      <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Doe" />
                      {errors.last_name && <p className="text-red-500 text-xs">{errors.last_name}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" />
                      {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number <span className="text-red-500">*</span></Label>
                      <Input id="mobile" name="mobile" type="tel" value={formData.mobile} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                      {errors.mobile && <p className="text-red-500 text-xs">{errors.mobile}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Authentication</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password {isEditMode ? '' : <span className="text-red-500">*</span>}</Label>
                      <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder={isEditMode ? "Leave blank to keep current password" : "••••••••"} />
                      {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirm Password {formData.password && <span className="text-red-500">*</span>}</Label>
                      <Input id="confirm_password" name="confirm_password" type="password" value={formData.confirm_password} onChange={handleChange} placeholder="••••••••" />
                      {errors.confirm_password && <p className="text-red-500 text-xs">{errors.confirm_password}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Profile & Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Active</SelectItem>
                          <SelectItem value="0">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select value={formData.gender} onValueChange={(v) => handleSelectChange('gender', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profession">Profession</Label>
                      <Input id="profession" name="profession" value={formData.profession} onChange={handleChange} placeholder="Engineer" />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label htmlFor="bio">Biography</Label>
                    <Textarea 
                      id="bio" 
                      name="bio" 
                      value={formData.bio} 
                      onChange={handleChange} 
                      placeholder="Tell us a little bit about the user..." 
                      className="resize-none min-h-[120px]"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-6 flex justify-end gap-4 rounded-b-xl">
                <Button type="button" variant="outline" className="px-8" onClick={() => navigate('/users')}>Cancel</Button>
                <Button type="submit" className="px-8 flex gap-2">
                  <Save className="h-4 w-4" />
                  {isEditMode ? 'Update Account' : 'Create Account'}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default MyProfilePage;
