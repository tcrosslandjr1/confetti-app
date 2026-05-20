import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, ArrowUpDown, Crown, KeyRound, Loader2, MoreHorizontal, Shield, Sparkles, Trash2, UserCheck, Users, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { listAdminUsersFn, setUserRoleFn, setUserSuspendedFn, sendPasswordResetFn, deleteUserFn, type AdminUserRow, type AppRole } from "@/lib/admin-users.functions";
import { AdminEmptyState, AdminFilterBar, AdminKpiCard, AdminKpiGrid, AdminPageHeader, downloadCsv } from "@/components/admin/AdminUI";

export const Route = createLazyFileRoute("/admin/users")({
  component: AdminUsersPage,
});

const ROLES: AppRole[] = ["admin", "business_owner", "customer"];

const ROLE_TONE: Record<AppRole, string> = {
    admin: "bg-coral/20 text-foreground",
    business_owner: "bg-purple/20 text-foreground",
    customer: "bg-muted text-muted-foreground",
};

function StatusBadge({ banned }: {
    banned: boolean;
}) {
    if (banned)
        return (<Badge className="bg-destructive/15 text-destructive hover:bg-destructive/20">
        <UserX className="mr-1 h-3 w-3"/> Suspended
      </Badge>);
    return (<Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">
      <UserCheck className="mr-1 h-3 w-3"/> Active
    </Badge>);
}

function Avatar({ name }: {
    name: string;
}) {
    const initials = (name || "?")
        .split(/\s+|@/)
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
    return (<div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-vibe text-xs font-bold text-primary-foreground">
      {initials}
    </div>);
}

function fmtDate(iso: string | null) {
    if (!iso)
        return "—";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function isBanned(u: AdminUserRow) {
    return !!u.banned_until && new Date(u.banned_until) > new Date();
}

function AdminUsersPage() {
    const { user: me } = useAuth();
    const fetchUsers = useServerFn(listAdminUsersFn);
    const setRoleSrv = useServerFn(setUserRoleFn);
    const setSuspendedSrv = useServerFn(setUserSuspendedFn);
    const sendResetSrv = useServerFn(sendPasswordResetFn);
    const deleteSrv = useServerFn(deleteUserFn);
    const [users, setUsers] = useState<AdminUserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | AppRole>("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
    const [pending, setPending] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<AdminUserRow | null>(null);
    const load = async () => {
        setLoading(true);
        try {
            const res = await fetchUsers({ data: { page: 1, perPage: 200 } });
            setUsers(res.users);
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load users");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const counts = useMemo(() => ({
        total: users.length,
        active: users.filter((u) => !isBanned(u)).length,
        suspended: users.filter((u) => isBanned(u)).length,
        admins: users.filter((u) => u.roles.includes("admin")).length,
    }), [users]);
    const filtered = useMemo(() => {
        return users.filter((u) => {
            const banned = isBanned(u);
            if (roleFilter !== "all" && !u.roles.includes(roleFilter))
                return false;
            if (statusFilter === "active" && banned)
                return false;
            if (statusFilter === "suspended" && !banned)
                return false;
            if (query) {
                const q = query.toLowerCase();
                if (!u.email.toLowerCase().includes(q) &&
                    !(u.display_name ?? "").toLowerCase().includes(q) &&
                    !u.id.toLowerCase().includes(q))
                    return false;
            }
            return true;
        });
    }, [users, query, roleFilter, statusFilter]);
    const toggleRole = async (u: AdminUserRow, role: AppRole) => {
        const grant = !u.roles.includes(role);
        setPending(u.id);
        try {
            await setRoleSrv({ data: { userId: u.id, role, grant } });
            setUsers((prev) => prev.map((x) => x.id === u.id
                ? {
                    ...x,
                    roles: grant ? [...x.roles, role] : x.roles.filter((r) => r !== role),
                }
                : x));
            toast.success(grant ? `Granted ${role}` : `Revoked ${role}`);
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update role");
        }
        finally {
            setPending(null);
        }
    };
    const toggleSuspend = async (u: AdminUserRow) => {
        const suspend = !isBanned(u);
        setPending(u.id);
        try {
            await setSuspendedSrv({ data: { userId: u.id, suspend } });
            setUsers((prev) => prev.map((x) => x.id === u.id
                ? {
                    ...x,
                    banned_until: suspend
                        ? new Date(Date.now() + 100 * 365 * 86400000).toISOString()
                        : null,
                }
                : x));
            toast.success(suspend ? "Account suspended" : "Account reactivated");
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update status");
        }
        finally {
            setPending(null);
        }
    };
    const sendReset = async (u: AdminUserRow) => {
        if (!u.email)
            return;
        try {
            await sendResetSrv({ data: { email: u.email } });
            toast.success(`Password reset link generated for ${u.email}`);
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to send reset");
        }
    };
    const doDelete = async () => {
        if (!confirmDelete)
            return;
        setPending(confirmDelete.id);
        try {
            await deleteSrv({ data: { userId: confirmDelete.id } });
            setUsers((prev) => prev.filter((u) => u.id !== confirmDelete.id));
            toast.success("Account deleted");
            setConfirmDelete(null);
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete");
        }
        finally {
            setPending(null);
        }
    };
    return (<div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">People</p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <Users className="h-7 w-7"/> Users
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage roles, suspend accounts, and trigger password resets.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { k: "total", label: "Total", v: counts.total },
            { k: "active", label: "Active", v: counts.active },
            { k: "suspended", label: "Suspended", v: counts.suspended },
            { k: "admins", label: "Admins", v: counts.admins },
        ].map((s) => (<div key={s.k} className="rounded-xl border border-border bg-card px-4 py-2 shadow-card">
              <div className="text-xl font-bold font-display">{s.v}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
            </div>))}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email, or ID…" className="pl-9"/>
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as "all" | AppRole)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          <option value="all">All roles</option>
          {ROLES.map((r) => (<option key={r} value={r}>
              {r}
            </option>))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "suspended")} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Refresh"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Pts</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (<TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-sm text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin"/>
                </TableCell>
              </TableRow>) : filtered.length === 0 ? (<TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No users match your filters.
                </TableCell>
              </TableRow>) : (filtered.map((u) => {
            const banned = isBanned(u);
            const isMe = me?.id === u.id;
            const busy = pending === u.id;
            return (<TableRow key={u.id} className={busy ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.display_name ?? u.email}/>
                        <div className="min-w-0">
                          <div className="font-semibold leading-tight flex items-center gap-1.5">
                            {u.display_name ?? u.email.split("@")[0]}
                            {u.roles.includes("admin") && (<Crown className="h-3.5 w-3.5 text-gold"/>)}
                            {isMe && (<span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono uppercase">
                                you
                              </span>)}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild disabled={busy}>
                          <button className="inline-flex flex-wrap items-center gap-1">
                            {u.roles.length === 0 ? (<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                                none
                              </span>) : (u.roles.map((r) => (<span key={r} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${ROLE_TONE[r]}`}>
                                  <Shield className="h-3 w-3"/> {r.replace("_", " ")}
                                </span>)))}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuLabel>Toggle role</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {ROLES.map((r) => {
                    const has = u.roles.includes(r);
                    return (<DropdownMenuItem key={r} onClick={() => void toggleRole(u, r)} className="capitalize">
                                {has ? "Revoke " : "Grant "}
                                {r.replace("_", " ")}
                              </DropdownMenuItem>);
                })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      <StatusBadge banned={banned}/>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{u.confetti_pts}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtDate(u.created_at)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtDate(u.last_sign_in_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild disabled={busy}>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            {busy ? (<Loader2 className="h-4 w-4 animate-spin"/>) : (<MoreHorizontal className="h-4 w-4"/>)}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Account</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => void sendReset(u)}>
                            <KeyRound className="mr-2 h-4 w-4"/> Send password reset
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={isMe} onClick={() => void toggleSuspend(u)} className={banned ? "" : "text-destructive focus:text-destructive"}>
                            {banned ? (<>
                                <UserCheck className="mr-2 h-4 w-4"/> Reactivate
                              </>) : (<>
                                <UserX className="mr-2 h-4 w-4"/> Suspend
                              </>)}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled={isMe} onClick={() => setConfirmDelete(u)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4"/> Delete account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>);
        }))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this account?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.email} will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void doDelete()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
