import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Users, MoreHorizontal, Shield, UserCheck, UserX, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

type Role = "admin" | "moderator" | "customer";
type Status = "active" | "suspended" | "invited";
type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  city: string;
  bookings: number;
  joined: string;
  lastActive: string;
};

const SEED: User[] = [
  { id: "U-1042", name: "Sarah Klein", email: "sarah@k.co", role: "customer", status: "active", city: "Washington DC", bookings: 14, joined: "2024-08-12", lastActive: "2m ago" },
  { id: "U-1041", name: "Marcus Tate", email: "m.tate@mail.com", role: "customer", status: "active", city: "Arlington VA", bookings: 8, joined: "2024-11-03", lastActive: "1h ago" },
  { id: "U-1040", name: "Priya Rao", email: "priya@r.io", role: "moderator", status: "active", city: "Bethesda MD", bookings: 22, joined: "2024-02-19", lastActive: "12m ago" },
  { id: "U-1039", name: "Jordan Liu", email: "jliu@mail.com", role: "customer", status: "suspended", city: "Washington DC", bookings: 3, joined: "2025-01-22", lastActive: "3d ago" },
  { id: "U-1038", name: "Ana Ferreira", email: "ana.f@mail.com", role: "customer", status: "active", city: "Alexandria VA", bookings: 19, joined: "2023-09-08", lastActive: "5m ago" },
  { id: "U-1037", name: "Devon Hale", email: "devon@h.dev", role: "admin", status: "active", city: "Washington DC", bookings: 41, joined: "2023-04-01", lastActive: "just now" },
  { id: "U-1036", name: "Mia Chen", email: "mia@c.co", role: "customer", status: "invited", city: "Silver Spring MD", bookings: 0, joined: "2026-05-06", lastActive: "—" },
  { id: "U-1035", name: "Tomas Reid", email: "tomas@r.dev", role: "customer", status: "active", city: "Washington DC", bookings: 6, joined: "2025-06-14", lastActive: "2h ago" },
  { id: "U-1034", name: "Lena Park", email: "lena@p.co", role: "moderator", status: "active", city: "Arlington VA", bookings: 11, joined: "2024-10-30", lastActive: "30m ago" },
];

const ROLE_TONE: Record<Role, string> = {
  admin: "bg-coral/20 text-foreground",
  moderator: "bg-purple/20 text-foreground",
  customer: "bg-muted text-muted-foreground",
};

function StatusBadge({ status }: { status: Status }) {
  if (status === "active")
    return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20"><UserCheck className="mr-1 h-3 w-3" />Active</Badge>;
  if (status === "suspended")
    return <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/20"><UserX className="mr-1 h-3 w-3" />Suspended</Badge>;
  return <Badge className="bg-gold/20 text-foreground hover:bg-gold/30">Invited</Badge>;
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-vibe text-xs font-bold text-primary-foreground">
      {initials}
    </div>
  );
}

function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(SEED);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");

  const counts = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      suspended: users.filter((u) => u.status === "suspended").length,
      admins: users.filter((u) => u.role === "admin").length,
    }),
    [users],
  );

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !u.name.toLowerCase().includes(q) &&
          !u.email.toLowerCase().includes(q) &&
          !u.id.toLowerCase().includes(q) &&
          !u.city.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [users, query, roleFilter, statusFilter]);

  const setRole = (id: string, role: Role) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    toast.success(`Role updated to ${role}`);
  };

  const setStatus = (id: string, status: Status) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
    toast.success(
      status === "active" ? "Account reactivated" : status === "suspended" ? "Account suspended" : "Invite re-sent",
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">People</p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <Users className="h-7 w-7" /> Users
          </h1>
          <p className="text-sm text-muted-foreground">Search the user base and manage roles or account status.</p>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { k: "total", label: "Total", v: counts.total },
            { k: "active", label: "Active", v: counts.active },
            { k: "suspended", label: "Suspended", v: counts.suspended },
            { k: "admins", label: "Admins", v: counts.admins },
          ].map((s) => (
            <div key={s.k} className="rounded-xl border border-border bg-card px-4 py-2 shadow-card">
              <div className="text-xl font-bold font-display">{s.v}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, ID, or city…"
            className="pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "all" | Role)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All roles</option>
          <option value="admin">Admins</option>
          <option value="moderator">Moderators</option>
          <option value="customer">Customers</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | Status)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="invited">Invited</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>City</TableHead>
              <TableHead className="text-right">Bookings</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  No users match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} />
                      <div className="min-w-0">
                        <div className="font-semibold leading-tight flex items-center gap-1.5">
                          {u.name}
                          {u.role === "admin" && <Crown className="h-3.5 w-3.5 text-gold" />}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize transition hover:opacity-80 ${ROLE_TONE[u.role]}`}>
                          <Shield className="h-3 w-3" /> {u.role}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Set role</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {(["admin", "moderator", "customer"] as Role[]).map((r) => (
                          <DropdownMenuItem
                            key={r}
                            disabled={u.role === r}
                            onClick={() => setRole(u.id, r)}
                            className="capitalize"
                          >
                            {r}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell><StatusBadge status={u.status} /></TableCell>
                  <TableCell className="text-sm">{u.city}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{u.bookings}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.joined}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.lastActive}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {u.status !== "active" && (
                          <DropdownMenuItem onClick={() => setStatus(u.id, "active")}>
                            <UserCheck className="mr-2 h-4 w-4" /> Activate
                          </DropdownMenuItem>
                        )}
                        {u.status !== "suspended" && (
                          <DropdownMenuItem
                            onClick={() => setStatus(u.id, "suspended")}
                            className="text-destructive focus:text-destructive"
                          >
                            <UserX className="mr-2 h-4 w-4" /> Suspend
                          </DropdownMenuItem>
                        )}
                        {u.status === "invited" && (
                          <DropdownMenuItem onClick={() => toast.success(`Invite re-sent to ${u.email}`)}>
                            Resend invite
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
