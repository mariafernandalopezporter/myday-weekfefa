import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  User, 
  Wallet, 
  Settings, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  RefreshCcw,
  LogOut,
  Target,
  Clock,
  ChevronRight,
  Menu,
  X,
  Heart,
  Edit2,
  ExternalLink,
  MapPin,
  Cloud,
  Globe,
  Save,
  DollarSign,
  Circle,
  Calendar,
  Search,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { 
  format, 
  differenceInDays, 
  isPast, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addDays, 
  subDays, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  isSameDay,
  addWeeks,
  subWeeks
} from 'date-fns';
import { 
  DndContext, 
  DragOverlay, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent,
  useDroppable,
  useDraggable
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// Types
interface Task {
  id: string;
  date: string;
  task: string;
  category: string;
  deadline: string;
  priority: 'High' | 'Medium' | 'Low';
  responsible: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  description: string;
  comments?: string;
  completedAt?: string;
  isUrgent?: boolean;
  isImportant?: boolean;
}

interface ImportantEvent {
  id: string;
  date: string;
  name: string;
  startTime: string;
  endTime?: string;
  isAllDay: boolean;
  recurring: 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  location: string;
}

interface IFNRecord {
  id: string;
  number: string;
  short_description: string;
  state: string;
  opened_at: string;
  priority: string;
  category?: string;
  u_module: string;
  assigned_to: string;
  assignment_group?: string;
  impact?: string;
  description: string;
  u_resolution_sla_traffic_light: string;
  itelement?: string;
}

interface BudgetItem {
  id?: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'Income' | 'Expense';
  isMonthly?: boolean;
}

interface LinkRecord {
  id: string;
  nombre: string;
  link: string;
  descripcion: string;
  tipo: string;
  seccion: string;
  status: string;
}

const MOCK_EVENTS: ImportantEvent[] = [
  { id: '1', date: '2024-05-15', name: 'Simulacro de Operaciones', startTime: '14:00', endTime: '16:00', isAllDay: false, recurring: 'Monthly', location: 'Edificio Corporativo - Piso 4' },
  { id: '2', date: '2024-05-20', name: 'Board Meeting Trimestral', startTime: '09:00', endTime: '10:30', isAllDay: false, recurring: 'None', location: 'https://meet.google.com/abc-defg-hij' }
];

interface PersonalTask {
  id: string;
  task: string;
  completed: boolean;
  type: 'daily' | 'weekly';
}

const MOCK_IFN: IFNRecord[] = [
  {
    id: '1',
    number: 'CS0200066',
    short_description: 'Error en procesamiento de pagos internacionales',
    u_module: 'FINANZAS',
    itelement: 'SAP_FICO',
    state: 'In Progress',
    priority: '1 - Critical',
    opened_at: '2024-05-01 10:30:00',
    assigned_to: 'Maria Lopez',
    u_resolution_sla_traffic_light: 'Green',
    description: 'El sistema arroja un error 500 al intentar procesar remesas desde la sucursal de Santiago. Se requiere revisión de logs de integración.'
  },
  {
    id: '2',
    number: 'CS0200067',
    short_description: 'Solicitud de acceso a nuevo módulo de Tesorería',
    u_module: 'LEGAL',
    itelement: 'DOC_GEN',
    state: 'Resolved',
    priority: '3 - Moderate',
    opened_at: '2024-05-02 09:15:00',
    assigned_to: 'Juan Perez',
    u_resolution_sla_traffic_light: 'Green',
    description: 'Usuario requiere permisos de lectura/escritura para la generación de reportes mensuales de auditoría.'
  },
  {
    id: '3',
    number: 'CS0200068',
    short_description: 'Lentitud extrema en portal de empleados',
    u_module: 'RRHH',
    itelement: 'PEOPLE_PORTAL',
    state: 'New',
    priority: '2 - High',
    opened_at: '2024-05-04 15:45:00',
    assigned_to: 'Soporte IT',
    u_resolution_sla_traffic_light: 'Red',
    description: 'Varios usuarios reportan tiempos de carga superiores a 30 segundos en la sección de mis liquidaciones.'
  }
];

// Mock Data for immediate ADHD-friendly use
const MOCK_WORK_TASKS: Task[] = [
  { id: '1', date: '2024-05-04', task: 'Reporte Mensual Operaciones Latam', category: 'Flota', deadline: '2024-05-10', priority: 'High', responsible: 'Maria Fernanda', status: 'In Progress', description: 'Consolidado de KPI regionales', isUrgent: true, isImportant: true },
  { id: '2', date: '2024-05-04', task: 'Optimización Rutas SCL-LIM', category: 'Logística', deadline: '2024-05-15', priority: 'Medium', responsible: 'Maria Fernanda', status: 'Pending', description: 'Revisión de slots y eficiencia de combustible', isUrgent: false, isImportant: true },
  { id: '3', date: '2024-05-04', task: 'Feedback Equipo de Tierra', category: 'RH', deadline: '2024-05-05', priority: 'High', responsible: 'Maria Fernanda', status: 'Pending', description: 'Urgente: Revisar solicitudes de vacaciones', isUrgent: true, isImportant: true }
];

const MOCK_BUDGET: BudgetItem[] = [
  { date: '2024-05-01', description: 'Sueldo Latam', amount: 5000, category: 'Salario', type: 'Income' },
  { date: '2024-05-02', description: 'Alquiler Depto', amount: 1200, category: 'Vivienda', type: 'Expense' },
  { date: '2024-05-03', description: 'Supermercado', amount: 350, category: 'Alimentación', type: 'Expense' }
];

interface FefaTask {
  id: string;
  item: string;
  description: string;
  completed: boolean;
  comments?: string;
  completedAt?: string;
}

const MOCK_FEFA_TASKS: FefaTask[] = [
  { id: '1', item: 'Skin Care', description: 'Rutina AM para despertar la piel', completed: false },
  { id: '2', item: 'Vitaminas', description: 'Tomar suplementos después del desayuno', completed: true },
  { id: '3', item: 'Botella de Agua', description: 'Llenar 2L para el día', completed: false }
];

// Helper to generate Google Maps link for addresses
const getGoogleMapsLink = (location: string) => {
  if (!location) return "";
  if (location.startsWith('http')) return location;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
};

function EventHoverCard({ event, children, onEdit }: { event: ImportantEvent, children: React.ReactNode, onEdit: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white rounded-2xl shadow-2xl border border-zinc-100 p-4 pointer-events-auto"
        >
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <Badge className="bg-latam-blue text-white text-[9px] font-bold">
                {event.isAllDay ? 'DÍA COMPLETO' : `${event.startTime} - ${event.endTime || '...'}`}
              </Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-zinc-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit2 size={12} className="text-zinc-400" />
              </Button>
            </div>
            
            <div>
              <h4 className="font-bold text-sm text-zinc-900 leading-tight">{event.name}</h4>
              <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">{format(parseISO(event.date), 'EEEE, d MMMM')}</p>
            </div>

            {event.location && (
              <div className="pt-2 border-t border-zinc-50">
                <p className="text-[9px] font-bold text-zinc-400 uppercase mb-1">Ubicación / Link</p>
                <a 
                  href={getGoogleMapsLink(event.location)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg bg-latam-blue/5 text-latam-blue hover:bg-latam-blue/10 transition-colors group/link"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex-1 truncate text-[11px] font-bold">
                    {event.location.startsWith('http') ? 'Abrir Reunión Virtual' : event.location}
                  </div>
                  {event.location.startsWith('http') ? <ExternalLink size={14} /> : <MapPin size={14} />}
                </a>
              </div>
            )}
            
            {event.recurring !== 'None' && (
              <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-400">
                <RefreshCcw size={10} /> RECURRENCIA: {event.recurring.toUpperCase()}
              </div>
            )}
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-zinc-100 rotate-45" />
        </motion.div>
      )}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('fefa');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [linksWebhookUrl, setLinksWebhookUrl] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  
  // Data State
  const [workTasks, setWorkTasks] = useState<Task[]>(MOCK_WORK_TASKS);
  const [fefaTasks, setFefaTasks] = useState<FefaTask[]>(MOCK_FEFA_TASKS);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingFefa, setEditingFefa] = useState<FefaTask | null>(null);
  const [editingExpense, setEditingExpense] = useState<BudgetItem | null>(null);
  const [editingEvent, setEditingEvent] = useState<ImportantEvent | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importEventsOpen, setImportEventsOpen] = useState(false);
  const [budget, setBudget] = useState<BudgetItem[]>(MOCK_BUDGET.map((b, i) => ({ ...b, id: i.toString() })));
  const [importantEvents, setImportantEvents] = useState<ImportantEvent[]>(MOCK_EVENTS);
  const [ifnData, setIfnData] = useState<IFNRecord[]>(MOCK_IFN);
  const [ifnSearchTerm, setIfnSearchTerm] = useState('');
  const [ifnFilterNumber, setIfnFilterNumber] = useState('');
  const [ifnFilterState, setIfnFilterState] = useState('');
  const [ifnFilterItElement, setIfnFilterItElement] = useState('');
  const [selectedIFN, setSelectedIFN] = useState<IFNRecord | null>(null);
  const [linkData, setLinkData] = useState<LinkRecord[]>([]);
  const [linkSearchTerm, setLinkSearchTerm] = useState('');
  const [eventView, setEventView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Auto-sync effect
  useEffect(() => {
    const timer = setTimeout(() => {
      saveAllData();
    }, 1000); // 1 second debounce for "immediate" feel

    return () => clearTimeout(timer);
  }, [workTasks, fefaTasks, budget, importantEvents, linkData]);

  // Sync immediately when authentication or webhook happens
  useEffect(() => {
    if (isAuthenticated || (webhookUrl && webhookUrl.startsWith('http'))) {
      saveAllData(true);
    }
  }, [isAuthenticated, webhookUrl]);

  const saveAllData = async (forceSync = false) => {
    setIsSyncing(true);
    try {
      // Save to Local server DB 
      // The server will handle the background sync to Google Sheets if configured
      const localRes = await fetch('/api/data/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workTasks,
          fefaTasks,
          budget,
          importantEvents,
          ifnData,
          linkData
        })
      });

      if (!localRes.ok) throw new Error('Fallo al guardar');

      setLastSynced(new Date());
      setIsDemoMode(false);

      if (forceSync) {
        toast.success(webhookUrl ? 'Sincronización automática activa' : 'Guardado localmente', {
          description: webhookUrl ? 'Tus datos se están respaldando en Google Sheets.' : 'Datos guardados en el servidor local.'
        });
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      toast.error('Error al guardar datos');
    } finally {
      setIsSyncing(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    setActiveId(null);

    if (over && active) {
      const taskId = active.id as string;
      const quadrantId = over.id as string;

      let isUrgent = false;
      let isImportant = false;
      let priority: 'High' | 'Medium' | 'Low' = 'Low';

      switch (quadrantId) {
        case 'urgent-important':
          isUrgent = true;
          isImportant = true;
          priority = 'High';
          break;
        case 'important-not-urgent':
          isUrgent = false;
          isImportant = true;
          priority = 'Medium';
          break;
        case 'urgent-not-important':
          isUrgent = true;
          isImportant = false;
          priority = 'Low';
          break;
        case 'not-urgent-not-important':
          isUrgent = false;
          isImportant = false;
          priority = 'Low';
          break;
      }

      setWorkTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, 
        isUrgent, 
        isImportant, 
        priority 
      } : t));
      
      toast.info('Tarea re-priorizada en la matriz');
    }
  };

  useEffect(() => {
    checkAuthStatus();
    loadAllData(); // Load local data immediately on mount
    loadConfig();
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setWebhookUrl(data.webhookUrl || '');
        setLinksWebhookUrl(data.linksWebhookUrl || '');
        setSpreadsheetId(data.sheetId || '');
        if (data.sheetId) {
          setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${data.sheetId}`);
        }
      }
    } catch (err) {
      console.error('Config fetch failed');
    }
  };

  const extractSheetId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  const handleSaveConfig = async () => {
    try {
      const sId = spreadsheetUrl ? extractSheetId(spreadsheetUrl) : spreadsheetId;
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          webhookUrl, 
          linksWebhookUrl,
          sheetId: sId 
        })
      });
      setSpreadsheetId(sId);
      setShowConfig(false);
      toast.success('Configuración guardada exitosamente');
      saveAllData(true);
    } catch (err) {
      toast.error('Error al guardar configuración');
    }
  };

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      if (data.isAuthenticated) {
        setIsAuthenticated(true);
        setIsDemoMode(false);
        setUser(data.user);
        loadAllData();
      }
    } catch (err) {
      console.log('Using demo mode as fallback');
    }
  };

  const handleOAuthMessage = (event: MessageEvent) => {
    if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
      setIsAuthenticated(true);
      setIsDemoMode(false);
      setUser(event.data.user);
      loadAllData();
      toast.success('¡Conectado con Google Latam!');
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data/load');
      if (res.ok) {
        const data = await res.json();
        
        if (data.workTasks && data.workTasks.length > 0) setWorkTasks(data.workTasks);
        if (data.fefaTasks && data.fefaTasks.length > 0) setFefaTasks(data.fefaTasks);
        if (data.budget && data.budget.length > 0) setBudget(data.budget);
        if (data.importantEvents && data.importantEvents.length > 0) setImportantEvents(data.importantEvents);
        if (data.ifnData && data.ifnData.length > 0) setIfnData(data.ifnData);
        if (data.linkData && data.linkData.length > 0) setLinkData(data.linkData);
        
        setIsDemoMode(false);
        setLastSynced(new Date());
      }
    } catch (error) {
      console.error('Load from DB failed, using demo data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/auth/url');
      const { url } = await res.json();
      // Open in a popup to avoid iframe restrictions
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(url, 'google_auth', `width=${width},height=${height},left=${left},top=${top}`);
    } catch (error) {
      toast.error('Error al iniciar conexión');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setIsDemoMode(true);
    setUser(null);
    toast.info('Modo Demo Activo');
  };

  const budgetSummary = budget.reduce((acc, item) => {
    if (item.type === 'Income') acc.totalIncome += item.amount;
    else acc.totalExpense += item.amount;
    return acc;
  }, { totalIncome: 0, totalExpense: 0 });

  const remainingBudget = budgetSummary.totalIncome - budgetSummary.totalExpense;

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-zinc-900 flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Sidebar - Desktop only */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="bg-white border-r border-zinc-200 h-screen sticky top-0 hidden md:flex flex-col z-50 shrink-0"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-latam-salmon rounded-lg flex items-center justify-center text-white">
                  <Heart size={18} fill="currentColor" />
                </div>
                <span className="font-bold text-xl text-latam-lavender">Check de Fefa.</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard size={20} />}
            label="DASHBOARD"
            collapsed={!sidebarOpen}
          />

          <NavButton 
            active={activeTab === 'fefa'} 
            onClick={() => setActiveTab('fefa')}
            icon={<Heart size={20} />}
            label="TAREAS FEFA"
            collapsed={!sidebarOpen}
          />

          <NavButton 
            active={activeTab === 'trabajo'} 
            onClick={() => setActiveTab('trabajo')}
            icon={<Briefcase size={20} />}
            label="TAREAS LATAM"
            collapsed={!sidebarOpen}
          />
          <NavButton 
            active={activeTab === 'budget'} 
            onClick={() => setActiveTab('budget')}
            icon={<Wallet size={20} />}
            label="PRESUPUESTO"
            collapsed={!sidebarOpen}
          />
          <NavButton 
            active={activeTab === 'events'} 
            onClick={() => setActiveTab('events')}
            icon={<CalendarIcon size={20} />}
            label="EVENTOS"
            collapsed={!sidebarOpen}
          />
          <NavButton 
            active={activeTab === 'ifn'} 
            onClick={() => setActiveTab('ifn')}
            icon={<Target size={20} />}
            label="TICKETS IFN"
            collapsed={!sidebarOpen}
          />
          <NavButton 
            active={activeTab === 'links'} 
            onClick={() => setActiveTab('links')}
            icon={<Globe size={20} />}
            label="LINKS DE ACCESO"
            collapsed={!sidebarOpen}
          />
          <NavButton 
            active={activeTab === 'eisenhower'} 
            onClick={() => setActiveTab('eisenhower')}
            icon={<RefreshCcw size={20} />}
            label="EISENHOWER"
            collapsed={!sidebarOpen}
          />
        </nav>

        <div className="p-4 mt-auto border-t">
          <div className="flex flex-col gap-2">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center mb-1">
              {webhookUrl ? 'NUBE CONECTADA' : 'MODO LOCAL'}
            </p>
            <Button 
              variant="outline" 
              className={cn("w-full border-zinc-200 text-zinc-500 font-black text-[10px] tracking-widest uppercase hover:bg-zinc-50", !sidebarOpen && "p-0")}
              onClick={() => setShowConfig(true)}
            >
              {sidebarOpen ? 'CONFIGURAR NUBE' : <Settings size={16} />}
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-latam-salmon rounded-md flex items-center justify-center text-white">
            <Heart size={14} fill="currentColor" />
          </div>
          <span className="font-bold text-lg text-latam-lavender tracking-tighter">Check de Fefa.</span>
        </div>
        <div className="flex items-center gap-2">
          {isSyncing && <RefreshCcw size={14} className="text-latam-blue animate-spin" />}
          <Button variant="ghost" size="icon" onClick={() => setShowConfig(true)} className="h-8 w-8">
            <Settings size={16} className="text-zinc-400" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <header className="mb-6 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-1">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1 uppercase tracking-tighter">
              {activeTab === 'dashboard' ? 'VISTA GENERAL DEL ESTADO' : 
               activeTab === 'fefa' ? 'TAREAS DE FEFA' :
               activeTab === 'trabajo' ? 'TAREAS LATAM' : 
               activeTab === 'budget' ? 'FLUJO FINANCIERO' : 
               activeTab === 'events' ? 'EVENTOS IMPORTANTES' : 
               activeTab === 'ifn' ? 'INDICADORES IFN' : 
               activeTab === 'links' ? 'LINKS DE ACCESO RÁPIDO' : 'MATRIZ DE PRIORIDADES'}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-zinc-400 font-bold text-[9px] md:text-[10px] uppercase tracking-widest flex items-center gap-2">
                <Clock size={12} /> {format(new Date(), 'EEEE, d MMMM yyyy')}
              </p>
              {lastSynced && (
                <p className="text-latam-green font-bold text-[9px] uppercase tracking-widest flex items-center gap-1">
                   <Target size={10} /> Sincronizado {format(lastSynced, 'HH:mm')}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            {/* Minimal sync status indicator */}
            <button 
              onClick={() => setShowConfig(true)}
              className="group flex items-center gap-2 px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors"
            >
               <div className={cn("w-1.5 h-1.5 rounded-full transition-all", 
                 webhookUrl || isAuthenticated ? "bg-green-500" : "bg-zinc-300",
                 isSyncing && "animate-pulse scale-110"
               )} />
               <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                 {isSyncing ? 'Enviando...' : (webhookUrl || isAuthenticated ? 'Sincronizado' : 'Solo Local')}
                 <Settings size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
               </p>
            </button>
          </div>
        </header>

        {/* Sync Config Overlay/Modal */}
        <AnimatePresence>
          {showConfig && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-latam-blue rounded-[32px] overflow-hidden shadow-2xl relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-latam-blue to-latam-purple opacity-90" />
                <div className="relative p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
                        <Globe size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white uppercase tracking-tighter">Conexión con Google</h4>
                        <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Sincronización Automática</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowConfig(false)} className="text-white hover:bg-white/10 rounded-full">
                      <X size={24} />
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/80 uppercase tracking-widest pl-1">Link de Sincronización (Google Apps Script)</label>
                        <input 
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder="https://script.google.com/macros/s/.../exec"
                          className="w-full bg-white/10 border border-white/20 text-white text-xs p-4 rounded-2xl placeholder:text-white/30 focus:ring-2 focus:ring-latam-salmon outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/80 uppercase tracking-widest pl-1">Webhook Enlaces (Links)</label>
                        <input 
                          value={linksWebhookUrl}
                          onChange={(e) => setLinksWebhookUrl(e.target.value)}
                          placeholder="URL específica para links..."
                          className="w-full bg-white/10 border border-white/20 text-white text-xs p-4 rounded-2xl placeholder:text-white/30 focus:ring-2 focus:ring-latam-salmon outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-3">
                         <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-latam-salmon rounded-full flex items-center justify-center text-[10px] font-black">!</div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Instrucciones para Google</p>
                         </div>
                         <p className="text-[9px] text-white/60 leading-relaxed">
                           1. En tu Google Sheet ve a <b>Extensiones {">"} Apps Script</b>.<br/>
                           2. Borra todo y pega el código de abajo.<br/>
                           3. Dale a <b>Implementar {">"} Nueva implementación</b>.<br/>
                           4. Elige <b>Aplicación Web</b>, pon acceso a <b>Cualquier persona</b> y copia la URL.
                         </p>
                         <div className="relative">
                            <pre className="text-[8px] text-green-300 font-mono bg-black/40 p-3 rounded-xl max-h-48 overflow-auto border border-white/5">
{`function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Links');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({error: "No links sheet"})).setMimeType(ContentService.MimeType.JSON);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);
  var linkData = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      var key = h.toLowerCase().trim();
      obj[key] = row[i];
    });
    obj.id = Math.random().toString(36).substr(2, 9);
    return obj;
  });
  return ContentService.createTextOutput(JSON.stringify({linkData: linkData}))
    .setMimeType(ContentService.MimeType.JSON);
}`}
                            </pre>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="absolute top-2 right-2 h-6 text-[8px] bg-white/10 text-white hover:bg-white/20 uppercase font-black"
                              onClick={() => {
                                const code = `function doGet() {\n  var ss = SpreadsheetApp.getActiveSpreadsheet();\n  var sheet = ss.getSheetByName('Links');\n  if (!sheet) return ContentService.createTextOutput(JSON.stringify({error: "No links sheet"})).setMimeType(ContentService.MimeType.JSON);\n  var data = sheet.getDataRange().getValues();\n  var headers = data[0];\n  var rows = data.slice(1);\n  var linkData = rows.map(function(row) {\n    var obj = {};\n    headers.forEach(function(h, i) {\n      // Nombre, Link, Descripción, Tipo, Sección, Status\n      var key = h.toLowerCase().trim();\n      obj[key] = row[i];\n    });\n    obj.id = Math.random().toString(36).substr(2, 9);\n    return obj;\n  });\n  return ContentService.createTextOutput(JSON.stringify({linkData: linkData}))\n    .setMimeType(ContentService.MimeType.JSON);\n}`;
                                navigator.clipboard.writeText(code);
                                toast.success('Código para Links copiado');
                              }}
                            >
                              Copiar Todo
                            </Button>
                         </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                       <Button 
                         onClick={handleSaveConfig} 
                         disabled={!webhookUrl.startsWith('http')}
                         className="flex-1 h-14 bg-latam-salmon text-white text-xs font-black hover:bg-latam-salmon/90 rounded-2xl shadow-xl shadow-black/10 transition-all uppercase tracking-widest"
                       >
                         GUARDAR CONFIGURACIÓN
                       </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                       <Briefcase size={40} className="text-latam-blue" />
                    </div>
                    <CardHeader className="pb-2">
                       <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Operaciones Latam</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <div className="text-3xl font-black text-latam-blue tracking-tighter">
                         {workTasks.filter(t => t.status !== 'Completed').length}
                         <span className="text-sm font-bold text-zinc-300 ml-2">PENDIENTES</span>
                       </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                       <Heart size={40} className="text-latam-salmon" />
                    </div>
                    <CardHeader className="pb-2">
                       <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Progreso Fefa</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <div className="text-3xl font-black text-latam-salmon tracking-tighter">
                         {Math.round((fefaTasks.filter(t => t.completed).length / (fefaTasks.length || 1)) * 100)}%
                         <span className="text-sm font-bold text-zinc-300 ml-2">LOGRADO</span>
                       </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                       <DollarSign size={40} className="text-latam-green" />
                    </div>
                    <CardHeader className="pb-2">
                       <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Balance Disponible</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <div className={cn(
                         "text-2xl font-black tracking-tighter",
                         remainingBudget >= 0 ? "text-latam-green" : "text-latam-salmon"
                       )}>
                         ${remainingBudget.toLocaleString()}
                         <span className="text-sm font-bold text-zinc-300 ml-2">CLP</span>
                       </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                       <Calendar size={40} className="text-latam-lavender" />
                    </div>
                    <CardHeader className="pb-2">
                       <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Hitos / Eventos</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <div className="text-3xl font-black text-latam-lavender tracking-tighter">
                         {importantEvents.length}
                         <span className="text-sm font-bold text-zinc-300 ml-2">TOTAL</span>
                       </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Agenda & Priority Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Next Event Section */}
                  <Card className="border-none shadow-sm bg-white overflow-hidden border-t-4 border-latam-lavender">
                    <CardHeader className="flex flex-row items-center justify-between">
                       <CardTitle className="text-sm font-bold uppercase tracking-tighter flex items-center gap-2">
                          <Clock size={16} className="text-latam-lavender" /> PRÓXIMO EVENTO
                       </CardTitle>
                       <Button variant="ghost" size="sm" className="text-[10px] font-bold text-zinc-400" onClick={() => setActiveTab('events')}>CALENDARIO</Button>
                    </CardHeader>
                    <CardContent>
                       {(calendarEvents.length > 0 || importantEvents.length > 0) ? (
                         <div className="p-4 bg-latam-lavender/5 rounded-2xl border border-latam-lavender/10">
                           <h4 className="text-xl font-bold text-latam-lavender tracking-tighter uppercase">
                             {calendarEvents[0]?.summary || importantEvents[0]?.name}
                           </h4>
                           <div className="flex items-center gap-4 mt-3">
                             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                               {calendarEvents[0]?.start?.dateTime 
                                 ? format(parseISO(calendarEvents[0].start.dateTime), 'ppp') 
                                 : importantEvents[0] ? format(parseISO(importantEvents[0].date), 'PPP') : ''}
                             </p>
                             {(calendarEvents[0]?.location || importantEvents[0]?.location) && (
                               <Badge className="bg-latam-lavender/10 text-latam-lavender border-none text-[9px] font-bold shrink-0">
                                 {calendarEvents[0]?.location || importantEvents[0]?.location}
                               </Badge>
                             )}
                           </div>
                         </div>
                       ) : (
                         <div className="text-center py-10 italic text-zinc-400 text-xs font-bold uppercase tracking-widest">
                           Sin eventos registrados para hoy
                         </div>
                       )}
                    </CardContent>
                  </Card>

                  {/* LATAM High Priority Section */}
                  <Card className="border-none shadow-sm bg-white overflow-hidden border-t-4 border-latam-blue">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-bold uppercase tracking-tighter flex items-center gap-2">
                        <Target size={16} className="text-latam-blue" /> PRIORIDAD LATAM
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="text-[10px] font-bold text-zinc-400" onClick={() => setActiveTab('trabajo')}>VER TODO</Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {workTasks.filter(t => t.priority === 'High' && t.status !== 'Completed').slice(0, 2).map(task => (
                        <div key={task.id} className="p-4 bg-latam-blue/5 rounded-2xl flex items-center justify-between group">
                          <div>
                            <p className="text-xs font-black uppercase text-zinc-800">{task.task}</p>
                            <p className="text-[9px] text-latam-blue font-bold uppercase mt-1 tracking-tighter">Deadline: {task.deadline}</p>
                          </div>
                          <Badge className="bg-latam-salmon text-white border-none text-[8px] font-black italic">URGENTE</Badge>
                        </div>
                      ))}
                      {workTasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length === 0 && (
                        <div className="text-center py-10 italic text-zinc-400 text-xs font-bold uppercase tracking-widest">
                           No hay tareas críticas pendientes
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Lower Row: Fefa & Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Fefa Summary */}
                  <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-bold uppercase tracking-tighter flex items-center gap-2">
                        <Heart size={16} className="text-latam-salmon" /> CHECKLIST FEFA
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="text-[10px] font-bold text-zinc-400" onClick={() => setActiveTab('fefa')}>MISIÓN DIARIA</Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {fefaTasks.filter(t => !t.completed).slice(0, 3).map(task => (
                        <div key={task.id} className="p-3 border-b border-zinc-50 flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg bg-latam-salmon/10 flex items-center justify-center text-latam-salmon">
                             <Circle size={10} />
                          </div>
                          <p className="text-xs font-bold uppercase text-zinc-700">{task.item}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>


                </div>
              </div>
            )}

            {activeTab === 'fefa' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border-none">
                   <div>
                      <h2 className="text-2xl font-bold uppercase tracking-tighter text-latam-salmon">Tareas de Fefa</h2>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Tus rituales y metas personales</p>
                   </div>
                   <Button 
                    className="bg-latam-salmon hover:bg-latam-salmon/90 text-white font-bold"
                    onClick={() => setEditingFefa({
                      id: `new-${Date.now()}`,
                      item: '',
                      description: '',
                      completed: false
                    })}
                   >
                      <Plus size={18} className="mr-2" /> AGREGAR ITEM
                   </Button>
                </div>

                <Card className="border-none shadow-sm overflow-hidden">
                   <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-latam-salmon/10 border-b text-latam-salmon font-bold text-[10px] uppercase tracking-widest">
                           <tr>
                              <th className="px-6 py-4 font-bold">Item</th>
                              <th className="px-6 py-4 font-bold">Descripción / Comentarios</th>
                              <th className="px-6 py-4 font-bold w-24 text-center">Check</th>
                              <th className="px-6 py-4 font-bold w-20 text-right">Edit</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-latam-salmon/10">
                           {fefaTasks.map(task => (
                             <tr key={task.id} className={cn("transition-colors", task.completed ? "bg-zinc-50/50" : "hover:bg-latam-salmon/5")}>
                                <td className="px-6 py-4">
                                   <p className={cn("font-bold text-zinc-800", task.completed && "line-through text-zinc-400")}>{task.item}</p>
                                   {task.completedAt && <p className="text-[9px] text-latam-salmon font-bold uppercase">Logrado: {task.completedAt}</p>}
                                </td>
                                <td className="px-6 py-4">
                                   <p className={cn("text-xs font-bold uppercase text-zinc-400", task.completed && "opacity-50 text-zinc-300")}>{task.description}</p>
                                   {task.comments && <p className="text-[11px] italic text-zinc-500 mt-1">"{task.comments}"</p>}
                                </td>
                                <td className="px-6 py-4 text-center">
                                   <Checkbox 
                                    checked={task.completed} 
                                    onCheckedChange={(checked) => {
                                      const now = format(new Date(), 'yyyy-MM-dd HH:mm');
                                      setFefaTasks(fefaTasks.map(t => t.id === task.id ? { 
                                        ...t, 
                                        completed: !!checked,
                                        completedAt: checked ? now : undefined
                                      } : t));
                                      if (checked) toast.success(`¡Misión cumplida! ${now.split(' ')[1]} ❤️`);
                                    }}
                                    className="border-latam-salmon data-[state=checked]:bg-latam-salmon data-[state=checked]:border-latam-salmon mx-auto"
                                   />
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-latam-salmon font-bold text-xs"
                                    onClick={() => setEditingFefa(task)}
                                   >
                                     EDIT
                                   </Button>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                      </table>
                   </div>
                </Card>
              </div>
            )}

            {activeTab === 'trabajo' && (
              <div className="space-y-6 text-zinc-900">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border-none">
                   <div>
                      <h2 className="text-2xl font-bold uppercase tracking-tighter text-latam-lavender">Tareas Latam</h2>
                      <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Gestiona tus operaciones regionales</p>
                   </div>
                   <Button 
                    className="bg-latam-lavender hover:bg-latam-lavender/90 text-white font-bold"
                    onClick={() => setEditingTask({
                      id: `new-${Date.now()}`,
                      date: format(new Date(), 'yyyy-MM-dd'),
                      task: '',
                      category: 'General',
                      deadline: format(new Date(), 'yyyy-MM-dd'),
                      priority: 'Medium',
                      responsible: 'Maria Fernanda',
                      status: 'Pending',
                      description: ''
                    })}
                   >
                      <Plus size={18} className="mr-2" /> NUEVA TAREA
                   </Button>
                </div>

                <Card className="border-none shadow-sm overflow-hidden">
                   <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-latam-lavender/10 border-b text-latam-lavender font-bold text-[10px] uppercase tracking-widest">
                           <tr>
                              <th className="px-4 py-4 font-bold w-10">✓</th>
                              <th className="px-6 py-4 font-bold">Tarea</th>
                              <th className="px-6 py-4 font-bold">Prioridad</th>
                              <th className="px-6 py-4 font-bold">Estado</th>
                              <th className="px-6 py-4 font-bold">Comentarios</th>
                              <th className="px-6 py-4 font-bold text-right">Acción</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-latam-lavender/10">
                           {workTasks.map(task => (
                             <tr key={task.id} className={cn("hover:bg-latam-lavender/5 transition-colors", task.status === 'Completed' && "bg-zinc-50/50")}>
                                <td className="px-4 py-4">
                                   <Checkbox 
                                    checked={task.status === 'Completed'} 
                                    onCheckedChange={(checked) => {
                                      const now = format(new Date(), 'yyyy-MM-dd HH:mm');
                                      setWorkTasks(workTasks.map(t => t.id === task.id ? { 
                                        ...t, 
                                        status: checked ? 'Completed' : 'Pending',
                                        completedAt: checked ? now : undefined
                                      } : t));
                                      if (checked) toast.success(`Completada a las ${now.split(' ')[1]}`);
                                    }}
                                    className="border-latam-lavender data-[state=checked]:bg-latam-lavender"
                                   />
                                </td>
                                <td className="px-6 py-4">
                                   <p className={cn("font-bold text-zinc-800", task.status === 'Completed' && "line-through text-zinc-400")}>{task.task}</p>
                                   <p className="text-[10px] text-zinc-400 uppercase font-bold truncate max-w-[200px]">{task.description}</p>
                                   {task.completedAt && <p className="text-[9px] text-latam-salmon font-bold uppercase mt-1">Check: {task.completedAt}</p>}
                                </td>
                                <td className="px-6 py-4">
                                   <Badge className={cn("font-bold text-[10px]", task.priority === 'High' ? 'bg-latam-salmon text-white border-none' : 'bg-latam-blue text-white')}>
                                      {task.priority}
                                   </Badge>
                                </td>
                                <td className="px-6 py-4">
                                   <Badge className={cn("font-bold text-[10px]", task.status === 'Completed' ? 'bg-latam-green text-green-800' : 'bg-latam-yellow text-amber-800')}>
                                      {task.status}
                                   </Badge>
                                </td>
                                <td className="px-6 py-4 text-xs italic text-zinc-500">
                                   {task.comments || '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-latam-lavender font-bold text-xs"
                                    onClick={() => setEditingTask(task)}
                                   >
                                     EDITAR
                                   </Button>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                      </table>
                   </div>
                </Card>
              </div>
            )}

            {activeTab === 'budget' && (
               <div className="space-y-8">
                  <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border-none">
                     <div className="flex items-center gap-6">
                        <div>
                           <h2 className="text-2xl font-bold uppercase tracking-tighter text-latam-blue">Flujo Financiero</h2>
                           <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Control de ingresos y egresos personales</p>
                        </div>
                        <div className="h-10 w-px bg-zinc-100 hidden md:block"></div>
                        <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-lg">
                           <Input 
                            type="month" 
                            value={currentMonth} 
                            onChange={(e) => setCurrentMonth(e.target.value)} 
                            className="w-40 border-none bg-transparent font-bold text-xs"
                           />
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <Button 
                         variant="outline"
                         className="border-latam-blue text-latam-blue font-bold hover:bg-latam-blue/5"
                         onClick={() => setImportDialogOpen(true)}
                        >
                           IMPORTAR DATA
                        </Button>
                        <Button 
                         className="bg-latam-blue hover:bg-latam-blue/90 text-white font-bold"
                         onClick={() => setEditingExpense({
                           id: `new-${Date.now()}`,
                           date: format(new Date(), 'yyyy-MM-dd'),
                           description: '',
                           amount: 0,
                           category: 'Gastos varios',
                           type: 'Expense',
                           isMonthly: false
                         })}
                        >
                           <Plus size={18} className="mr-2" /> NUEVO REGISTRO
                        </Button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <Card className="bg-zinc-900 text-white border-none shadow-lg">
                        <CardHeader>
                           <CardDescription className="text-zinc-500 font-mono text-[10px] uppercase">Balance del Mes ({currentMonth})</CardDescription>
                           <CardTitle className="text-3xl font-serif italic">
                             {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(budget
                               .filter(item => item.date.startsWith(currentMonth))
                               .reduce((acc, curr) => curr.type === 'Income' ? acc + curr.amount : acc - curr.amount, 0))}
                           </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="flex justify-between items-end">
                              <p className="text-xs text-zinc-400">Balance neto mensual</p>
                              <div className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center">
                                 <Wallet size={20} />
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                     <Card className="bg-white border-none shadow-sm">
                        <CardHeader>
                           <CardDescription className="text-zinc-400 font-mono text-[10px] uppercase text-green-600">Ingresos ({currentMonth})</CardDescription>
                           <CardTitle className="text-2xl font-serif italic text-green-600">
                             +{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(budget
                                .filter(item => item.date.startsWith(currentMonth) && item.type === 'Income')
                                .reduce((acc, curr) => acc + curr.amount, 0))}
                           </CardTitle>
                        </CardHeader>
                     </Card>
                     <Card className="bg-white border-none shadow-sm">
                        <CardHeader>
                           <CardDescription className="text-zinc-400 font-mono text-[10px] uppercase text-red-600">Gastos ({currentMonth})</CardDescription>
                           <CardTitle className="text-2xl font-serif italic text-red-600">
                             -{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(budget
                                .filter(item => item.date.startsWith(currentMonth) && item.type === 'Expense')
                                .reduce((acc, curr) => acc + curr.amount, 0))}
                           </CardTitle>
                        </CardHeader>
                     </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <Card className="lg:col-span-2 border-none shadow-sm">
                        <CardHeader className="border-b">
                           <div className="flex justify-between items-center">
                              <CardTitle className="text-xl font-serif italic">Registros de {currentMonth}</CardTitle>
                           </div>
                        </CardHeader>
                        <ScrollArea className="h-[500px]">
                           <div className="p-0">
                              {budget
                                .filter(item => item.date.startsWith(currentMonth))
                                .sort((a, b) => b.date.localeCompare(a.date))
                                .map((item, i) => (
                                 <div key={item.id || i} className="flex items-center justify-between p-4 hover:bg-zinc-50 border-b">
                                    <div className="flex items-center gap-4">
                                       <div className={cn(
                                          "w-10 h-10 rounded-full flex items-center justify-center",
                                          item.type === 'Income' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                       )}>
                                          {item.type === 'Income' ? <Plus size={18} /> : <LogOut size={18} className="rotate-180" />}
                                       </div>
                                       <div>
                                          <p className="text-sm font-medium flex items-center gap-2">
                                            {item.description}
                                            {item.isMonthly && <Badge variant="outline" className="text-[8px] border-latam-blue text-latam-blue py-0 h-4">MENSUAL</Badge>}
                                          </p>
                                          <p className="text-xs text-zinc-500 font-mono">{item.date} • {item.category}</p>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                       <p className={cn(
                                          "font-mono font-bold",
                                          item.type === 'Income' ? "text-green-600" : "text-zinc-900"
                                       )}>
                                          {item.type === 'Income' ? '+' : '-'}
                                          {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(item.amount)}
                                       </p>
                                       <Button 
                                         variant="ghost" 
                                         size="sm" 
                                         className="text-latam-blue font-bold text-[10px]"
                                         onClick={() => setEditingExpense(item)}
                                       >
                                         EDITAR
                                       </Button>
                                    </div>
                                 </div>
                              ))}
                              {budget.filter(item => item.date.startsWith(currentMonth)).length === 0 && (
                                <div className="text-center py-20 text-zinc-400">
                                   No hay registros para este mes.
                                </div>
                              )}
                           </div>
                        </ScrollArea>
                     </Card>

                     <Card className="border-none shadow-sm p-6 space-y-6">
                        <h3 className="font-serif italic text-xl">Distribución</h3>
                        <div className="space-y-4">
                            {(() => {
                              const expensesByCat = budget
                                .filter(item => item.date.startsWith(currentMonth) && item.type === 'Expense')
                                .reduce((acc, curr) => {
                                  acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
                                  return acc;
                                }, {} as any);
                              
                              const totalMonthlyExpense = Object.values(expensesByCat).reduce((a, b) => (a as number) + (b as number), 0) as number;

                              return Object.entries(expensesByCat)
                                .sort((a, b) => (b[1] as number) - (a[1] as number))
                                .map(([cat, amount]) => {
                                  const percentage = totalMonthlyExpense > 0 ? ((amount as number) / totalMonthlyExpense) * 100 : 0;
                                  return (
                                    <div key={cat} className="space-y-2">
                                       <div className="flex justify-between text-xs font-medium">
                                          <span>{cat}</span>
                                          <span className="text-zinc-500">
                                            {percentage.toFixed(1)}% ({new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount as number)})
                                          </span>
                                       </div>
                                       <Progress value={percentage} className="h-1 bg-zinc-100" />
                                    </div>
                                  );
                                });
                            })()}
                            {budget.filter(item => item.date.startsWith(currentMonth) && item.type === 'Expense').length === 0 && (
                               <p className="text-zinc-400 text-xs italic text-center py-10">Sin gastos este mes.</p>
                            )}
                        </div>
                     </Card>
                  </div>
               </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-8">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border-none gap-4">
                    <div>
                      <h2 className="text-2xl font-bold uppercase tracking-tighter text-latam-blue">Agenda de Eventos</h2>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Visualización y gestión de tiempo crítico</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 items-center">
                       <div className="bg-zinc-100 p-1 rounded-lg flex gap-1 mr-2">
                          <Button 
                            variant={eventView === 'month' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className="text-[10px] font-bold h-7 px-3"
                            onClick={() => setEventView('month')}
                          >MES</Button>
                          <Button 
                            variant={eventView === 'week' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className="text-[10px] font-bold h-7 px-3"
                            onClick={() => setEventView('week')}
                          >SEMANA</Button>
                          <Button 
                            variant={eventView === 'day' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className="text-[10px] font-bold h-7 px-3"
                            onClick={() => setEventView('day')}
                          >DÍA</Button>
                       </div>

                       <div className="flex gap-1 mr-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            if (eventView === 'month') setSelectedDate(subMonths(selectedDate, 1));
                            if (eventView === 'week') setSelectedDate(subWeeks(selectedDate, 1));
                            if (eventView === 'day') setSelectedDate(subDays(selectedDate, 1));
                          }}>
                             <ChevronRight className="rotate-180" size={16} />
                          </Button>
                          <Button variant="ghost" className="h-8 text-[10px] font-bold" onClick={() => setSelectedDate(new Date())}>HOY</Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            if (eventView === 'month') setSelectedDate(addMonths(selectedDate, 1));
                            if (eventView === 'week') setSelectedDate(addWeeks(selectedDate, 1));
                            if (eventView === 'day') setSelectedDate(addDays(selectedDate, 1));
                          }}>
                             <ChevronRight size={16} />
                          </Button>
                       </div>

                       <Button 
                        variant="outline"
                        className="border-latam-blue text-latam-blue font-bold hover:bg-latam-blue/5 text-[10px] h-9"
                        onClick={() => setImportEventsOpen(true)}
                       >
                          IMPORTAR
                       </Button>
                       <Button 
                        className="bg-latam-blue hover:bg-latam-blue/90 text-white font-bold text-[10px] h-9"
                        onClick={() => setEditingEvent({
                          id: `new-${Date.now()}`,
                          date: format(new Date(), 'yyyy-MM-dd'),
                          name: '',
                          startTime: '09:00',
                          isAllDay: false,
                          recurring: 'None',
                          location: ''
                        })}
                       >
                          <Plus size={16} className="mr-1" /> AGENDAR
                       </Button>
                    </div>
                 </div>

                 <Card className="border-none shadow-sm overflow-hidden p-6 bg-white min-h-[600px]">
                    <div className="mb-6">
                       <h3 className="text-xl font-serif italic text-latam-blue">
                          {eventView === 'month' && format(selectedDate, 'MMMM yyyy', { locale: undefined })}
                          {eventView === 'week' && `Semana del ${format(startOfWeek(selectedDate), 'd MMMM')}`}
                          {eventView === 'day' && format(selectedDate, 'EEEE, d MMMM yyyy')}
                       </h3>
                    </div>

                    {eventView === 'month' && (
                       <div className="grid grid-cols-7 gap-px bg-zinc-100 border border-zinc-100 rounded-xl overflow-hidden">
                          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                            <div key={day} className="bg-zinc-50 p-3 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{day}</div>
                          ))}
                          {(() => {
                             const start = startOfWeek(startOfMonth(selectedDate));
                             const end = endOfWeek(endOfMonth(selectedDate));
                             const days = eachDayOfInterval({ start, end });
                             
                             return days.map(day => {
                               const dateStr = format(day, 'yyyy-MM-dd');
                               const dayEvents = importantEvents.filter(e => e.date === dateStr);
                               const isToday = isSameDay(day, new Date());
                               const isCurrMonth = isSameMonth(day, selectedDate);
                               
                               return (
                                 <div 
                                  key={dateStr} 
                                  className={cn(
                                    "bg-white min-h-[120px] p-2 transition-colors",
                                    !isCurrMonth && "bg-zinc-50/50",
                                    isToday && "ring-1 ring-inset ring-latam-blue/20"
                                  )}
                                 >
                                    <div className="flex justify-between items-center mb-1">
                                       <span className={cn(
                                         "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                                         isToday ? "bg-latam-blue text-white" : !isCurrMonth ? "text-zinc-300" : "text-zinc-600"
                                       )}>{format(day, 'd')}</span>
                                    </div>
                                    <div className="space-y-1">
                                       {dayEvents.slice(0, 3).map(event => (
                                         <EventHoverCard key={event.id} event={event} onEdit={() => setEditingEvent(event)}>
                                           <button 
                                            className="w-full text-left p-1 text-[9px] font-bold truncate rounded bg-latam-blue/5 text-latam-blue hover:bg-latam-blue/10 border-l border-latam-blue"
                                           >
                                             {event.isAllDay ? 'DÍA: ' : `${event.startTime} `}{event.name}
                                           </button>
                                         </EventHoverCard>
                                       ))}
                                       {dayEvents.length > 3 && (
                                         <p className="text-[8px] text-zinc-400 font-bold ml-1">+{dayEvents.length - 3} más</p>
                                       )}
                                    </div>
                                 </div>
                               );
                             });
                          })()}
                       </div>
                    )}

                    {eventView === 'week' && (
                       <div className="grid grid-cols-7 gap-px bg-zinc-100 border border-zinc-100 rounded-xl overflow-hidden">
                          {eachDayOfInterval({ 
                            start: startOfWeek(selectedDate), 
                            end: endOfWeek(selectedDate) 
                          }).map(day => {
                             const dateStr = format(day, 'yyyy-MM-dd');
                             const dayEvents = importantEvents.filter(e => e.date === dateStr);
                             const isToday = isSameDay(day, new Date());
                             
                             return (
                               <div key={dateStr} className="bg-white min-h-[500px]">
                                  <div className={cn(
                                    "p-3 text-center border-b font-bold",
                                    isToday ? "bg-latam-blue/5 text-latam-blue" : "text-zinc-600"
                                  )}>
                                     <p className="text-[10px] uppercase tracking-widest">{format(day, 'EEEE')}</p>
                                     <p className="text-xl font-bold">{format(day, 'd')}</p>
                                  </div>
                                  <div className="p-2 space-y-2">
                                     {dayEvents.map(event => (
                                       <EventHoverCard key={event.id} event={event} onEdit={() => setEditingEvent(event)}>
                                         <button 
                                          className="w-full text-left p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 border-l-2 border-latam-blue transition-all"
                                         >
                                            <p className="text-[10px] font-bold text-latam-blue">
                                              {event.isAllDay ? 'TODO EL DÍA' : `${event.startTime} - ${event.endTime || '...'}`}
                                            </p>
                                            <p className="text-xs font-bold text-zinc-800 leading-tight">{event.name}</p>
                                            <p className="text-[9px] text-zinc-400 truncate mt-1">{event.location}</p>
                                         </button>
                                       </EventHoverCard>
                                     ))}
                                  </div>
                               </div>
                             );
                          })}
                       </div>
                    )}

                    {eventView === 'day' && (
                       <div className="max-w-3xl mx-auto bg-white rounded-xl border p-6">
                          <div className="flex items-center gap-4 mb-8">
                             <div className="w-16 h-16 bg-latam-blue text-white rounded-2xl flex flex-col items-center justify-center font-bold">
                                <span className="text-[10px] uppercase leading-none opacity-80">{format(selectedDate, 'MMM')}</span>
                                <span className="text-2xl leading-none mt-1">{format(selectedDate, 'd')}</span>
                             </div>
                             <div>
                                <h4 className="text-2xl font-bold text-latam-blue leading-tight uppercase tracking-tighter">
                                   {format(selectedDate, 'EEEE')}
                                </h4>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Agenda Diaria Detallada</p>
                             </div>
                          </div>
                          
                          <div className="space-y-4">
                             {importantEvents.filter(e => e.date === format(selectedDate, 'yyyy-MM-dd')).length === 0 && (
                               <div className="text-center py-20 border-2 border-dashed rounded-2xl text-zinc-300 font-bold uppercase text-xs">
                                  No hay eventos programados para hoy
                               </div>
                             )}
                             {importantEvents
                               .filter(e => e.date === format(selectedDate, 'yyyy-MM-dd'))
                               .sort((a, b) => a.startTime.localeCompare(b.startTime))
                               .map(event => (
                               <EventHoverCard key={event.id} event={event} onEdit={() => setEditingEvent(event)}>
                                 <button 
                                  className="w-full text-left p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 border-l-4 border-latam-blue flex items-start gap-4 transition-all"
                                 >
                                    <div className="w-20 pt-1">
                                       <p className="text-xs font-bold text-latam-blue">
                                         {event.isAllDay ? 'DÍA COMPLETO' : event.startTime}
                                       </p>
                                       {!event.isAllDay && event.endTime && (
                                         <p className="text-[10px] text-zinc-400 font-bold">a {event.endTime}</p>
                                       )}
                                    </div>
                                    <div className="flex-1">
                                       <h5 className="font-bold text-zinc-900 mb-1">{event.name}</h5>
                                       <p className="text-xs text-zinc-500 flex items-center gap-1 italic">
                                          <Target size={12} /> {event.location || 'Sin ubicación definida'}
                                       </p>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] font-bold border-latam-blue text-latam-blue">
                                       {event.recurring === 'None' ? 'ÚNICA VEZ' : event.recurring.toUpperCase()}
                                    </Badge>
                                 </button>
                               </EventHoverCard>
                             ))}
                          </div>
                       </div>
                    )}
                 </Card>
              </div>
            )}

            {activeTab === 'ifn' && (
              <div className="space-y-8">
                <header className="bg-white p-6 rounded-2xl shadow-sm border-none space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold uppercase tracking-tighter text-latam-blue">Tickets IFN</h2>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        Sincronizado con Google Sheets 
                        <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full text-[8px] font-black">
                          {ifnData.length} REGISTROS TOTALES
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setIfnFilterNumber('');
                          setIfnFilterState('');
                          setIfnFilterItElement('');
                          setIfnSearchTerm('');
                        }}
                        className="text-[10px] font-black uppercase text-zinc-400 hover:text-latam-blue"
                      >
                        Limpiar Filtros
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="border-latam-salmon text-latam-salmon font-bold hover:bg-latam-salmon/5 h-9"
                        onClick={async () => {
                          if (!webhookUrl) {
                            toast.error('Configura el Webhook primero');
                            return;
                          }
                          setIsSyncing(true);
                          try {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
                            
                            const res = await fetch(webhookUrl, { signal: controller.signal });
                            clearTimeout(timeoutId);
                            
                            const data = await res.json();
                            console.log('Sync Raw Data:', data);

                            let hasUpdated = false;
                            
                            if (data.ifnData) {
                              setIfnData(data.ifnData);
                              hasUpdated = true;
                            }

                            if (data.linkData) {
                              setLinkData(data.linkData);
                              hasUpdated = true;
                            }

                            if (hasUpdated) {
                              fetch('/api/data/save', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  workTasks, fefaTasks, budget, importantEvents, 
                                  ifnData: data.ifnData || ifnData,
                                  linkData: data.linkData || linkData
                                })
                              });
                              toast.success('Datos IFN actualizados');
                            } else {
                              toast.warning('No se encontraron datos IFN en la respuesta');
                            }
                          } catch (err: any) {
                            if (err.name === 'AbortError') {
                              toast.error('Tiempo de espera agotado (60s). El servidor de Google tarda demasiado.');
                            } else {
                              toast.error('Error al traer info de IFN desde Google');
                            }
                          } finally {
                            setIsSyncing(false);
                          }
                        }}
                      >
                        <RefreshCcw size={16} className={cn("mr-2", isSyncing && "animate-spin")} /> 
                        {isSyncing ? 'SYNC...' : 'SYNC'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                      <input 
                        type="text"
                        placeholder="N° Ticket (Col A)"
                        value={ifnFilterNumber}
                        onChange={(e) => setIfnFilterNumber(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-latam-blue outline-none transition-all placeholder:text-zinc-300 font-bold"
                      />
                    </div>
                    <div className="relative">
                      <Select value={ifnFilterState} onValueChange={(val) => setIfnFilterState(val === 'ALL' ? '' : val)}>
                        <SelectTrigger className="w-full bg-zinc-50 border border-zinc-100 rounded-xl h-[42px] text-xs focus:ring-2 focus:ring-latam-blue outline-none transition-all font-bold text-zinc-700">
                          <SelectValue placeholder="Estado (Col C)" />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-xl border-zinc-100">
                          <SelectItem value="ALL" className="text-[10px] font-black uppercase text-zinc-400">Ver Todos</SelectItem>
                          <SelectItem value="In Progress" className="text-[10px] font-black uppercase">In Progress</SelectItem>
                          <SelectItem value="Awaiting Info" className="text-[10px] font-black uppercase">Awaiting Info</SelectItem>
                          <SelectItem value="Resolved" className="text-[10px] font-black uppercase">Resolved</SelectItem>
                          <SelectItem value="New" className="text-[10px] font-black uppercase">New</SelectItem>
                          <SelectItem value="Closed" className="text-[10px] font-black uppercase">Closed</SelectItem>
                          <SelectItem value="Cancelled" className="text-[10px] font-black uppercase">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <Select value={ifnFilterItElement} onValueChange={(val) => setIfnFilterItElement(val === 'ALL' ? '' : val)}>
                        <SelectTrigger className="w-full bg-zinc-50 border border-zinc-100 rounded-xl h-[42px] text-xs focus:ring-2 focus:ring-latam-blue outline-none transition-all font-bold text-zinc-700">
                          <SelectValue placeholder="ItElement (Col AH)" />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-xl border-zinc-100">
                          <SelectItem value="ALL" className="text-[10px] font-black uppercase text-zinc-400">Ver Todos</SelectItem>
                          <SelectItem value="IFN" className="text-[10px] font-black uppercase">IFN</SelectItem>
                          <SelectItem value="IFNCREW" className="text-[10px] font-black uppercase">IFNCREW</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </header>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-zinc-100">
                  {(() => {
                    const termNum = (ifnFilterNumber || '').trim().toLowerCase();
                    const termState = (ifnFilterState || '').trim().toLowerCase();
                    const termItElem = (ifnFilterItElement || '').trim().toLowerCase();
                    
                    const hasFilter = termNum !== '' || termState !== '' || termItElem !== '';
                    
                    const filtered = ifnData.filter(record => {
                      const ticketNum = String(record.number || '').toLowerCase();
                      const itElem = String(record.itelement || '').toLowerCase();
                      const state = String(record.state || '').toLowerCase();

                      const matchNum = termNum === '' || ticketNum.includes(termNum);
                      const matchState = termState === '' || state === termState;
                      const matchItElem = termItElem === '' || itElem === termItElem;
                      
                      return matchNum && matchState && matchItElem;
                    });

                    if (filtered.length > 0) {
                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-zinc-50 border-b border-zinc-100">
                              <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-40">N° TICKET (COL A)</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">ESTADO (COL C)</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest hidden md:table-cell">ITELEMENT (COL AH)</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">ACCIONES</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                              {filtered.map((record, index) => (
                                <tr 
                                  key={`${record.id}-${index}`} 
                                  className="hover:bg-latam-blue/5 transition-colors cursor-pointer group animate-in fade-in slide-in-from-top-1 duration-200"
                                  onClick={() => setSelectedIFN(record)}
                                >
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        "w-1 h-6 rounded-full",
                                        String(record.priority || '').toLowerCase().includes('1') ? 'bg-red-500' :
                                        String(record.priority || '').toLowerCase().includes('2') ? 'bg-orange-500' : 'bg-latam-blue'
                                      )} />
                                      <span className="text-sm font-black text-latam-blue uppercase tracking-tighter">{record.number || 'SIN ID'}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <Badge className={cn(
                                      "text-[9px] font-black uppercase",
                                      String(record.state || '').toLowerCase().includes('resolved') || String(record.state || '').toLowerCase().includes('closed') 
                                        ? 'bg-latam-green text-green-700' 
                                        : 'bg-zinc-100 text-zinc-500'
                                    )}>
                                      {record.state || 'N/A'}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 hidden md:table-cell">
                                    <p className="text-xs font-bold text-zinc-600 line-clamp-1">{record.itelement || '-'}</p>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black text-latam-blue opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                                      VER FICHA <ChevronRight size={14} className="animate-pulse" />
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                         <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-zinc-200">
                            <Search size={32} className={cn("text-zinc-200", ifnData.length === 0 && "text-latam-salmon animate-pulse")} />
                         </div>
                         <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">
                           {ifnData.length === 0 
                             ? 'No hay registros cargados' 
                             : hasFilter ? 'No se encontraron coincidencias' : 'Búsqueda de Tickets IFN'}
                         </p>
                         <p className="text-[10px] text-zinc-400 max-w-xs mx-auto">
                           {ifnData.length === 0
                             ? 'Haz click en el botón SYNC arriba a la derecha para traer los tickets desde Google Sheets por primera vez.'
                             : hasFilter 
                               ? 'Prueba ajustando los campos de búsqueda o borrando filtros.' 
                               : `Listo para buscar en ${ifnData.length} registros. Usa los filtros de arriba para encontrar un ticket.`}
                         </p>
                         {ifnData.length === 0 && (
                            <div className="pt-4">
                              <p className="text-[8px] text-zinc-300 font-bold uppercase tracking-tighter">Asegúrate de haber configurado el Webhook en el panel lateral</p>
                            </div>
                         )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {activeTab === 'links' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                 <header className="p-8 bg-latam-blue rounded-[32px] text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20">
                          <Globe size={32} />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold tracking-tighter uppercase mb-1">Directorio de Accesos</h2>
                          <p className="text-[10px] font-black tracking-[0.2em] text-white/60 uppercase">Links Corporativos y Herramientas Regionales</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="outline" 
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-10 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                          onClick={async () => {
                             const targetUrl = linksWebhookUrl || webhookUrl;
                             if (!targetUrl) {
                                toast.error('Configura el Webhook primero');
                                return;
                             }
                             setIsSyncing(true);
                             try {
                               const controller = new AbortController();
                               const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
                               
                               const res = await fetch(targetUrl, { signal: controller.signal });
                               clearTimeout(timeoutId);
                               
                               const data = await res.json();
                               console.log('Sync Links Data Response:', data);

                               let receivedLinks = null;

                               // Robust check for links in the response
                               if (data.linkData) {
                                 receivedLinks = data.linkData;
                               } else if (data.links) {
                                 receivedLinks = data.links;
                               } else if (data.data && Array.isArray(data.data)) {
                                 const potentialLinks = data.data;
                                 if (potentialLinks.length > 0 && (potentialLinks[0].nombre || potentialLinks[0].link)) {
                                   receivedLinks = potentialLinks;
                                 }
                               } else if (Array.isArray(data)) {
                                 receivedLinks = data;
                               }

                               if (receivedLinks && Array.isArray(receivedLinks)) {
                                 setLinkData(receivedLinks);
                                 await fetch('/api/data/save', {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({
                                     workTasks, fefaTasks, budget, importantEvents, ifnData, linkData: receivedLinks
                                   })
                                 });
                                 toast.success('Directorio de enlaces actualizado');
                               } else {
                                 console.warn('Estructura de respuesta no reconocida:', data);
                                 toast.error('No se encontraron enlaces válidos.');
                               }
                             } catch (err: any) {
                               if (err.name === 'AbortError') {
                                 toast.error('Tiempo de espera agotado (60s).');
                               } else {
                                 toast.error('Error al sincronizar datos');
                                 console.error(err);
                               }
                             } finally {
                               setIsSyncing(false);
                             }
                          }}
                        >
                          <RefreshCcw size={16} className={cn("mr-2", isSyncing && "animate-spin")} />
                          {isSyncing ? 'SINCRONIZANDO...' : 'ACTUALIZAR DATOS'}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-8 relative max-w-2xl">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                      <input 
                        type="text"
                        placeholder="Buscar acceso por nombre..."
                        value={linkSearchTerm}
                        onChange={(e) => setLinkSearchTerm(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-6 text-sm text-white placeholder:text-white/30 focus:ring-4 focus:ring-white/10 outline-none transition-all font-bold backdrop-blur-sm"
                      />
                    </div>
                 </header>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    {linkData
                      .filter(l => 
                        (l.status || '').toUpperCase() === 'ACTIVO' && 
                        (l.nombre || '').toLowerCase().includes(linkSearchTerm.toLowerCase())
                      )
                      .map((link, idx) => (
                        <motion.div
                          key={link.id || idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group"
                        >
                          <a 
                            href={link.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block bg-white p-6 rounded-[24px] border border-zinc-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden active:scale-95"
                          >
                             <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ExternalLink size={16} className="text-latam-blue" />
                             </div>
                             <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-latam-blue group-hover:bg-latam-blue group-hover:text-white transition-colors">
                                   <Globe size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                   <h3 className="font-bold text-zinc-900 group-hover:text-latam-blue transition-colors truncate mb-1 uppercase tracking-tight">{link.nombre}</h3>
                                   {link.seccion && (
                                      <Badge variant="outline" className="text-[8px] font-black uppercase text-zinc-400 border-zinc-100 mb-2">
                                         {link.seccion}
                                      </Badge>
                                   )}
                                   <p className="text-[11px] text-zinc-500 font-medium line-clamp-2 leading-relaxed">
                                      {link.descripcion || 'Sin descripción adicional disponible.'}
                                    </p>
                                </div>
                             </div>
                             <div className="mt-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-black text-latam-blue uppercase tracking-widest">Acceso Directo</span>
                                <ChevronRight size={14} className="text-latam-blue animate-pulse" />
                             </div>
                          </a>
                        </motion.div>
                      ))
                    }

                    {linkData.length === 0 && !isSyncing && (
                      <div className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-4 bg-white/50 border-2 border-dashed border-zinc-200 rounded-[40px]">
                        <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                           <Globe size={40} className="text-zinc-200" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-zinc-400 uppercase tracking-tighter">Directorio Vacío</h3>
                          <p className="text-xs text-zinc-400 font-bold max-w-xs mx-auto mt-2">
                            Haz click en el botón de actualización para cargar los links compartidos desde Google Sheets.
                          </p>
                        </div>
                      </div>
                    )}
                 </div>
              </div>
            )}

            {activeTab === 'eisenhower' && (
               <div className="space-y-8">
                  <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border-none mb-4">
                    <div>
                      <h2 className="text-2xl font-bold uppercase tracking-tighter text-latam-lavender">Matriz de Eisenhower</h2>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Arrastra las tareas para priorizar tu operación</p>
                    </div>
                    <Button 
                      className="bg-latam-lavender hover:bg-latam-lavender/90 text-white font-bold"
                      onClick={() => setEditingTask({
                        id: `new-${Date.now()}`,
                        date: format(new Date(), 'yyyy-MM-dd'),
                        task: '',
                        category: 'General',
                        deadline: format(new Date(), 'yyyy-MM-dd'),
                        priority: 'Medium',
                        responsible: 'Maria Fernanda',
                        status: 'Pending',
                        description: '',
                        isUrgent: true,
                        isImportant: true
                      })}
                    >
                      <Plus size={18} className="mr-2" /> NUEVA TAREA
                    </Button>
                  </div>

                  {/* Leyenda de Distribución */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                    <div className="bg-white p-3 rounded-xl border border-latam-lavender/10 flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-latam-salmon"></div>
                      <span className="text-[10px] font-bold uppercase text-zinc-500">Q1: Crítico (Hacer)</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-latam-lavender/10 flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-latam-blue"></div>
                      <span className="text-[10px] font-bold uppercase text-zinc-500">Q2: Estrategia (Agendar)</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-latam-lavender/10 flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-latam-green"></div>
                      <span className="text-[10px] font-bold uppercase text-zinc-500">Q3: Apoyo (Delegar)</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-latam-lavender/10 flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-latam-yellow"></div>
                      <span className="text-[10px] font-bold uppercase text-zinc-500">Q4: Ruido (Eliminar)</span>
                    </div>
                  </div>

                  <DndContext 
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-latam-lavender/10 border border-latam-lavender/10 rounded-3xl overflow-hidden shadow-xl min-h-[800px]">
                       <EisenhowerQuadrant 
                        id="urgent-important"
                        title="HACER AHORA"
                        subtitle="URGENTE + IMPORTANTE"
                        colorClass="bg-latam-salmon/10"
                        titleColor="text-latam-salmon"
                        badgeColor="bg-latam-salmon/20 text-latam-salmon"
                        icon={<AlertCircle size={20} />}
                        tasks={workTasks.filter(t => t.isUrgent && t.isImportant && t.status !== 'Completed')}
                       />
                       <EisenhowerQuadrant 
                        id="important-not-urgent"
                        title="PROGRAMAR"
                        subtitle="IMPORTANTE + NO URGENTE"
                        colorClass="bg-latam-blue/10"
                        titleColor="text-latam-blue"
                        badgeColor="bg-latam-blue/20 text-latam-blue"
                        icon={<Clock size={20} />}
                        tasks={workTasks.filter(t => !t.isUrgent && t.isImportant && t.status !== 'Completed')}
                       />
                       <EisenhowerQuadrant 
                        id="urgent-not-important"
                        title="DELEGAR"
                        subtitle="URGENTE + NO IMPORTANTE"
                        colorClass="bg-latam-green/10"
                        titleColor="text-green-700"
                        badgeColor="bg-latam-green/20 text-green-700"
                        icon={<RefreshCcw size={20} />}
                        tasks={workTasks.filter(t => t.isUrgent && !t.isImportant && t.status !== 'Completed')}
                       />
                       <EisenhowerQuadrant 
                        id="not-urgent-not-important"
                        title="ELIMINAR"
                        subtitle="NO URGENTE + NO IMPORTANTE"
                        colorClass="bg-latam-yellow/10"
                        titleColor="text-amber-700"
                        badgeColor="bg-latam-yellow/30 text-amber-900"
                        icon={<X size={20} />}
                        tasks={workTasks.filter(t => !t.isUrgent && !t.isImportant && t.status !== 'Completed')}
                       />
                    </div>
                    <DragOverlay>
                       {activeId ? (
                         <div className="bg-white p-4 rounded-xl shadow-2xl border-2 border-latam-lavender w-64 rotate-3 opacity-90">
                           <p className="text-sm font-bold truncate">{workTasks.find(t => t.id === activeId)?.task}</p>
                         </div>
                       ) : null}
                    </DragOverlay>
                  </DndContext>
               </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Edit Dialogs */}
      <EditingTaskDialog 
        task={editingTask} 
        onClose={() => setEditingTask(null)} 
        onSave={(updated) => {
          if (updated.id.startsWith('new-')) {
            const newTask = { ...updated, id: Math.random().toString(36).substr(2, 9) };
            setWorkTasks([newTask, ...workTasks]);
            toast.success('Nueva tarea añadida');
          } else {
            setWorkTasks(workTasks.map(t => t.id === updated.id ? updated : t));
            toast.success('Tarea de Latam actualizada');
          }
          setEditingTask(null);
        }}
      />
      <EditingFefaDialog 
        task={editingFefa} 
        onClose={() => setEditingFefa(null)} 
        onSave={(updated) => {
          if (updated.id.startsWith('new-')) {
            const newTask = { ...updated, id: Math.random().toString(36).substr(2, 9) };
            setFefaTasks([newTask, ...fefaTasks]);
            toast.success('Nuevo ritual añadido');
          } else {
            setFefaTasks(fefaTasks.map(t => t.id === updated.id ? updated : t));
            toast.success('Ritual personal actualizado');
          }
          setEditingFefa(null);
        }}
      />
      <EditingExpenseDialog 
        item={editingExpense} 
        onClose={() => setEditingExpense(null)} 
        onSave={(updated) => {
          if (updated.id?.startsWith('new-')) {
            const newItem = { ...updated, id: Math.random().toString(36).substr(2, 9) };
            setBudget([newItem, ...budget]);
            toast.success('Gasto registrado');
          } else {
            setBudget(budget.map(b => b.id === updated.id ? updated : b));
            toast.success('Gasto actualizado');
          }
          setEditingExpense(null);
        }}
      />
      <ImportExpenseDialog 
        isOpen={importDialogOpen} 
        onClose={() => setImportDialogOpen(false)} 
        onImport={(items) => {
          setBudget([...items, ...budget]);
          setImportDialogOpen(false);
          toast.success(`${items.length} movimientos importados`);
        }}
      />
      <ImportantEventDialog 
        event={editingEvent} 
        onClose={() => setEditingEvent(null)} 
        onSave={(updated) => {
          if (updated.id?.startsWith('new-')) {
            const newItem = { ...updated, id: Math.random().toString(36).substr(2, 9) };
            setImportantEvents([newItem, ...importantEvents]);
            toast.success('Evento programado');
          } else {
            setImportantEvents(importantEvents.map(e => e.id === updated.id ? updated : e));
            toast.success('Evento actualizado');
          }
          setEditingEvent(null);
        }}
      />
      <ImportEventsDialog 
        isOpen={importEventsOpen} 
        onClose={() => setImportEventsOpen(false)} 
        onImport={(items) => {
          setImportantEvents([...items, ...importantEvents]);
          setImportEventsOpen(false);
          toast.success(`${items.length} eventos importados`);
        }}
      />
      <IFNDetailDialog 
        record={selectedIFN} 
        onClose={() => setSelectedIFN(null)} 
      />
      <Toaster />
    </div>
  );
}

function IFNDetailDialog({ record, onClose }: { record: IFNRecord | null, onClose: () => void }) {
  if (!record) return null;

  // Filtrar algunos campos internos o repetidos para la ficha
  const details = Object.entries(record).filter(([key]) => 
    !['id', 'sys_id'].includes(key)
  );

  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-latam-blue text-white">
          <div className="flex justify-between items-start">
            <div>
              <Badge className="bg-white/20 text-white border-none mb-2 font-black text-[10px]">FICHA DE REGISTRO</Badge>
              <DialogTitle className="text-2xl font-bold tracking-tighter uppercase">{record.number || 'Detalle del Ticket'}</DialogTitle>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase",
              String(record.state || '').toLowerCase().includes('resolved') ? 'bg-latam-green text-green-700' : 'bg-white/10 text-white'
            )}>
              {record.state || 'PENDIENTE'}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="p-6 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {details.map(([key, value]) => {
                 // Formatear el nombre de la key (ej: short_description -> Short Description)
                 const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                 
                 return (
                   <div key={key} className={cn(
                     "p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col gap-1",
                     (key === 'description' || key === 'short_description') && "md:col-span-2"
                   )}>
                     <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
                     <span className="text-sm font-bold text-zinc-700 leading-snug whitespace-pre-wrap">
                       {value ? String(value) : '-'}
                     </span>
                   </div>
                 );
               })}
             </div>
          </div>
        </ScrollArea>
        
        <div className="p-6 bg-zinc-50 border-t flex justify-end">
          <Button onClick={onClose} className="bg-latam-blue hover:bg-latam-blue/90 font-bold uppercase tracking-widest text-[10px]">
            CERRAR FICHA
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EisenhowerQuadrant({ id, title, subtitle, colorClass, titleColor, badgeColor, icon, tasks }: { 
  id: string, 
  title: string, 
  subtitle: string, 
  colorClass: string, 
  titleColor: string, 
  badgeColor: string, 
  icon: React.ReactNode, 
  tasks: Task[] 
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "p-8 aspect-square flex flex-col transition-all duration-200", 
        colorClass,
        isOver && "ring-4 ring-inset ring-latam-lavender/30 scale-[0.98]"
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className={cn("text-lg font-bold flex items-center gap-2", titleColor)}>
          {icon} {title}
        </h3>
        <span className={cn("text-[9px] font-bold uppercase px-2 py-1 rounded", badgeColor)}>{subtitle}</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-3 min-h-[100px]">
          {tasks.map(t => (
            <EisenhowerTask key={t.id} task={t} />
          ))}
          {tasks.length === 0 && !isOver && (
            <div className="text-center py-20 text-zinc-400 text-[10px] font-bold uppercase tracking-widest opacity-50">
               Zona Vacía
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function EisenhowerTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "bg-white p-4 rounded-xl shadow-sm border border-zinc-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow",
        isDragging && "opacity-0"
      )}
    >
      <p className="text-sm font-medium">{task.task}</p>
      <div className="flex justify-between items-center mt-2">
        <p className="text-[10px] text-zinc-400 uppercase tracking-tighter">{task.category}</p>
        <Badge variant="outline" className="text-[8px] py-0 h-4">{task.deadline}</Badge>
      </div>
    </div>
  );
}

function EditingTaskDialog({ task, onClose, onSave }: { task: Task | null, onClose: () => void, onSave: (task: Task) => void }) {
  const [data, setData] = useState<Task | null>(null);

  useEffect(() => {
    if (task) setData({ ...task });
  }, [task]);

  if (!task || !data) return null;

  return (
    <Dialog open={!!task} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-white border-latam-lavender">
        <DialogHeader>
          <DialogTitle className="font-bold text-latam-lavender uppercase">Editar Tarea Latam</DialogTitle>
          <DialogDescription className="text-[10px] font-bold text-zinc-400 uppercase">Modifica los detalles de la operación regional</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Nombre de la Tarea</label>
            <Input value={data.task} onChange={(e) => setData({ ...data, task: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-[10px] font-bold uppercase text-zinc-400">Prioridad</label>
              <Select value={data.priority} onValueChange={(val: any) => setData({ ...data, priority: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-[10px] font-bold uppercase text-zinc-400">Estado</label>
              <Select value={data.status} onValueChange={(val: any) => setData({ ...data, status: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Descripción</label>
            <Input value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-bold uppercase text-zinc-400 text-latam-salmon">Comentarios de Seguimiento</label>
            <Input value={data.comments || ''} onChange={(e) => setData({ ...data, comments: e.target.value })} placeholder="¿Alguna nota extra?" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="font-bold text-xs">CANCELAR</Button>
          <Button onClick={() => onSave(data)} className="bg-latam-lavender font-bold text-xs text-white">
            {task.id.startsWith('new-') ? 'CREAR TAREA' : 'GUARDAR CAMBIOS'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditingFefaDialog({ task, onClose, onSave }: { task: FefaTask | null, onClose: () => void, onSave: (task: FefaTask) => void }) {
  const [data, setData] = useState<FefaTask | null>(null);

  useEffect(() => {
    if (task) setData({ ...task });
  }, [task]);

  if (!task || !data) return null;

  return (
    <Dialog open={!!task} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-white border-latam-salmon">
        <DialogHeader>
          <DialogTitle className="font-bold text-latam-salmon uppercase">Editar Ritual Fefa</DialogTitle>
          <DialogDescription className="text-[10px] font-bold text-zinc-400 uppercase">Ajusta tus metas y hábitos personales</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Nombre del Item</label>
            <Input value={data.item} onChange={(e) => setData({ ...data, item: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Descripción</label>
            <Input value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-bold uppercase text-zinc-400 text-latam-salmon">Comentarios / Notas</label>
            <Input value={data.comments || ''} onChange={(e) => setData({ ...data, comments: e.target.value })} placeholder="Algo que quieras recordar..." />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="font-bold text-xs">CANCELAR</Button>
          <Button onClick={() => onSave(data)} className="bg-latam-salmon font-bold text-xs text-white">
            {task.id.startsWith('new-') ? 'CREAR RITUAL' : 'GUARDAR CAMBIOS'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditingExpenseDialog({ item, onClose, onSave }: { item: BudgetItem | null, onClose: () => void, onSave: (item: BudgetItem) => void }) {
  const [data, setData] = useState<BudgetItem | null>(null);

  useEffect(() => {
    if (item) setData({ ...item });
  }, [item]);

  if (!item || !data) return null;

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-white border-latam-blue">
        <DialogHeader>
          <DialogTitle className="font-bold text-latam-blue uppercase">Gestión de Gastos / Ingresos</DialogTitle>
          <DialogDescription className="text-[10px] font-bold text-zinc-400 uppercase">Registra tus movimientos financieros</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Descripción</label>
            <Input value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-[10px] font-bold uppercase text-zinc-400">Monto</label>
              <Input type="number" value={data.amount} onChange={(e) => setData({ ...data, amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="grid gap-2">
              <label className="text-[10px] font-bold uppercase text-zinc-400">Tipo</label>
              <Select value={data.type} onValueChange={(val: any) => setData({ ...data, type: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Income">Ingreso</SelectItem>
                  <SelectItem value="Expense">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Categoría</label>
            <Select value={data.category} onValueChange={(val: string) => setData({ ...data, category: val })}>
              <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Casa">Casa</SelectItem>
                <SelectItem value="Deporte">Deporte</SelectItem>
                <SelectItem value="Vicente">Vicente</SelectItem>
                <SelectItem value="Oscar">Oscar</SelectItem>
                <SelectItem value="Mamá">Mamá</SelectItem>
                <SelectItem value="Gastos varios">Gastos varios</SelectItem>
                <SelectItem value="Salud">Salud</SelectItem>
                <SelectItem value="Alimentación">Alimentación</SelectItem>
                <SelectItem value="Transporte">Transporte</SelectItem>
                <SelectItem value="Youbox">Youbox</SelectItem>
                <SelectItem value="Latam">Latam</SelectItem>
                <SelectItem value="Otros">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Fecha</label>
            <Input type="date" value={data.date} onChange={(e) => setData({ ...data, date: e.target.value })} />
          </div>
          <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl">
            <Checkbox 
              id="isMonthly" 
              checked={data.isMonthly} 
              onCheckedChange={(checked) => setData({ ...data, isMonthly: !!checked })}
              className="border-latam-blue data-[state=checked]:bg-latam-blue"
            />
            <label htmlFor="isMonthly" className="text-xs font-bold text-latam-blue cursor-pointer uppercase">Gasto recurrente mensual</label>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="font-bold text-xs">CANCELAR</Button>
          <Button onClick={() => onSave(data)} className="bg-latam-blue font-bold text-xs text-white uppercase">
            {item.id?.startsWith('new-') ? 'REGISTRAR MOVIMIENTO' : 'GUARDAR CAMBIOS'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImportantEventDialog({ event, onClose, onSave }: { event: ImportantEvent | null, onClose: () => void, onSave: (event: ImportantEvent) => void }) {
  const [data, setData] = useState<ImportantEvent | null>(null);

  useEffect(() => {
    if (event) setData({ ...event });
  }, [event]);

  if (!event || !data) return null;

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-white border-latam-blue">
        <DialogHeader>
          <DialogTitle className="font-bold text-latam-blue uppercase">Gestión de Eventos</DialogTitle>
          <DialogDescription className="text-[10px] font-bold text-zinc-400 uppercase">Organiza tu agenda importante</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Nombre del Evento</label>
            <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Ej: Revisión de Flota" />
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Fecha</label>
            <Input type="date" value={data.date} onChange={(e) => setData({ ...data, date: e.target.value })} />
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl">
            <Checkbox 
              id="isAllDay" 
              checked={data.isAllDay} 
              onCheckedChange={(checked) => setData({ ...data, isAllDay: !!checked })}
              className="border-latam-blue data-[state=checked]:bg-latam-blue"
            />
            <label htmlFor="isAllDay" className="text-xs font-bold text-latam-blue cursor-pointer uppercase">Todo el día</label>
          </div>

          {!data.isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Inicio</label>
                <Input type="time" value={data.startTime} onChange={(e) => setData({ ...data, startTime: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Término</label>
                <Input type="time" value={data.endTime || ''} onChange={(e) => setData({ ...data, endTime: e.target.value })} />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Recurrencia</label>
            <Select value={data.recurring} onValueChange={(val: any) => setData({ ...data, recurring: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="None">Puntual (Sin repetición)</SelectItem>
                <SelectItem value="Daily">Diario</SelectItem>
                <SelectItem value="Weekly">Semanal</SelectItem>
                <SelectItem value="Monthly">Mensual</SelectItem>
                <SelectItem value="Yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Ubicación / Link de Meet</label>
            <Input value={data.location} onChange={(e) => setData({ ...data, location: e.target.value })} placeholder="Dirección o URL de videollamada" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="font-bold text-xs">CANCELAR</Button>
          <Button onClick={() => onSave(data)} className="bg-latam-blue font-bold text-xs text-white uppercase">
            {event.id?.startsWith('new-') ? 'AGENDAR EVENTO' : 'GUARDAR CAMBIOS'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImportExpenseDialog({ isOpen, onClose, onImport }: { isOpen: boolean, onClose: () => void, onImport: (items: BudgetItem[]) => void }) {
  const [text, setText] = useState('');

  const handleImport = () => {
    const lines = text.split('\n').filter(l => l.trim());
    const newItems: BudgetItem[] = lines.map(line => {
      const parts = line.split('\t').length > 1 ? line.split('\t') : line.split(',');
      return {
        id: Math.random().toString(36).substr(2, 9),
        date: parts[0]?.trim() || format(new Date(), 'yyyy-MM-dd'),
        description: parts[1]?.trim() || 'Importado',
        amount: Math.abs(parseFloat(parts[2]?.replace(/[^\d.-]/g, ''))) || 0,
        category: 'Otros',
        type: parts[2]?.includes('-') || parts[3]?.toLowerCase().includes('gasto') ? 'Expense' : 'Income',
        isMonthly: false
      };
    });
    onImport(newItems);
    setText('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white border-latam-blue">
        <DialogHeader>
          <DialogTitle className="font-bold text-latam-blue uppercase">Importar Datos Bancarios</DialogTitle>
          <DialogDescription className="text-[10px] font-bold text-zinc-400 uppercase">Pega las líneas de tu extracto bancario (Fecha, Descripción, Monto)</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="bg-zinc-50 p-4 rounded-xl border-dashed border-2 border-zinc-200">
             <p className="text-[10px] font-bold uppercase text-zinc-400 mb-2">Formato esperado (CSV o Tab):</p>
             <code className="text-[10px] text-zinc-600 block bg-white p-2 rounded border">
                2024-05-10, Supermercado Latam, -45.50<br/>
                2024-05-11, Deposito Nomina, 2500.00
             </code>
          </div>
          <textarea 
            className="w-full h-48 p-4 text-xs font-mono border rounded-xl focus:ring-2 focus:ring-latam-blue outline-none"
            placeholder="Pega aquí..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="font-bold text-xs">CANCELAR</Button>
          <Button 
            disabled={!text.trim()} 
            onClick={handleImport} 
            className="bg-latam-blue font-bold text-xs text-white"
          >
            PROCESAR E IMPORTAR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImportEventsDialog({ isOpen, onClose, onImport }: { isOpen: boolean, onClose: () => void, onImport: (items: ImportantEvent[]) => void }) {
  const [text, setText] = useState('');

  const handleImport = () => {
    const lines = text.split('\n').filter(l => l.trim());
    const newItems: ImportantEvent[] = lines.map(line => {
      const parts = line.split('\t').length > 1 ? line.split('\t') : line.split(',');
      return {
        id: Math.random().toString(36).substr(2, 9),
        date: parts[0]?.trim() || format(new Date(), 'yyyy-MM-dd'),
        name: parts[1]?.trim() || 'Evento Importado',
        startTime: parts[2]?.trim() || '09:00',
        endTime: parts[3]?.trim() || undefined,
        isAllDay: parts[3]?.trim().toLowerCase() === 'todo el día',
        recurring: (parts[4]?.trim().toLowerCase().includes('sí') || parts[4]?.trim().toLowerCase().includes('yes')) ? 'Monthly' : 'None',
        location: parts[5]?.trim() || ''
      };
    });
    onImport(newItems);
    setText('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white border-latam-blue">
        <DialogHeader>
          <DialogTitle className="font-bold text-latam-blue uppercase">Carga Masiva de Eventos</DialogTitle>
          <DialogDescription className="text-[10px] font-bold text-zinc-400 uppercase">Pega los datos de tu agenda (Fecha, Evento, Hora, ¿Repite?, Ubicación)</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="bg-zinc-50 p-4 rounded-xl border-dashed border-2 border-zinc-200">
             <p className="text-[10px] font-bold uppercase text-zinc-400 mb-2">Formato esperado (CSV o Tab):</p>
             <code className="text-[10px] text-zinc-600 block bg-white p-2 rounded border">
                2024-05-10, Revisión de Flota, 09:00, Sí, Hangar 4<br/>
                2024-05-11, Sync con LIM, 11:30, No, https://meet.google.com/xyz
             </code>
          </div>
          <textarea 
            className="w-full h-48 p-4 text-xs font-mono border rounded-xl focus:ring-2 focus:ring-latam-blue outline-none"
            placeholder="Pega aquí..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="font-bold text-xs">CANCELAR</Button>
          <Button 
            disabled={!text.trim()} 
            onClick={handleImport} 
            className="bg-latam-blue font-bold text-xs text-white"
          >
            PROCESAR E IMPORTAR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function MobileNavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all",
        active ? "text-latam-lavender" : "text-zinc-400"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-xl transition-colors",
        active ? "bg-latam-lavender/10" : ""
      )}>
        {icon}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}
function NavButton({ active, onClick, icon, label, collapsed }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, collapsed: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200",
        active 
          ? "bg-latam-lavender/10 text-latam-lavender font-bold shadow-sm" 
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
      )}
    >
      <span className={cn("transition-transform", active && "scale-110")}>{icon}</span>
      {!collapsed && (
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm truncate"
        >
          {label}
        </motion.span>
      )}
    </button>
  );
}
