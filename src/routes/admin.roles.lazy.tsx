import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Crown, Loader2, ShieldCheck, ShieldX, UserPlus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth-context";
import { listAdminsFn, grantAdminByEmailFn, revokeAdminFn, type AdminMember } from "@/lib/admin-roles.functions";

export const Route = createLazyFileRoute("/admin/roles")({
  component: AdminRolesPage,
});

function fmtDate(iso: string | null) {
    if (!iso)
        return "—";
    return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function AdminRolesPage() {
    const { user: me } = useAuth();
    const fetchAdmins = useServerFn(listAdminsFn);
    const grantSrv = useServerFn(grantAdminByEmailFn);
    const revokeSrv = useServerFn(revokeAdminFn);
    const [admins, setAdmins] = useState<AdminMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [granting, setGranting] = useState(false);
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [confirmRevoke, setConfirmRevoke] = useState<AdminMember | null>(null);
    const load = async () => {
        setLoading(true);
        try {
            const res = await fetchAdmins();
            setAdmins(res.admins);
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load admins");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const onGrant = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed)
            return;
        setGranting(true);
        try {
            await grantSrv({ data: { email: trimmed } });
            toast.success(`Granted admin to ${trimmed}`);
            setEmail("");
            await load();
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to grant");
        }
        finally {
            setGranting(false);
        }
    };
    const onRevoke = async () => {
        if (!confirmRevoke)
            return;
        setPendingId(confirmRevoke.user_id);
        try {
            await revokeSrv({ data: { userId: confirmRevoke.user_id } });
            toast.success(`Revoked admin from ${confirmRevoke.email || confirmRevoke.user_id}`);
            setAdmins((prev) => prev.filter((a) => a.user_id !== confirmRevoke.user_id));
            setConfirmRevoke(null);
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to revoke");
        }
        finally {
            setPendingId(null);
        }
    };
    return (<div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Access</p>
          <h1 className="font-display text-3xl font-bold leading-tight flex items-center gap-2">
            <Crown className="h-7 w-7 text-primary"/> Admin roles
          </h1>
          <p className="text-sm text-muted-foreground">
            Grant or revoke the admin role. Need to manage other roles?{" "}
            <Link to="/admin/users" className="font-semibold underline">
              Use the full users page
            </Link>
            .
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-2 text-center shadow-card">
          <div className="text-xl font-bold font-display">{admins.length}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Active admins
          </div>
        </div>
      </header>

      <form onSubmit={onGrant} className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card">
        <UserPlus className="ml-1 h-4 w-4 text-muted-foreground"/>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com — must already have an account" className="min-w-[260px] flex-1" required/>
        <Button type="submit" disabled={granting || !email.trim()}>
          {granting ? (<Loader2 className="mr-2 h-4 w-4 animate-spin"/>) : (<ShieldCheck className="mr-2 h-4 w-4"/>)}
          Grant admin
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={() => void load()} disabled={loading} aria-label="Refresh">
          {loading ? (<Loader2 className="h-4 w-4 animate-spin"/>) : (<RefreshCw className="h-4 w-4"/>)}
        </Button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admin</TableHead>
              <TableHead>Granted</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (<TableRow>
                <TableCell colSpan={4} className="py-16 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin"/>
                </TableCell>
              </TableRow>) : admins.length === 0 ? (<TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                  No admins yet.
                </TableCell>
              </TableRow>) : (admins.map((a) => {
            const isMe = me?.id === a.user_id;
            const busy = pendingId === a.user_id;
            return (<TableRow key={a.user_id} className={busy ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-vibe text-xs font-bold text-primary-foreground">
                          <Crown className="h-4 w-4"/>
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold leading-tight flex items-center gap-1.5">
                            {a.display_name ?? a.email.split("@")[0] ?? a.user_id.slice(0, 8)}
                            {isMe && (<span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono uppercase">
                                you
                              </span>)}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {a.email || a.user_id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtDate(a.granted_at)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtDate(a.last_sign_in_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" disabled={isMe || busy} onClick={() => setConfirmRevoke(a)} className="text-destructive hover:text-destructive">
                        <ShieldX className="mr-1.5 h-4 w-4"/>
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>);
        }))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirmRevoke} onOpenChange={(o) => !o && setConfirmRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke admin access?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRevoke?.email || confirmRevoke?.user_id} will lose access to the admin
              console. The account itself is not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => {
            e.preventDefault();
            void onRevoke();
        }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Revoke admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
