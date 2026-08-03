import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Loader } from '../../components/ui/loader';
import { ArrowLeft, Shield, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

interface Permission {
  id: number;
  name: string;
  guard_name: string;
}

interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

interface PermissionGroup {
  [key: string]: string;
}

interface PermissionsConfig {
  [groupName: string]: PermissionGroup;
}

const RolePermissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionsConfig, setPermissionsConfig] = useState<PermissionsConfig>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/permissions')
      ]);

      if (rolesRes.data.success && permsRes.data.success) {
        setRoles(rolesRes.data.roles);
        setPermissionsConfig(permsRes.data.permissions);
        if (rolesRes.data.roles.length > 0 && !selectedRole && !isCreating) {
          handleSelectRole(rolesRes.data.roles[0]);
        }
      } else {
        toast.error('Failed to load roles or permissions data');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error fetching data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRole = (role: Role) => {
    setIsCreating(false);
    setSelectedRole(role);
    setEditName(role.name);
    setSelectedPermissions(role.permissions.map(p => p.name));
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedRole(null);
    setEditName('');
    setSelectedPermissions([]);
  };

  const handlePermissionToggle = (permName: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permName)) {
        return prev.filter(p => p !== permName);
      } else {
        return [...prev, permName];
      }
    });
  };

  const handleSelectAllInGroup = (groupPerms: string[], selectAll: boolean) => {
    setSelectedPermissions(prev => {
      let updated = [...prev];
      if (selectAll) {
        groupPerms.forEach(p => {
          if (!updated.includes(p)) updated.push(p);
        });
      } else {
        updated = updated.filter(p => !groupPerms.includes(p));
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error('Role name is required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: editName,
        permissions: selectedPermissions
      };

      let response;
      if (isCreating) {
        response = await api.post('/roles', payload);
      } else if (selectedRole) {
        response = await api.put(`/roles/${selectedRole.id}`, payload);
      }

      if (response?.data.success) {
        toast.success(isCreating ? 'Role created successfully!' : 'Role updated successfully!');
        await fetchData();
        if (isCreating) {
          // Will auto-select the first one or we can select the new one, but fetchData already selects the first one if we clear selectedRole
          setIsCreating(false);
          const newRole = response.data.role;
          if (newRole) {
              handleSelectRole(newRole);
          }
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save role');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (roleId: number) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    
    try {
      const response = await api.delete(`/roles/${roleId}`);
      if (response.data.success) {
        toast.success('Role deleted successfully');
        if (selectedRole?.id === roleId) {
          setSelectedRole(null);
        }
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    }
  };

  const formatGroupName = (group: string) => {
    return group.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const isSystemRole = (name: string) => {
    return ['Super Admin', 'Owner', 'Admin', 'User'].includes(name);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="shrink-0 h-10 w-10 border-2 rounded-full border-slate-200 dark:border-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Role & Permissions Management</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Configure system roles and their authorized API access levels.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar - Roles List */}
          <Card className="shadow-lg border-0 md:col-span-1 h-fit">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-500" />
                  Roles
                </CardTitle>
                <Button size="icon" variant="ghost" onClick={handleCreateNew} className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground animate-pulse">Loading roles...</div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {roles.map(role => (
                    <li key={role.id}>
                      <button
                        onClick={() => handleSelectRole(role)}
                        className={`w-full text-left px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex items-center justify-between ${selectedRole?.id === role.id && !isCreating ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
                      >
                        <span className="font-medium text-sm">{role.name}</span>
                        {isSystemRole(role.name) && (
                          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">System</span>
                        )}
                      </button>
                    </li>
                  ))}
                  {roles.length === 0 && !isLoading && (
                    <li className="p-6 text-center text-muted-foreground text-sm">No roles found.</li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Main Panel - Permissions Editor */}
          <Card className="shadow-lg border-0 md:col-span-3 relative min-h-[500px]">
            <Loader isLoading={isLoading || isSaving} message="" className="z-50 absolute inset-0 rounded-lg" />
            
            {(selectedRole || isCreating) ? (
              <div className="flex flex-col h-full">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800 pb-6 flex flex-row items-start justify-between">
                  <div className="space-y-4 w-full max-w-md">
                    <div>
                      <Label htmlFor="roleName" className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Role Name</Label>
                      <Input 
                        id="roleName" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)} 
                        disabled={selectedRole !== null && isSystemRole(selectedRole.name)}
                        className="text-lg font-bold h-12"
                        placeholder="e.g., Support Agent"
                      />
                      {selectedRole && isSystemRole(selectedRole.name) && (
                        <p className="text-xs text-amber-500 mt-1">System role names cannot be modified.</p>
                      )}
                      {selectedRole?.name === 'Super Admin' && (
                        <p className="text-xs text-emerald-500 mt-1">Super Admin automatically bypasses all permission checks globally.</p>
                      )}
                    </div>
                  </div>
                  
                  {selectedRole && !isSystemRole(selectedRole.name) && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(selectedRole.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </CardHeader>

                <CardContent className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[60vh]">
                  <div className="space-y-8">
                    {Object.entries(permissionsConfig).map(([groupKey, permissions]) => {
                      const groupPermKeys = Object.keys(permissions);
                      const allSelected = groupPermKeys.every(p => selectedPermissions.includes(p));
                      const someSelected = groupPermKeys.some(p => selectedPermissions.includes(p)) && !allSelected;

                      return (
                        <div key={groupKey} className="space-y-4">
                          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <Checkbox 
                              id={`group-${groupKey}`}
                              checked={allSelected ? true : (someSelected ? 'indeterminate' : false)}
                              onCheckedChange={(checked) => handleSelectAllInGroup(groupPermKeys, checked as boolean)}
                              disabled={selectedRole?.name === 'Super Admin'}
                            />
                            <Label htmlFor={`group-${groupKey}`} className="text-lg font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                              {formatGroupName(groupKey)}
                            </Label>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-7">
                            {Object.entries(permissions).map(([permKey, permDesc]) => (
                              <div key={permKey} className="flex items-start gap-3">
                                <Checkbox 
                                  id={`perm-${permKey}`} 
                                  checked={selectedPermissions.includes(permKey) || selectedRole?.name === 'Super Admin'}
                                  onCheckedChange={() => handlePermissionToggle(permKey)}
                                  disabled={selectedRole?.name === 'Super Admin'}
                                  className="mt-1"
                                />
                                <div className="space-y-1">
                                  <Label htmlFor={`perm-${permKey}`} className="text-sm font-medium leading-none cursor-pointer">
                                    {permDesc}
                                  </Label>
                                  <p className="text-[10px] font-mono text-slate-400">{permKey}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>

                <CardFooter className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-6 flex justify-end gap-4 rounded-b-xl">
                  {selectedRole?.name !== 'Super Admin' && (
                    <Button onClick={handleSave} className="px-8 flex gap-2">
                      <Save className="h-4 w-4" />
                      {isCreating ? 'Create Role' : 'Save Changes'}
                    </Button>
                  )}
                </CardFooter>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 p-12 text-center">
                Select a role from the list to view and manage its permissions, or create a new one.
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default RolePermissionsPage;
