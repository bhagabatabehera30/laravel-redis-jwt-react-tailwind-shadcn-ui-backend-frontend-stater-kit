import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Loader } from '../../components/ui/loader';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Users, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  status: string; // '1' = active, '0' = inactive
  profile_pic: string;
  gender: string;
  profession: string;
  bio: string;
  role: string;
}

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isFetching, setIsFetching] = useState(true);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const itemsPerPage = 6;

  useEffect(() => {
    // Add a slight debounce for search queries
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, searchQuery, statusFilter]);

  const fetchUsers = async () => {
    setIsFetching(true);
    try {
      const response = await api.get('/users', {
        params: {
          page: currentPage,
          per_page: itemsPerPage,
          search: searchQuery,
          status: statusFilter
        }
      });
      if (response.data.success) {
        setUsers(response.data.users.data);
        setTotalPages(response.data.users.last_page);
        setTotalUsers(response.data.users.total);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error loading users');
    } finally {
      setIsFetching(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this user from the tenant?')) return;
    
    setIsFetching(true);
    try {
      const response = await api.delete(`/users/${id}`);
      if (response.data.success) {
        toast.success('User removed successfully');
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove user');
      setIsFetching(false);
    }
  };

  // Pagination Logic handled by server.
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-sm md:text-base text-muted-foreground">Detailed administration of platform users</p>
        </div>

        <Card className="shadow-lg relative min-h-[400px] overflow-hidden border-0">
          <Loader isLoading={isFetching} message="" className="z-50 absolute inset-0 rounded-lg" />
          
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Users className="h-5 w-5 text-primary" />
                User Roster
              </CardTitle>
              <CardDescription>Filter and update registered users below.</CardDescription>
            </div>
            <Button onClick={() => navigate('/users/add')} className="shrink-0 gap-2 font-semibold">
              <Plus className="h-4 w-4" /> Add New User
            </Button>
          </CardHeader>

          <div className="px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-900/20">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or email..." 
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="1">Active Only</SelectItem>
                  <SelectItem value="0">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold min-w-[180px]">Name</TableHead>
                    <TableHead className="font-semibold min-w-[200px]">Email & Mobile</TableHead>
                    <TableHead className="font-semibold min-w-[100px]">Role</TableHead>
                    <TableHead className="font-semibold min-w-[100px]">Status</TableHead>
                    <TableHead className="font-semibold min-w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{user.first_name} {user.last_name}</span>
                            {user.profession && <span className="text-xs text-muted-foreground font-normal">{user.profession}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{user.email}</span>
                            <span className="text-xs text-muted-foreground">{user.mobile || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <Badge variant={String(user.status) === '1' ? 'default' : 'secondary'} className={String(user.status) === '1' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 shadow-none border-0' : 'shadow-none border-0'}>
                            {String(user.status) === '1' ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/users/edit/${user.id}`)} className="hover:text-primary hover:bg-primary/10 transition-colors h-8 w-8 mr-1">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} className="hover:text-red-500 hover:bg-red-50 transition-colors h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        {isFetching ? 'Loading users...' : 'No users found matching your filters.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800/60 mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} total results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || isFetching}
                    className="hover:bg-primary hover:text-primary-foreground transition-colors border-slate-200 dark:border-slate-800"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || isFetching}
                    className="hover:bg-primary hover:text-primary-foreground transition-colors border-slate-200 dark:border-slate-800"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UserList;
