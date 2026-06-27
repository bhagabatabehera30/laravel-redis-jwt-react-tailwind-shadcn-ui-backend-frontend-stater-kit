import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Loader } from '../../components/ui/loader';
import { Globe, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export interface Tenant {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  domain: string | null;
  status: number;
  users?: any[];
}

const TenantsPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.is_super_admin || user?.roles?.some((r: any) => r.name === 'Super Admin') || user?.role === 'Super Admin' || false;

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeUuid, setActiveUuid] = useState<string | null>(localStorage.getItem('active_tenant_uuid'));

  // Form states for Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDomain, setFormDomain] = useState('');

  // Primary Owner states (only for creation)
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  // Auto-slugging form helper
  useEffect(() => {
    if (!editingTenant) {
      setFormSlug(
        formName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  }, [formName, editingTenant]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tenants');
      if (res.data.success) {
        setTenants(res.data.tenants);
      }
    } catch (err: any) {
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorkspace = (uuid: string, name: string) => {
    localStorage.setItem('active_tenant_uuid', uuid);
    setActiveUuid(uuid);
    toast.success(`Active Workspace switched to: ${name}`);
    window.dispatchEvent(new Event('tenantChanged'));
  };

  const openCreateModal = () => {
    setEditingTenant(null);
    setFormName('');
    setFormSlug('');
    setFormDomain('');
    setOwnerFirstName('');
    setOwnerLastName('');
    setOwnerEmail('');
    setOwnerPassword('');
    setIsModalOpen(true);
  };

  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormName(tenant.name);
    setFormSlug(tenant.slug);
    setFormDomain(tenant.domain || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingTenant) {
        // Edit flow
        const payload: any = { name: formName };
        if (isSuperAdmin) {
          payload.slug = formSlug;
          payload.domain = formDomain || null;
        }

        const res = await api.put(`/tenants/${editingTenant.uuid}`, payload);
        if (res.data.success) {
          toast.success('Workspace updated successfully!');
          setIsModalOpen(false);
          fetchTenants();
        }
      } else {
        // Create flow
        const res = await api.post('/tenants', {
          name: formName,
          slug: formSlug,
          domain: formDomain || null,
          owner_first_name: ownerFirstName,
          owner_last_name: ownerLastName,
          owner_email: ownerEmail,
          owner_password: ownerPassword,
        });
        if (res.data.success) {
          toast.success('New workspace created successfully!');
          setIsModalOpen(false);
          fetchTenants();
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error occurred while saving workspace';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!window.confirm('Are you sure you want to delete this workspace? This cannot be undone.')) return;
    try {
      const res = await api.delete(`/tenants/${uuid}`);
      if (res.data.success) {
        toast.success('Workspace deleted successfully!');
        if (activeUuid === uuid) {
          localStorage.removeItem('active_tenant_uuid');
          setActiveUuid(null);
        }
        fetchTenants();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Unauthorized to delete workspace';
      toast.error(msg);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Tenants</h2>
            <p className="text-sm md:text-base text-muted-foreground">Manage multi-tenant workspaces and environments</p>
          </div>
          {isSuperAdmin && (
            <Button onClick={openCreateModal} className="shrink-0 gap-2 font-semibold">
              <Plus className="h-4 w-4" /> Add Tenant Workspace
            </Button>
          )}
        </div>

        <Card className="shadow-lg relative min-h-[400px] overflow-hidden border-0">
          <Loader isLoading={loading} message="Loading Workspaces..." className="z-50 absolute inset-0 rounded-lg" />
          
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Globe className="h-5 w-5 text-primary" />
                Active SaaS Tenants
              </CardTitle>
              <CardDescription>Select an active tenant to restrict dashboard scopes to that workspace.</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold min-w-[200px]">Workspace Name</TableHead>
                    <TableHead className="font-semibold min-w-[150px]">Slug & URL</TableHead>
                    <TableHead className="font-semibold min-w-[180px]">Custom Domain</TableHead>
                    <TableHead className="font-semibold min-w-[100px]">Status</TableHead>
                    <TableHead className="font-semibold min-w-[120px]">Context Selection</TableHead>
                    <TableHead className="font-semibold min-w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.length > 0 ? (
                    tenants.map((t) => {
                      const isActive = activeUuid === t.uuid;
                      return (
                        <TableRow key={t.id} className={`hover:bg-muted/30 transition-colors ${isActive ? 'bg-blue-50/10' : ''}`}>
                          <TableCell className="font-semibold">
                            <span className="text-slate-900 dark:text-slate-100 text-base">{t.name}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                              {t.slug}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                              {t.domain || 'Not configured'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={t.status === 1 ? 'default' : 'secondary'} className={t.status === 1 ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 shadow-none border-0' : 'shadow-none border-0'}>
                              {t.status === 1 ? 'Active' : 'Suspended'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isActive ? (
                              <Badge className="bg-blue-600/10 text-blue-500 border-0 flex items-center gap-1.5 w-fit py-1 px-3 shadow-none">
                                <CheckCircle className="h-3.5 w-3.5" /> Active Workspace
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs font-semibold hover:bg-blue-600 hover:text-white"
                                onClick={() => handleSelectWorkspace(t.uuid, t.name)}
                              >
                                Select
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button variant="ghost" size="icon" onClick={() => openEditModal(t)} className="hover:text-primary hover:bg-primary/10 transition-colors h-8 w-8">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              {isSuperAdmin && (
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(t.uuid)} className="hover:text-red-600 hover:bg-red-500/10 transition-colors h-8 w-8">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No active workspaces found. Add a workspace to get started!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CREATE / EDIT SLIDE-IN DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl relative">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {editingTenant ? 'Edit Tenant Workspace' : 'Add New Tenant Workspace'}
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Setup new multi-tenant context inside SaaS ecosystem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tenant Name</label>
                  <Input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="E.g. Acme Services"
                    className="bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">URL Slug (Auto-Slugged)</label>
                  <Input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="acme-services"
                    className="bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                    disabled={!isSuperAdmin}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Custom Domain Name (Optional)</label>
                  <Input
                    type="text"
                    value={formDomain}
                    onChange={(e) => setFormDomain(e.target.value)}
                    placeholder="E.g. acme.localhost"
                    className="bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!isSuperAdmin}
                  />
                </div>

                {!editingTenant && (
                  <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Primary Owner Account</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">First Name</label>
                        <Input
                          type="text"
                          value={ownerFirstName}
                          onChange={(e) => setOwnerFirstName(e.target.value)}
                          placeholder="John"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Name</label>
                        <Input
                          type="text"
                          value={ownerLastName}
                          onChange={(e) => setOwnerLastName(e.target.value)}
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                      <Input
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="john@acme.com"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Temporary Password</label>
                      <Input
                        type="password"
                        value={ownerPassword}
                        onChange={(e) => setOwnerPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <Button type="button" variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm" disabled={isSaving}>
                    {isSaving ? 'Saving Workspace...' : editingTenant ? 'Save Changes' : 'Create Workspace'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  );
};

export default TenantsPage;
