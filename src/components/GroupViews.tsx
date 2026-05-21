/**
 * Group Collaboration UI Components
 * Groups list, GroupDetail, and GroupPlanView
 */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import {
  createGroupLocal,
  joinGroupByCode,
  submitCategories,
  getGroupCategories,
  getAvailableCategories,
  generateGroupPlanLocal,
  voteOnStop,
  refinePlan,
  getGroup,
  getUserGroups,
  getGroupPlans,
  getPlan,
  approvePlan,
  seedDemoGroup,
  type Group,
  type GroupType,
  type GroupPlan,
  type GroupPlanStop,
  type VoteValue,
} from "../lib/agents";

/* Shared layout wrappers — these match the ones in App.tsx */
function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`page ${className || ""}`}>{children}</div>;
}

function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
        ←
      </button>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════
   Groups — list, create, join
   ═══════════════════════════════════════════════════════════ */
export function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<GroupType>("friends");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setGroups(getUserGroups("demo-user"));
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const g = await createGroupLocal(name.trim(), type, "demo-user", "Tyrone");
    setGroups((prev) => [...prev, g]);
    setName("");
    setShowCreate(false);
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    try {
      const g = await joinGroupByCode(joinCode.trim().toUpperCase(), "demo-user", "Tyrone");
      if (!g) throw new Error("Invite code not found.");
      setGroups((prev) => [...prev, g]);
      setJoinCode("");
      setShowJoin(false);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const handleSeedDemo = async () => {
    const g = await seedDemoGroup();
    setGroups((prev) => [...prev, g]);
  };

  const typeEmojis: Record<GroupType, string> = {
    company: "🏢",
    friends: "👯",
    family: "👨‍👩‍👧‍👦",
    custom: "✨",
  };

  return (
    <Page>
      <Header eyebrow="Crew Up" title="Groups" />
      <div style={{ padding: "0 20px 100px" }}>
        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button className="action-btn" style={{ flex: 1 }} onClick={() => setShowCreate(true)}>
            + Create Group
          </button>
          <button
            className="action-btn"
            style={{ flex: 1, background: "rgba(255,255,255,.06)" }}
            onClick={() => setShowJoin(true)}
          >
            Join Group
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group-form-card"
            style={{ marginBottom: 16, background: "rgba(255,255,255,.04)", borderRadius: 16, padding: 16 }}
          >
            <input
              placeholder="Group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="chat-text-input"
              style={{
                marginBottom: 10,
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.1)",
                background: "rgba(255,255,255,.06)",
                color: "#fff",
                fontSize: 14,
              }}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {(["friends", "family", "company", "custom"] as GroupType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    fontSize: 13,
                    background: type === t ? "var(--accent)" : "rgba(255,255,255,.08)",
                    color: type === t ? "#000" : "#fff",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {typeEmojis[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="action-btn" onClick={handleCreate} disabled={loading}>
                {loading ? "Creating…" : "Create"}
              </button>
              <button
                className="action-btn"
                style={{ background: "rgba(255,255,255,.06)" }}
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Join form */}
        {showJoin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 16, background: "rgba(255,255,255,.04)", borderRadius: 16, padding: 16 }}
          >
            <input
              placeholder="Invite code (CNFT-XXXXXX)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              style={{
                marginBottom: 10,
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.1)",
                background: "rgba(255,255,255,.06)",
                color: "#fff",
                fontSize: 14,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="action-btn" onClick={handleJoin} disabled={loading}>
                {loading ? "Joining…" : "Join"}
              </button>
              <button
                className="action-btn"
                style={{ background: "rgba(255,255,255,.06)" }}
                onClick={() => setShowJoin(false)}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Group list */}
        {groups.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", opacity: 0.5 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <p>No groups yet — create one or join with a code!</p>
            <button
              onClick={handleSeedDemo}
              style={{
                marginTop: 12,
                padding: "8px 20px",
                borderRadius: 20,
                background: "rgba(255,255,255,.08)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Load Demo Group
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {groups.map((g) => (
              <motion.div
                key={g.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/groups/${g.id}`)}
                style={{
                  background: "rgba(255,255,255,.05)",
                  borderRadius: 16,
                  padding: 16,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div style={{ fontSize: 32 }}>{g.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{g.name}</div>
                  <div style={{ fontSize: 13, opacity: 0.5 }}>
                    {typeEmojis[g.type]} {g.type} · {g.members.length} member
                    {g.members.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ display: "flex" }}>
                  {g.members.slice(0, 4).map((m, i) => (
                    <div
                      key={m.id}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        background: `hsl(${(i * 90 + 200) % 360}, 60%, 50%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        marginLeft: i > 0 ? -8 : 0,
                        border: "2px solid #111",
                      }}
                    >
                      {m.displayName.charAt(0)}
                    </div>
                  ))}
                </div>
                <ChevronRight style={{ opacity: 0.3 }} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════
   GroupDetail — members, categories, plan generation
   ═══════════════════════════════════════════════════════════ */
export function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [plans, setPlans] = useState<GroupPlan[]>([]);
  const [availCats, setAvailCats] = useState<string[]>([]);
  const [myCats, setMyCats] = useState<string[]>([]);
  const [catTally, setCatTally] = useState<Array<{ category: string; votes: number }>>([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    const currentGroup = getGroup(id);
    setGroup(currentGroup);
    setPlans(getGroupPlans(id));
    setAvailCats(getAvailableCategories());
    setCatTally(getGroupCategories(id));
    const me = currentGroup?.members.find((m) => m.userId === "demo-user");
    if (me) setMyCats(me.categories);
  }, [id]);

  const handleCatToggle = async (cat: string) => {
    if (!id) return;
    let next: string[];
    if (myCats.includes(cat)) {
      next = myCats.filter((c) => c !== cat);
    } else if (myCats.length >= 5) {
      return;
    } else {
      next = [...myCats, cat];
    }
    setMyCats(next);
    await submitCategories(id, "demo-user", next);
    setCatTally(await getGroupCategories(id));
  };

  const handleGenerate = async () => {
    if (!id) return;
    setGenerating(true);
    const plan = await generateGroupPlanLocal(id);
    setPlans((prev) => [...prev, plan]);
    setGenerating(false);
  };

  const copyInvite = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!group)
    return (
      <Page>
        <Header eyebrow="Loading…" title="" />
      </Page>
    );

  return (
    <Page>
      <Header
        eyebrow={`${group.emoji} ${group.type.charAt(0).toUpperCase() + group.type.slice(1)} Group`}
        title={group.name}
      />
      <div style={{ padding: "0 20px 120px" }}>
        {/* Invite code */}
        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={copyInvite}
          style={{
            background: "rgba(255,255,255,.06)",
            borderRadius: 14,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            cursor: "pointer",
          }}
        >
          <div>
            <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 2 }}>INVITE CODE</div>
            <div style={{ fontFamily: "monospace", fontSize: 18, letterSpacing: 3 }}>
              {group.inviteCode}
            </div>
          </div>
          <span style={{ fontSize: 13, opacity: 0.6 }}>{copied ? "Copied!" : "Tap to copy"}</span>
        </motion.div>

        {/* Members */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, opacity: 0.4, marginBottom: 8 }}>
            MEMBERS ({group.members.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {group.members.map((m, i) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: `hsl(${(i * 90 + 200) % 360}, 60%, 50%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {m.displayName.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500 }}>{m.displayName}</span>
                  {m.role === "host" && (
                    <span style={{ fontSize: 11, opacity: 0.4, marginLeft: 6 }}>HOST</span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 10,
                    background:
                      m.status === "joined" ? "rgba(0,200,100,.15)" : "rgba(255,255,255,.06)",
                    color: m.status === "joined" ? "#0c6" : "rgba(255,255,255,.4)",
                  }}
                >
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category voting */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, opacity: 0.4, marginBottom: 4 }}>
            PICK YOUR VIBES (up to 5)
          </div>
          <div style={{ fontSize: 12, opacity: 0.3, marginBottom: 10 }}>{myCats.length}/5 selected</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {availCats.map((cat) => {
              const selected = myCats.includes(cat);
              const tally = catTally.find((t) => t.category === cat);
              return (
                <button
                  key={cat}
                  onClick={() => handleCatToggle(cat)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    border: "none",
                    cursor: "pointer",
                    background: selected ? "var(--accent)" : "rgba(255,255,255,.07)",
                    color: selected ? "#000" : "#fff",
                    fontWeight: selected ? 600 : 400,
                    position: "relative",
                  }}
                >
                  {cat}
                  {tally && tally.votes > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        background: "#e74c3c",
                        color: "#fff",
                        fontSize: 9,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                      }}
                    >
                      {tally.votes}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Group favorites tally */}
        {catTally.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, opacity: 0.4, marginBottom: 8 }}>GROUP FAVORITES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {catTally.slice(0, 5).map((t) => (
                <div key={t.category} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      background: "rgba(255,255,255,.08)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min((t.votes / group.members.length) * 100, 100)}%`,
                        height: "100%",
                        background: "var(--accent)",
                        borderRadius: 3,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, width: 100, textAlign: "right" }}>{t.category}</span>
                  <span style={{ fontSize: 11, opacity: 0.3, width: 20 }}>{t.votes}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate plan */}
        <button
          className="action-btn"
          onClick={handleGenerate}
          disabled={generating}
          style={{ width: "100%", marginBottom: 20 }}
        >
          {generating ? "AI is curating your plan…" : "✨ Generate AI Plan"}
        </button>

        {/* Plans list */}
        {plans.length > 0 && (
          <div>
            <div style={{ fontSize: 13, opacity: 0.4, marginBottom: 8 }}>PLANS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {plans.map((p) => {
                const pct =
                  p.totalVotes > 0
                    ? Math.round((p.consensusScore / p.totalVotes) * 100)
                    : 0;
                return (
                  <motion.div
                    key={p.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/groups/${id}/plan/${p.id}`)}
                    style={{
                      background: "rgba(255,255,255,.05)",
                      borderRadius: 14,
                      padding: 14,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{p.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        {p.subtitle && (
                          <div style={{ fontSize: 12, opacity: 0.4 }}>{p.subtitle}</div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "3px 10px",
                          borderRadius: 10,
                          background:
                            p.status === "approved"
                              ? "rgba(0,200,100,.15)"
                              : "rgba(255,255,255,.06)",
                          color:
                            p.status === "approved" ? "#0c6" : "rgba(255,255,255,.5)",
                        }}
                      >
                        {p.status}
                      </span>
                    </div>
                    {p.totalVotes > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 2,
                            background: "rgba(255,255,255,.08)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              background: pct >= 80 ? "#0c6" : "var(--accent)",
                              borderRadius: 2,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, opacity: 0.4 }}>{pct}%</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}

/* ═══════════════════════════════════════════════════════════
   GroupPlanView — voting, refine, approve
   ═══════════════════════════════════════════════════════════ */
export function GroupPlanView() {
  const { id, planId } = useParams<{ id: string; planId: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<GroupPlan | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [refining, setRefining] = useState(false);

  useEffect(() => {
    if (planId) setPlan(getPlan(planId));
    if (id) setGroup(getGroup(id));
  }, [id, planId]);

  const handleVote = async (stopId: string, vote: VoteValue) => {
    if (!planId) return;
    voteOnStop(planId, stopId, "demo-user", "Tyrone", vote);
    setPlan(getPlan(planId));
  };

  const handleRefine = async () => {
    if (!planId) return;
    setRefining(true);
    refinePlan(planId);
    setPlan(getPlan(planId));
    setRefining(false);
  };

  const handleApprove = async () => {
    if (!planId) return;
    approvePlan(planId);
    setPlan(getPlan(planId));
  };

  if (!plan || !group)
    return (
      <Page>
        <Header eyebrow="Loading…" title="" />
      </Page>
    );

  const pct =
    plan.totalVotes > 0
      ? Math.round((plan.consensusScore / plan.totalVotes) * 100)
      : 0;

  return (
    <Page>
      <Header
        eyebrow={`${group.emoji} ${group.name}`}
        title={`${plan.emoji} ${plan.name}`}
      />
      <div style={{ padding: "0 20px 120px" }}>
        {plan.subtitle && (
          <p style={{ opacity: 0.5, fontSize: 14, marginTop: -8, marginBottom: 16 }}>
            {plan.subtitle}
          </p>
        )}

        {/* Consensus bar */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              opacity: 0.4,
              marginBottom: 6,
            }}
          >
            <span>Group Consensus</span>
            <span>
              {pct}%{plan.status === "approved" ? " ✅ Approved" : ""}
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: "rgba(255,255,255,.08)",
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6 }}
              style={{
                height: "100%",
                borderRadius: 4,
                background:
                  pct >= 80
                    ? "linear-gradient(90deg, #0c6, #0ea)"
                    : "linear-gradient(90deg, var(--accent), #ff6b6b)",
              }}
            />
          </div>
        </div>

        {/* Stops */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {plan.stops.map((stop, i) => {
            const v = stop.venue;
            const myVote = stop.votes.find((vt) => vt.userId === "demo-user");
            return (
              <motion.div
                key={stop.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  background: "rgba(255,255,255,.05)",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                {/* Venue image header */}
                <div
                  style={{
                    position: "relative",
                    height: 120,
                    background: `url(${v.photoUrls?.[0] || v.photos?.[0] || ""}) center/cover`,
                    display: "flex",
                    alignItems: "flex-end",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(transparent 40%, rgba(0,0,0,.7))",
                    }}
                  />
                  <div
                    style={{
                      position: "relative",
                      padding: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        background: "var(--accent)",
                        color: "#000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{v.name}</div>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>
                        {v.city || v.address} · {stop.duration} min
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "3px 8px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          stop.score > 0
                            ? "rgba(0,200,100,.2)"
                            : stop.score < 0
                              ? "rgba(255,50,50,.2)"
                              : "rgba(255,255,255,.08)",
                        color:
                          stop.score > 0 ? "#0c6" : stop.score < 0 ? "#f33" : "#888",
                      }}
                    >
                      {stop.score > 0 ? "+" : ""}
                      {stop.score}
                    </div>
                  </div>
                </div>

                {/* Note & voting */}
                <div style={{ padding: "10px 14px 14px" }}>
                  {stop.note && (
                    <p style={{ fontSize: 13, opacity: 0.5, margin: "0 0 10px" }}>
                      {stop.note}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleVote(stop.id, "up")}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: 10,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 18,
                        background:
                          myVote?.vote === "up"
                            ? "rgba(0,200,100,.2)"
                            : "rgba(255,255,255,.06)",
                      }}
                    >
                      👍
                    </button>
                    <button
                      onClick={() => handleVote(stop.id, "down")}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: 10,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 18,
                        background:
                          myVote?.vote === "down"
                            ? "rgba(255,50,50,.2)"
                            : "rgba(255,255,255,.06)",
                      }}
                    >
                      👎
                    </button>
                  </div>
                  {/* Vote summary */}
                  {stop.votes.length > 0 && (
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      {stop.votes.map((vt) => (
                        <span
                          key={`${vt.userId}-${vt.votedAt}`}
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 8,
                            background:
                              vt.vote === "up"
                                ? "rgba(0,200,100,.1)"
                                : vt.vote === "down"
                                  ? "rgba(255,50,50,.1)"
                                  : "rgba(255,255,255,.05)",
                          }}
                        >
                          {vt.displayName}{" "}
                          {vt.vote === "up" ? "👍" : vt.vote === "down" ? "👎" : "😐"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          {plan.status !== "approved" && (
            <>
              <button
                className="action-btn"
                style={{ flex: 1, background: "rgba(255,255,255,.06)" }}
                onClick={handleRefine}
                disabled={refining}
              >
                {refining ? "Refining…" : "🔄 Refine Plan"}
              </button>
              <button className="action-btn" style={{ flex: 1 }} onClick={handleApprove}>
                ✅ Approve Plan
              </button>
            </>
          )}
          {plan.status === "approved" && (
            <button
              className="action-btn"
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #00c853, #00e5ff)",
              }}
              onClick={() => navigate("/itinerary")}
            >
              🚀 Launch Plan
            </button>
          )}
        </div>
      </div>
    </Page>
  );
}
