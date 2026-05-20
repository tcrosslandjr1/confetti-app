/**
 * Contracts Library Agent
 *
 * Full CRUD for the contracts, contract_versions, and documents tables.
 * Handles Supabase Storage uploads/downloads for the private 'contracts' bucket.
 * Provides expiration monitoring and alert flag management.
 */

import { supabase } from "@/integrations/supabase/client";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type ContractType =
  | "service_agreement"
  | "nda"
  | "partnership"
  | "sponsorship"
  | "influencer"
  | "vendor"
  | "license"
  | "employment"
  | "other";

export type ContractStatus =
  | "draft"
  | "pending_signature"
  | "active"
  | "expired"
  | "terminated"
  | "renewed";

export type DocumentCategory =
  | "invoice"
  | "proposal"
  | "receipt"
  | "report"
  | "legal"
  | "marketing"
  | "other";

export interface Contract {
  id: string;
  business_id: string | null;
  partner_id: string | null;
  title: string;
  type: ContractType;
  status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  auto_renew: boolean;
  renewal_terms: string | null;
  contract_value: number | null;
  payment_terms: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  file_type: string | null;
  signed_by: string | null;
  signed_at: string | null;
  notes: string | null;
  tags: string[];
  alert_30d_sent: boolean;
  alert_60d_sent: boolean;
  alert_90d_sent: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractVersion {
  id: string;
  contract_id: string;
  version_number: number;
  file_path: string;
  file_name: string;
  file_size_bytes: number | null;
  uploaded_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  business_id: string | null;
  partner_id: string | null;
  contract_id: string | null;
  category: DocumentCategory;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  file_size_bytes: number | null;
  file_type: string | null;
  tags: string[];
  uploaded_by: string | null;
  created_at: string;
}

export interface ExpiringContract {
  contract_id: string;
  title: string;
  business_id: string | null;
  partner_id: string | null;
  end_date: string;
  days_until_expiry: number;
  alert_level: "critical" | "warning" | "notice";
}

export type ContractCreateInput = Omit<
  Contract,
  "id" | "created_at" | "updated_at" | "alert_30d_sent" | "alert_60d_sent" | "alert_90d_sent"
>;

export type ContractUpdateInput = Partial<
  Omit<Contract, "id" | "created_at" | "updated_at">
>;

// ═══════════════════════════════════════════════════════════
// Storage helpers
// ═══════════════════════════════════════════════════════════

const BUCKET = "contracts";

/**
 * Build a deterministic storage path:
 *   contracts/<business_or_partner_id>/<contract_id>/<filename>
 */
function storagePath(
  ownerId: string,
  contractId: string,
  fileName: string
): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${ownerId}/${contractId}/${safe}`;
}

/**
 * Upload a file to the private contracts bucket.
 * Returns the storage path on success.
 */
export async function uploadContractFile(
  file: File,
  ownerId: string,
  contractId: string
): Promise<{ path: string; error: string | null }> {
  const path = storagePath(ownerId, contractId, file.name);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (error) return { path: "", error: error.message };
  return { path, error: null };
}

/**
 * Get a time-limited signed URL to view/download a contract file.
 * Default 1 hour expiry.
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, expiresIn);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/**
 * Delete a file from storage.
 */
export async function deleteStorageFile(
  filePath: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  return { error: error?.message ?? null };
}

// ═══════════════════════════════════════════════════════════
// Contracts — CRUD
// ═══════════════════════════════════════════════════════════

export async function listContracts(filters?: {
  status?: ContractStatus;
  type?: ContractType;
  business_id?: string;
  partner_id?: string;
  search?: string;
}): Promise<Contract[]> {
  let q = supabase
    .from("contracts")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.type) q = q.eq("type", filters.type);
  if (filters?.business_id) q = q.eq("business_id", filters.business_id);
  if (filters?.partner_id) q = q.eq("partner_id", filters.partner_id);
  if (filters?.search) q = q.ilike("title", `%${filters.search}%`);

  const { data, error } = await q;
  if (error) {
    console.error("[contracts-library] listContracts error:", error.message);
    return [];
  }
  return (data ?? []) as Contract[];
}

export async function getContract(id: string): Promise<Contract | null> {
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Contract;
}

export async function createContract(
  input: ContractCreateInput
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from("contracts")
    .insert(input)
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data?.id ?? null, error: null };
}

export async function updateContract(
  id: string,
  updates: ContractUpdateInput
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("contracts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function deleteContract(
  id: string
): Promise<{ error: string | null }> {
  // First delete the storage files
  const versions = await listContractVersions(id);
  for (const v of versions) {
    await deleteStorageFile(v.file_path);
  }

  // Delete the main contract file if exists
  const contract = await getContract(id);
  if (contract?.file_path) {
    await deleteStorageFile(contract.file_path);
  }

  const { error } = await supabase
    .from("contracts")
    .delete()
    .eq("id", id);

  return { error: error?.message ?? null };
}

// ═══════════════════════════════════════════════════════════
// Contract Versions
// ═══════════════════════════════════════════════════════════

export async function listContractVersions(
  contractId: string
): Promise<ContractVersion[]> {
  const { data, error } = await supabase
    .from("contract_versions")
    .select("*")
    .eq("contract_id", contractId)
    .order("version_number", { ascending: false });

  if (error) return [];
  return (data ?? []) as ContractVersion[];
}

export async function createContractVersion(
  contractId: string,
  file: File,
  ownerId: string,
  uploadedBy: string | null,
  notes?: string
): Promise<{ id: string | null; error: string | null }> {
  // Get next version number
  const existing = await listContractVersions(contractId);
  const nextVersion = existing.length > 0
    ? Math.max(...existing.map((v) => v.version_number)) + 1
    : 1;

  // Upload file
  const { path, error: uploadErr } = await uploadContractFile(
    file,
    ownerId,
    contractId
  );
  if (uploadErr) return { id: null, error: uploadErr };

  // Insert version record
  const { data, error } = await supabase
    .from("contract_versions")
    .insert({
      contract_id: contractId,
      version_number: nextVersion,
      file_path: path,
      file_name: file.name,
      file_size_bytes: file.size,
      uploaded_by: uploadedBy,
      notes: notes ?? null,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };

  // Update the main contract's file info to point to latest version
  await updateContract(contractId, {
    file_path: path,
    file_name: file.name,
    file_size_bytes: file.size,
    file_type: file.type,
  });

  return { id: data?.id ?? null, error: null };
}

// ═══════════════════════════════════════════════════════════
// Documents Library
// ═══════════════════════════════════════════════════════════

export async function listDocuments(filters?: {
  category?: DocumentCategory;
  business_id?: string;
  contract_id?: string;
  search?: string;
}): Promise<DocumentRecord[]> {
  let q = supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.business_id) q = q.eq("business_id", filters.business_id);
  if (filters?.contract_id) q = q.eq("contract_id", filters.contract_id);
  if (filters?.search) q = q.ilike("title", `%${filters.search}%`);

  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as DocumentRecord[];
}

export async function uploadDocument(
  file: File,
  meta: {
    title: string;
    category: DocumentCategory;
    description?: string;
    business_id?: string;
    partner_id?: string;
    contract_id?: string;
    tags?: string[];
    uploaded_by?: string;
  }
): Promise<{ id: string | null; error: string | null }> {
  const ownerId = meta.business_id ?? meta.partner_id ?? "general";
  const docId = crypto.randomUUID();
  const path = `docs/${ownerId}/${docId}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });

  if (uploadErr) return { id: null, error: uploadErr.message };

  const { data, error } = await supabase
    .from("documents")
    .insert({
      title: meta.title,
      category: meta.category,
      description: meta.description ?? null,
      business_id: meta.business_id ?? null,
      partner_id: meta.partner_id ?? null,
      contract_id: meta.contract_id ?? null,
      file_path: path,
      file_name: file.name,
      file_size_bytes: file.size,
      file_type: file.type,
      tags: meta.tags ?? [],
      uploaded_by: meta.uploaded_by ?? null,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data?.id ?? null, error: null };
}

export async function deleteDocument(
  id: string
): Promise<{ error: string | null }> {
  // Get the doc to find file path
  const { data } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", id)
    .single();

  if (data?.file_path) {
    await deleteStorageFile(data.file_path);
  }

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id);

  return { error: error?.message ?? null };
}

// ═══════════════════════════════════════════════════════════
// Expiration monitoring
// ═══════════════════════════════════════════════════════════

/**
 * Query the get_expiring_contracts() SQL function.
 * Returns contracts expiring within `daysAhead` days.
 */
export async function getExpiringContracts(
  daysAhead = 90
): Promise<ExpiringContract[]> {
  const { data, error } = await supabase.rpc("get_expiring_contracts", {
    days_ahead: daysAhead,
  });

  if (error) {
    console.error("[contracts-library] getExpiringContracts error:", error.message);
    return [];
  }
  return (data ?? []) as ExpiringContract[];
}

/**
 * Mark an alert flag as sent so we don't re-alert.
 */
export async function markAlertSent(
  contractId: string,
  alertLevel: "30d" | "60d" | "90d"
): Promise<void> {
  const field =
    alertLevel === "30d"
      ? "alert_30d_sent"
      : alertLevel === "60d"
        ? "alert_60d_sent"
        : "alert_90d_sent";

  await supabase
    .from("contracts")
    .update({ [field]: true })
    .eq("id", contractId);
}

/**
 * Check for expiring contracts and create admin alerts for any
 * that haven't been alerted yet. Returns the count of new alerts created.
 */
export async function runExpirationCheck(): Promise<number> {
  const expiring = await getExpiringContracts(90);
  let alertCount = 0;

  for (const c of expiring) {
    // Determine which alert level to send
    let alertKey: "30d" | "60d" | "90d" | null = null;

    if (c.days_until_expiry <= 30 && c.alert_level === "critical") {
      alertKey = "30d";
    } else if (c.days_until_expiry <= 60 && c.alert_level === "warning") {
      alertKey = "60d";
    } else if (c.days_until_expiry <= 90 && c.alert_level === "notice") {
      alertKey = "90d";
    }

    if (!alertKey) continue;

    // Check if already sent by fetching the contract
    const contract = await getContract(c.contract_id);
    if (!contract) continue;

    const flagField =
      alertKey === "30d"
        ? "alert_30d_sent"
        : alertKey === "60d"
          ? "alert_60d_sent"
          : "alert_90d_sent";

    if (contract[flagField]) continue; // Already sent

    // Create an admin alert (matches admin_alerts table schema)
    await supabase.from("admin_alerts").insert({
      category: "contract_expiration",
      source: "contracts_library",
      priority: c.alert_level === "critical" ? "critical" : c.alert_level === "warning" ? "high" : "medium",
      title: `Contract expiring in ${c.days_until_expiry} days: ${c.title}`,
      description: `Contract "${c.title}" expires on ${c.end_date}. ${c.days_until_expiry} days remaining.`,
      action_required: true,
      action_url: `/admin/contracts`,
      bundle_key: `contract_expiry_${c.contract_id}`,
      deadline_at: c.end_date,
      metadata: {
        contract_id: c.contract_id,
        business_id: c.business_id,
        partner_id: c.partner_id,
        end_date: c.end_date,
        alert_level: c.alert_level,
      },
    });

    // Mark alert as sent
    await markAlertSent(c.contract_id, alertKey);
    alertCount++;
  }

  return alertCount;
}

// ═══════════════════════════════════════════════════════════
// Stats (for dashboard cards)
// ═══════════════════════════════════════════════════════════

export interface ContractStats {
  total: number;
  active: number;
  expiringSoon: number; // within 90 days
  draft: number;
  pendingSignature: number;
  totalValue: number;
}

export async function getContractStats(): Promise<ContractStats> {
  const [allContracts, expiring] = await Promise.all([
    listContracts(),
    getExpiringContracts(90),
  ]);

  const totalValue = allContracts.reduce(
    (sum, c) => sum + (c.contract_value ?? 0),
    0
  );

  return {
    total: allContracts.length,
    active: allContracts.filter((c) => c.status === "active").length,
    expiringSoon: expiring.length,
    draft: allContracts.filter((c) => c.status === "draft").length,
    pendingSignature: allContracts.filter((c) => c.status === "pending_signature").length,
    totalValue,
  };
}
