import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Loader } from '../../components/ui/loader';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Users, Search, Plus, Edit2 } from 'lucide-react';

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

const mockComplexUsers: User[] = [
  { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', mobile: '+1 (555) 123-4567', status: '1', profile_pic: '', gender: 'male', profession: 'Engineer', bio: '', role: 'Admin' },
  { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', mobile: '+1 (555) 987-6543', status: '1', profile_pic: '', gender: 'female', profession: 'Designer', bio: '', role: 'User' },
  { id: 3, first_name: 'Bob', last_name: 'Johnson', email: 'bob@example.com', mobile: '+1 (555) 555-5555', status: '0', profile_pic: '', gender: 'male', profession: 'Manager', bio: '', role: 'User' },
  { id: 4, first_name: 'Alice', last_name: 'Brown', email: 'alice@example.com', mobile: '+1 (555) 111-2222', status: '1', profile_pic: '', gender: 'female', profession: 'Developer', bio: '', role: 'Moderator' },
  { id: 5, first_name: 'Charlie', last_name: 'Wilson', email: 'charlie@example.com', mobile: '+1 (555) 333-4444', status: '1', profile_pic: '', gender: 'male', profession: 'Analyst', bio: '', role: 'User' },
];

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [users] = useState<User[]>(mockComplexUsers);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const itemsPerPage = 6;

  // Filter Logic securely
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setIsFetching(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsFetching(false);
    }, 400);
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
                    <TableHead className="font-semibold min-w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
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
                          <Badge variant={user.status === '1' ? 'default' : 'secondary'} className={user.status === '1' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 shadow-none border-0' : 'shadow-none border-0'}>
                            {user.status === '1' ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/users/edit/${user.id}`)} className="hover:text-primary hover:bg-primary/10 transition-colors h-8 w-8">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No users found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800/60 mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} total results
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
