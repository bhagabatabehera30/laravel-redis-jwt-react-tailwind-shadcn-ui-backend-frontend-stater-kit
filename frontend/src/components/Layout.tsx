import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from './ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Bell, Search, Menu, Settings, User, LogOut, Moon, Sun, Languages } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Users', href: '/users' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Left Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div 
          className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-200 dark:border-slate-800 px-6 pb-4"
          style={{ 
            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
            color: theme === 'dark' ? '#f8fafc' : '#0f172a'
          }}
        >
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold">Dashboard</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isCurrent = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                            isCurrent
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent 
          side="left" 
          className="w-full max-w-xs sm:max-w-sm border-slate-200 dark:border-slate-800"
          style={{ 
            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
            color: theme === 'dark' ? '#f8fafc' : '#0f172a',
            zIndex: 99999, 
            opacity: 1 
          }}
          aria-describedby={undefined}
        >
          <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
          <div className="flex h-16 shrink-0 items-center px-4">
            <h1 className="text-xl font-bold">Dashboard</h1>
          </div>
          <nav className="flex flex-1 flex-col mt-5 px-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isCurrent = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                            isCurrent
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top header */}
        <div 
          className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8"
          style={{ 
            backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
            color: theme === 'dark' ? '#f8fafc' : '#0f172a'
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Separator */}
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 lg:hidden" aria-hidden="true" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <form className="relative flex flex-1" action="#" method="GET">
              <label htmlFor="search-field" className="sr-only">
                Search
              </label>
              <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-slate-500" aria-hidden="true" />
              <Input
                id="search-field"
                className="block h-full w-full border-0 py-0 pl-8 pr-0 text-slate-900 dark:text-slate-50 placeholder:text-slate-500 focus-visible:ring-0 sm:text-sm bg-transparent shadow-none"
                placeholder="Search..."
                type="search"
                name="search"
              />
            </form>

            <div className="flex items-center gap-x-2 sm:gap-x-4 lg:gap-x-6">
              {/* Language dropdown */}
              <div className="hidden sm:flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[120px] h-8 bg-transparent border-none shadow-none focus:ring-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="hi">हिन्दी</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                    <Bell className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center">3</Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>New user registered</DropdownMenuItem>
                  <DropdownMenuItem>System update available</DropdownMenuItem>
                  <DropdownMenuItem>Payment received</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Separator */}
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200 dark:bg-slate-800" aria-hidden="true" />

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:ring-2 hover:ring-slate-200 dark:hover:ring-slate-800">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/01.png" alt="User" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">User</p>
                      <p className="text-xs leading-none text-muted-foreground">user@example.com</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 py-8 sm:py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer 
          className="border-t border-slate-200 dark:border-slate-800"
          style={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff' }}
        >
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">© 2026 Dashboard App</p>
              <div className="flex space-x-4">
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Right sidebar */}
      <Sheet open={rightSidebarOpen} onOpenChange={setRightSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed bottom-4 right-4 z-50 lg:hidden"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="w-80 border-slate-200 dark:border-slate-800"
          style={{ 
            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
            color: theme === 'dark' ? '#f8fafc' : '#0f172a',
            zIndex: 99999, 
            opacity: 1 
          }}
          aria-describedby={undefined}
        >
          <SheetTitle className="sr-only">Settings Menu</SheetTitle>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Settings</h2>
            </div>
            <Separator className="my-4" />
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-sm font-medium">Theme</h3>
                <div className="mt-2 space-y-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="w-full justify-start"
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="w-full justify-start"
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </Button>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-medium">Language</h3>
                <div className="mt-2 space-y-2">
                  <Button
                    variant={language === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('en')}
                    className="w-full justify-start"
                  >
                    English
                  </Button>
                  <Button
                    variant={language === 'ar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('ar')}
                    className="w-full justify-start"
                  >
                    العربية
                  </Button>
                  <Button
                    variant={language === 'hi' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('hi')}
                    className="w-full justify-start"
                  >
                    हिंदी
                  </Button>
                  <Button
                    variant={language === 'es' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('es')}
                    className="w-full justify-start"
                  >
                    Español
                  </Button>
                  <Button
                    variant={language === 'de' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('de')}
                    className="w-full justify-start"
                  >
                    Deutsch
                  </Button>
                  <Button
                    variant={language === 'ja' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('ja')}
                    className="w-full justify-start"
                  >
                    日本語
                  </Button>
                  <Button
                    variant={language === 'ru' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('ru')}
                    className="w-full justify-start"
                  >
                    Русский
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Layout;